// PC-04G — all private refresh regressions use fictional owner metadata and disposable OS temp folders.
// No live GitHub, secrets, real project identifiers or production files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptSnapshot,decryptSnapshot} from '../tools/private-sync/sync.mjs';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {createPrivateWorkplanFile} from '../tools/private-plan/encrypted-workplan.mjs';
import {stageEncryptedRefresh,inspectEncryptedRefresh,activateEncryptedRefresh,
 preflightEncryptedRefresh} from '../tools/private-sync/staged-refresh.mjs';
import {runRefreshCLI,safeRefreshErrorCode} from '../tools/private-sync/staged-refresh-cli.mjs';

const OWNER='fictional-owner',NAME=OWNER+'/fictional-repo',PASS='fictional-test-passphrase-never-real';
const OLD='2026-11-01T00:00:00.000Z',NEW='2026-11-01T01:00:00.000Z',CLOCK=Date.parse('2026-11-01T02:00:00Z');
const ID='b'.repeat(24),SHA='a'.repeat(40);
function snapshot({at=OLD,pr=1,issue=0,owner=OWNER,project=NAME}={}){
 return {format:'BWD-COMPASS-REGISTRY-V1',owner,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  observedAt:at,projects:[{
   repositoryId:1001,fullName:project,visibility:'private',defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:pr,atLeast:pr,
    items:Array.from({length:pr},(_,i)=>({number:i+1,draft:i%2===0,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:issue,atLeast:issue,
    numbers:Array.from({length:issue},(_,i)=>i+5)}
  }]};
}
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'pc04g-fake-'));
 const selection={format:'BWD-COMPASS-SELECTION-V1',owner:OWNER,repositories:[NAME]};
 writeFileSync(join(dir,'projects.selection.json'),JSON.stringify(selection)+'\n',{mode:0o600});
 const original=JSON.stringify(encryptSnapshot(snapshot(),PASS))+'\n';
 writeFileSync(join(dir,'selected.snapshot.enc.json'),original,{mode:0o600});
 const p=projectOfflineEvidence(snapshot(),[NAME],CLOCK);
 const w=createEmptyWorkplan(p,{at:OLD});
 createPrivateWorkplanFile(w,p,PASS,dir);
 return {dir,original,workplanBefore:readFileSync(join(dir,'owner-workplan.enc.json'),'utf8'),
  cleanup(){rmSync(dir,{recursive:true,force:true});}};
}
const candidate=()=>snapshot({at:NEW,pr:2,issue:1});
test('PC04G preflight checks active encrypted Snapshot and owner workplan without writing',()=>{
 const f=fixture();
 try{
  const before=readdirSync(f.dir).sort();
  const r=preflightEncryptedRefresh({folder:f.dir,passphrase:PASS});
  assert.equal(r.owner,OWNER);assert.deepEqual(r.selectedRepositories,[NAME]);
  assert.deepEqual(readdirSync(f.dir).sort(),before);
  assert.equal(r.mode,'PC04G_PREFLIGHT_NO_WRITES');
 }finally{f.cleanup();}
});
test('PC04G stage creates only encrypted candidate and leaves active Snapshot/workplan bytes intact',()=>{
 const f=fixture();
 try{
  const s=stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:candidate(),clock:CLOCK,id:ID});
  assert.equal(s.mode,'PC04G_STAGED_ENCRYPTED_ONLY');assert.equal(s.backupCreated,false);
  assert.equal(readFileSync(join(f.dir,'selected.snapshot.enc.json'),'utf8'),f.original);
  assert.equal(readFileSync(join(f.dir,'owner-workplan.enc.json'),'utf8'),f.workplanBefore);
  const text=readFileSync(join(f.dir,'snapshot-refresh-stage-'+ID+'.enc.json'),'utf8');
  assert.match(text,/BWD-COMPASS-SNAPSHOT-REFRESH-STAGE-V1/);
  assert.doesNotMatch(text,/fictional-owner|fictional-repo|repositoryId|openPRs/);
  assert.equal(readdirSync(f.dir).filter(n=>n.includes('.backup-')).length,0);
 }finally{f.cleanup();}
});
test('PC04G inspection is read-only, with accurate nonidentifying counts and freshness dates',()=>{
 const f=fixture();
 try{
  stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:candidate(),clock:CLOCK,id:ID});
  const before=readdirSync(f.dir).sort();
  const p=inspectEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,clock:CLOCK});
  assert.equal(p.selected,1);assert.equal(p.previousPRs,1);assert.equal(p.newPRs,2);
  assert.equal(p.previousIssues,0);assert.equal(p.newIssues,1);
  assert.equal(p.newObservedAt,NEW);assert.match(p.stageDigest,/^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(p),/fictional-owner|fictional-repo/);
  assert.deepEqual(readdirSync(f.dir).sort(),before);
 }finally{f.cleanup();}
});
test('PC04G activation refuses no confirmation and mismatched reviewed stage fingerprint',()=>{
 const f=fixture();
 try{
  stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:candidate(),clock:CLOCK,id:ID});
  const p=inspectEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,clock:CLOCK});
  assert.throws(()=>activateEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,
   expectedStageDigest:p.stageDigest,clock:CLOCK}),/OWNER_CONFIRMATION/);
  assert.throws(()=>activateEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,
   expectedStageDigest:'0'.repeat(64),confirmed:true,clock:CLOCK}),/STAGE_CHANGED_SINCE_PREVIEW/);
  assert.equal(readFileSync(join(f.dir,'selected.snapshot.enc.json'),'utf8'),f.original);
  assert.equal(readdirSync(f.dir).filter(n=>n.includes('backup-')).length,0);
 }finally{f.cleanup();}
});
test('PC04G activation backs up encrypted old Snapshot and changes active only after confirmation',()=>{
 const f=fixture();
 try{
  stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:candidate(),clock:CLOCK,id:ID});
  const p=inspectEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,clock:CLOCK});
  const result=activateEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,
   expectedStageDigest:p.stageDigest,confirmed:true,clock:CLOCK});
  assert.equal(result.mode,'PC04G_ACTIVATED_ENCRYPTED');assert.equal(result.backupCreated,true);
  const files=readdirSync(f.dir),backups=files.filter(n=>n.startsWith('selected.snapshot.backup-'));
  assert.equal(backups.length,1);
  assert.equal(readFileSync(join(f.dir,backups[0]),'utf8'),f.original);
  const active=JSON.parse(readFileSync(join(f.dir,'selected.snapshot.enc.json'),'utf8'));
  const decoded=decryptSnapshot(active,PASS);
  assert.equal(decoded.observedAt,NEW);assert.equal(decoded.projects[0].openPRs.count,2);
  assert.equal(readFileSync(join(f.dir,'owner-workplan.enc.json'),'utf8'),f.workplanBefore);
  assert.ok(files.some(n=>n.startsWith('snapshot-refresh-stage-')));
  assert.ok(!files.includes('selected.snapshot.refresh.lock'));
 }finally{f.cleanup();}
});
test('PC04G refuses stale active bytes or changed selection before activation, without creating backup',()=>{
 const f=fixture();
 try{
  stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:candidate(),clock:CLOCK,id:ID});
  const p=inspectEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,clock:CLOCK});
  writeFileSync(join(f.dir,'selected.snapshot.enc.json'),
   JSON.stringify(encryptSnapshot(snapshot(),PASS))+'\n',{mode:0o600});
  assert.throws(()=>activateEncryptedRefresh({folder:f.dir,passphrase:PASS,id:ID,
   expectedStageDigest:p.stageDigest,confirmed:true,clock:CLOCK}),/STALE_BASE_OR_SELECTION/);
  assert.equal(readdirSync(f.dir).filter(n=>n.startsWith('selected.snapshot.backup-')).length,0);
 }finally{f.cleanup();}
});
test('PC04G refuses incomplete or duplicate PR/Issue reference enumerations before any Stage file',()=>{
 for(const mutate of [
  x=>{x.projects[0].openPRs.items=[];},
  x=>{x.projects[0].openIssues.numbers=[5,5];x.projects[0].openIssues.count=2;x.projects[0].openIssues.atLeast=2;},
  x=>{x.projects[0].openPRs.state='INCOMPLETE';x.projects[0].openPRs.count=null;},
  x=>{x.projects[0].fullName='fictional-owner/other';}
 ]){
  const f=fixture();
  try{
   const bad=candidate();mutate(bad);
   assert.throws(()=>stageEncryptedRefresh({folder:f.dir,passphrase:PASS,candidate:bad,clock:CLOCK,id:ID}));
   assert.equal(readdirSync(f.dir).filter(n=>n.startsWith('snapshot-refresh-stage-')).length,0);
   assert.equal(readFileSync(join(f.dir,'selected.snapshot.enc.json'),'utf8'),f.original);
  }finally{f.cleanup();}
 }
});
test('PC04G CLI help/invalid argument parsing does not read private files',async()=>{
 const help=await runRefreshCLI(['--help'],{});
 assert.equal(help.mode,'HELP');
 await assert.rejects(()=>runRefreshCLI(['--activate','--stage-id','../../bad'],{}),/PC04G_INVALID_ARGUMENTS/);
 await assert.rejects(()=>runRefreshCLI(['--stage','--owner','fake'],{}),/PC04G_INVALID_ARGUMENTS/);
});

