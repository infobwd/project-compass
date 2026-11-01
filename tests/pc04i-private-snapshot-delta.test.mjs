// PC-04I: fictional-only private delta smoke, tamper and read-only regression.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,readdirSync,renameSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {encryptSnapshot} from '../tools/private-sync/sync.mjs';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {createPrivateWorkplanFile} from '../tools/private-plan/encrypted-workplan.mjs';
import {stageEncryptedRefresh,inspectEncryptedRefresh,activateEncryptedRefresh} from '../tools/private-sync/staged-refresh.mjs';
import {compareSelectedSnapshots,summarizeSnapshotDelta} from '../tools/private-sync/snapshot-delta.mjs';
import {readActivatedSnapshotDelta} from '../tools/private-sync/activated-snapshot-delta.mjs';
import {runSnapshotDeltaCLI} from '../tools/private-sync/snapshot-delta-cli.mjs';

const OWNER='fictional-owner',NAMES=[OWNER+'/fictional-one',OWNER+'/fictional-two'];
const PASS='fictional-test-only-passphrase',ID='c'.repeat(24),SHA='a'.repeat(40),ALT='b'.repeat(40);
const OLD='2026-11-01T00:00:00.000Z',NEW='2026-11-01T01:00:00.000Z',CLOCK=Date.parse('2026-11-01T02:00:00Z');
function snap(at,{fresh=false}={}){
 const repos=NAMES.map((fullName,i)=>{
  const prs=i===0?(fresh?[2,3,4]:[1,2,3]):(fresh?[8]:[8]);
  const issues=i===0?(fresh?[7,9]:[7]):(fresh?[]:[15]);
  return {fullName,repositoryId:1000+i,visibility:'private',defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:fresh&&i===0?ALT:SHA},
   openPRs:{state:'VERIFIED',count:prs.length,atLeast:prs.length,items:prs.map(n=>({
    number:n,draft:n===2?fresh:n%2===0,headSha:n===2&&fresh?ALT:SHA,base:'main'
   }))},
   openIssues:{state:'VERIFIED',count:issues.length,atLeast:issues.length,numbers:issues}};
 });
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:2,matched:2},inspectedRepositories:2,observedAt:at,projects:repos};
}
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'pc04i-synthetic-'));
 const selection={format:'BWD-COMPASS-SELECTION-V1',owner:OWNER,repositories:NAMES};
 writeFileSync(join(dir,'projects.selection.json'),JSON.stringify(selection)+'\n');
 const old=snap(OLD),fresh=snap(NEW,{fresh:true});
 writeFileSync(join(dir,'selected.snapshot.enc.json'),JSON.stringify(encryptSnapshot(old,PASS))+'\n');
 const projection=projectOfflineEvidence(old,NAMES,CLOCK);
 createPrivateWorkplanFile(createEmptyWorkplan(projection,{at:OLD}),projection,PASS,dir);
 const priorPlan=readFileSync(join(dir,'owner-workplan.enc.json'));
 const staged=stageEncryptedRefresh({folder:dir,passphrase:PASS,candidate:fresh,clock:CLOCK,id:ID});
 const preview=inspectEncryptedRefresh({folder:dir,passphrase:PASS,id:ID,clock:CLOCK});
 const activated=activateEncryptedRefresh({folder:dir,passphrase:PASS,id:ID,
  expectedStageDigest:preview.stageDigest,confirmed:true,clock:CLOCK});
 return {dir,priorPlan,old,fresh,staged,preview,activated,
  dispose(){rmSync(dir,{recursive:true,force:true});}};
}
test('PC04I two selected snapshots distinguish new OPEN from no-longer-observed OPEN',()=>{
 const delta=compareSelectedSnapshots(snap(OLD),snap(NEW,{fresh:true}),NAMES);
 assert.equal(delta.selected,2);
 assert.deepEqual(delta.projects[0].openPRs.nowObservedOpen,[4]);
 assert.deepEqual(delta.projects[0].openPRs.noLongerObservedOpen,[1]);
 assert.deepEqual(delta.projects[0].openIssues.nowObservedOpen,[9]);
 assert.deepEqual(delta.projects[1].openIssues.noLongerObservedOpen,[15]);
 assert.equal(delta.totals.oldOpenPRs,4);assert.equal(delta.totals.newOpenPRs,4);
 assert.equal(delta.totals.prsNewlyObservedOpen,1);
 assert.equal(delta.totals.prsNoLongerObservedOpen,1);
 assert.equal(delta.totals.oldOpenIssues,2);assert.equal(delta.totals.newOpenIssues,2);
 assert.equal(delta.totals.defaultHeadsChanged,1);
 assert.equal(delta.totals.prDraftChangedWhenBothObservedOpen,1);
 assert.equal(delta.totals.prHeadChangedWhenBothObservedOpen,1);
 assert.equal(delta.mergeInferred,false);assert.equal(delta.closureInferred,false);
 assert.equal(delta.deployInferred,false);assert.equal(delta.ownerTasksAdded,0);
});
test('PC04I default SHA UNKNOWN stays not comparable, never become same or changed',()=>{
 const old=snap(OLD),fresh=snap(NEW,{fresh:true});
 old.projects[1].defaultHead={state:'UNKNOWN',sha:null};
 fresh.projects[1].defaultHead={state:'UNKNOWN',sha:null};
 const d=compareSelectedSnapshots(old,fresh,NAMES);
 assert.equal(d.projects[1].git.defaultHeadChanged,null);
 assert.equal(d.totals.defaultHeadsNotComparable,1);
});
test('PC04I fail closed on duplicate refs, incomplete refs, wrong order and stale time',()=>{
 const old=snap(OLD),fresh=snap(NEW,{fresh:true});
 const variants=[
  x=>{x.projects[0].openPRs.items[1].number=x.projects[0].openPRs.items[0].number;},
  x=>{x.projects[0].openIssues.numbers.pop();},
  x=>{x.projects[0].openPRs.state='INCOMPLETE';x.projects[0].openPRs.count=null;},
  x=>{x.projects.reverse();},
  x=>{x.observedAt=OLD;},
  x=>{x.owner='other-owner';}
 ];
 for(const change of variants){
  const bad=structuredClone(fresh);change(bad);
  assert.throws(()=>compareSelectedSnapshots(old,bad,NAMES));
 }
});
test('PC04I summary must not contain private project names, SHA or reference IDs',()=>{
 const d=compareSelectedSnapshots(snap(OLD),snap(NEW,{fresh:true}),NAMES);
 const summary=summarizeSnapshotDelta(d),body=JSON.stringify(summary);
 assert.equal(summary.mode,'PC04I_SAVED_SNAPSHOT_DELTA_SUMMARY');
 assert.doesNotMatch(body,/fictional-one|fictional-two|fictional-owner|headSha|repository|number/);
 assert.equal(summary.privateProjectNamesIncluded,false);
 assert.equal(summary.noWrites,true);assert.equal(summary.hostVerified,false);
});
test('PC04I activated stage + exact matching encrypted backup can be inspected without writes',()=>{
 const f=fixture();
 try{
  const files=readdirSync(f.dir).sort();
  const oldActive=readFileSync(join(f.dir,'selected.snapshot.enc.json'));
  const checked=readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID});
  assert.equal(checked.backupDigestVerified,true);
  assert.equal(checked.activeMatchesActivatedStage,true);
  assert.equal(checked.ownerWorkplanValidatedBoth,true);
  assert.equal(checked.summary.selected,2);
  assert.equal(checked.summary.totals.prsNewlyObservedOpen,1);
  assert.equal(checked.summary.totals.prsNoLongerObservedOpen,1);
  assert.deepEqual(readFileSync(join(f.dir,'selected.snapshot.enc.json')),oldActive);
  assert.deepEqual(readFileSync(join(f.dir,'owner-workplan.enc.json')),f.priorPlan);
  assert.deepEqual(readdirSync(f.dir).sort(),files);
 }finally{f.dispose();}
});
test('PC04I rejects wrong passphrase, malformed Stage ID or changed encrypted active',()=>{
 const f=fixture();
 try{
  assert.throws(()=>readActivatedSnapshotDelta({folder:f.dir,passphrase:'wrong-passphrase-12345',stageId:ID}));
  assert.throws(()=>readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:'../../backup'}));
  writeFileSync(join(f.dir,'selected.snapshot.enc.json'),
   JSON.stringify(encryptSnapshot(f.old,PASS))+'\n');
  assert.throws(()=>readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID}),
   /ACTIVE_NOT_MATCHING_STAGE/);
  assert.deepEqual(readFileSync(join(f.dir,'owner-workplan.enc.json')),f.priorPlan);
 }finally{f.dispose();}
});
test('PC04I refuses if the matching old encrypted backup disappears',()=>{
 const f=fixture();
 try{
  const backup=readdirSync(f.dir).find(n=>n.startsWith('selected.snapshot.backup-'));
  assert.ok(backup);
  renameSync(join(f.dir,backup),join(f.dir,'offline-private-copy.enc.json'));
  assert.throws(()=>readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID}),
   /PREVIOUS_ENCRYPTED_BACKUP_MISSING/);
 }finally{f.dispose();}
});
test('PC04I CLI --help only and malformed arguments do not enter private IO',async()=>{
 const help=await runSnapshotDeltaCLI(['--help'],{});
 assert.equal(help.mode,'HELP');
 await assert.rejects(()=>runSnapshotDeltaCLI(['--details','--stage-id','fake'],{}),
  /PC04I_INVALID_ARGUMENTS/);
 await assert.rejects(()=>runSnapshotDeltaCLI(['--summary','--stage-id','../../secret'],{}),
  /PC04I_INVALID_ARGUMENTS/);
});
test('PC04I no browser/network/write imports, public app remains fictional-only',()=>{
 const src=readFileSync(fileURLToPath(new URL('../tools/private-sync/activated-snapshot-delta.mjs',import.meta.url)),'utf8');
 const model=readFileSync(fileURLToPath(new URL('../tools/private-sync/snapshot-delta.mjs',import.meta.url)),'utf8');
 const cli=readFileSync(fileURLToPath(new URL('../tools/private-sync/snapshot-delta-cli.mjs',import.meta.url)),'utf8');
 const publicApp=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(src+model+cli,/fetch\(|createServer\(|writeFileSync\(|renameSync\(|unlinkSync\(|commitOwnerRevision\(/);
 assert.doesNotMatch(publicApp,/snapshot-delta|activated-snapshot-delta|PC04I/);
 assert.match(cli,/confirmed!=='DISPLAY'/);
 assert.match(cli,/No GitHub queries, writes, task changes/);
});