test('PC04G diagnostic classifier returns only allowlisted cause codes, not private metadata',()=>{
 const fake=[
  [Error('Invalid private workplan: selection scope'),'OWNER_WORKPLAN_SELECTION_MISMATCH'],
  [Error('Invalid private workplan: selected registry order mismatch'),'OWNER_WORKPLAN_SELECTION_MISMATCH'],
  [Error('Not an explicitly selected private snapshot'),'SELECTED_SNAPSHOT_SCOPE_INVALID'],
  [Error('PC04G_REFUSED_ENUMERATION_INCOMPLETE_PR'),'REFUSED_ENUMERATION_INCOMPLETE_PR'],
  [Error('GitHub read failed for fictional-owner/fictional-repo with passphrase FAKE-SECRET'),'UNCLASSIFIED_STOP'],
  [Object.assign(Error('Private file missing: C:\\FICTIONAL-PATH'),{code:'ENOENT'}),'PRIVATE_REQUIRED_FILE_MISSING'],
  [Object.assign(Error('Access denied C:\\FICTIONAL-PATH'),{code:'EACCES'}),'LOCAL_FILESYSTEM_ACCESS_DENIED']
 ];
 for(const [err,expected] of fake){
  const code=safeRefreshErrorCode(err);
  assert.equal(code,expected);
  assert.match(code,/^[A-Z0-9_]+$/);
  assert.doesNotMatch(code,/fictional-owner|fictional-repo|FAKE-SECRET|FICTIONAL-PATH/);
 }
});
test('PC04G diagnosis mode is explicitly preflight-only, while stage and activation remain manual',()=>{
 const file=readFileSync(new URL('../tools/private-sync/staged-refresh-cli.mjs',import.meta.url),'utf8');
 assert.match(file,/args\[0\]==='--diagnose'/);
 assert.match(file,/command\.operation==='diagnose'\)\s*return \{mode:'PRIVATE_PREFLIGHT_PASS'/);
 assert.ok(file.indexOf("if(command.operation==='diagnose')")<
   file.indexOf("const auth=spawnSync('gh',['auth','status']"));
 assert.match(file,/phase\('PRIVATE_PREFLIGHT'/);
 assert.match(file,/phase\('GITHUB_COLLECTION'/);
 assert.match(file,/phase\('ENCRYPTED_STAGING'/);
 assert.match(file,/if\(typed!=='ACTIVATE'\)return \{mode:'CANCELLED'/);
 assert.doesNotMatch(file,/console\.error\('PC-04G refused safely: '\+error\.message/);
});
