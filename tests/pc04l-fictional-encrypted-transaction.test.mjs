// PC-04L: synthetic-only encrypted owner TODO transaction tests.
// All writes stay inside a fresh disposable OS temp folder. Never real private data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptSnapshot} from '../tools/private-sync/sync.mjs';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {createPrivateWorkplanFile,readPrivateWorkplanFile} from '../tools/private-plan/encrypted-workplan.mjs';
import {stageEncryptedRefresh,inspectEncryptedRefresh,activateEncryptedRefresh} from '../tools/private-sync/staged-refresh.mjs';
import {readActivatedSnapshotDelta} from '../tools/private-sync/activated-snapshot-delta.mjs';
import {inspectRevision,commitOwnerRevision} from '../tools/private-plan/workplan-revision.mjs';
import {selectOwnerDeltaReference,validateCurrentGithubRead,prepareOwnerReviewedDeltaAction} from '../tools/private-plan/delta-action-handoff.mjs';

const OWNER='fictional-owner',REPO=OWNER+'/fictional-school',PASS='synthetic-only-test-passphrase';
const ID='d'.repeat(24),SHA='a'.repeat(40);
const OLD='2026-11-01T00:00:00.000Z',NEW='2026-11-01T01:00:00.000Z';
const LIVE='2026-11-01T02:00:00.000Z',SAVE='2026-11-01T02:00:01.000Z';
const CLOCK=Date.parse(LIVE),REF={projectIndex:0,kind:'PR',change:'NEW_OPEN',number:18};
function snapshot(at,prs){
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,observedAt:at,
  projects:[{repositoryId:123,fullName:REPO,visibility:'private',defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:prs.length,atLeast:prs.length,
    items:prs.map(number=>({number,draft:false,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:1,atLeast:1,numbers:[3]}}]};
}
function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'pc04l-fictional-'));
 try{
  const before=snapshot(OLD,[17]),after=snapshot(NEW,[17,18]);
  writeFileSync(join(dir,'projects.selection.json'),JSON.stringify({
   format:'BWD-COMPASS-SELECTION-V1',owner:OWNER,repositories:[REPO]})+'\n');
  writeFileSync(join(dir,'selected.snapshot.enc.json'),
   JSON.stringify(encryptSnapshot(before,PASS))+'\n');
  const oldProjection=projectOfflineEvidence(before,[REPO],CLOCK);
  createPrivateWorkplanFile(createEmptyWorkplan(oldProjection,{at:OLD}),oldProjection,PASS,dir);
  stageEncryptedRefresh({folder:dir,passphrase:PASS,candidate:after,clock:CLOCK,id:ID});
  const preview=inspectEncryptedRefresh({folder:dir,passphrase:PASS,id:ID,clock:CLOCK});
  const activation=activateEncryptedRefresh({folder:dir,passphrase:PASS,id:ID,
   expectedStageDigest:preview.stageDigest,confirmed:true,clock:CLOCK});
  assert.equal(activation.backupCreated,true);
  return {dir,projection:projectOfflineEvidence(after,[REPO],CLOCK),
   file:join(dir,'owner-workplan.enc.json'),snapshot:join(dir,'selected.snapshot.enc.json'),
   files:()=>readdirSync(dir).sort(),dispose:()=>rmSync(dir,{recursive:true,force:true})};
 }catch(e){rmSync(dir,{recursive:true,force:true});throw e;}
}
function makeAction(f){
 const verified=readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID});
 assert.equal(verified.backupDigestVerified,true);
 assert.equal(verified.activeMatchesActivatedStage,true);
 const {plan,digest}=inspectRevision(f.dir,PASS,f.projection);
 const selected=selectOwnerDeltaReference(verified.diff,f.projection,plan,REF);
 const githubObservation=validateCurrentGithubRead({
  number:18,html_url:'https://github.com/'+REPO+'/pull/18',
  state:'open',merged_at:null,draft:false,head:{sha:SHA},
  base:{repo:{full_name:REPO},ref:'main'}
 },selected,{at:LIVE});
 const prepared=prepareOwnerReviewedDeltaAction({
  delta:verified.diff,projection:f.projection,workplan:plan,reference:REF,
  githubObservation,manualReviewed:true,title:'Fictional encrypted TODO pilot',
  priority:'P3',owner:'HUMAN',dueDate:null,nextStep:'Inspect synthetic fixture',
  reason:'Synthetic test only',id:'action-'+'1'.repeat(16),
  evidenceId:'review-'+'2'.repeat(16),at:SAVE});
 return {plan,digest,...prepared};
}
function backupNames(dir){
 return readdirSync(dir).filter(x=>x.startsWith('owner-workplan.enc.backup-')&&x.endsWith('.json'));
}
function save(f,c,confirmed=true,digest=c.digest){
 return commitOwnerRevision({directory:f.dir,passphrase:PASS,projection:f.projection,
  before:c.plan,after:c.revised,expectedDigest:digest,confirmed});
}

test('PC04L: synthetic encrypted commit adds exactly one TODO, owner evidence and immutable backup',()=>{
 const f=fixture();
 try{
  const old=readFileSync(f.file),oldSnapshot=readFileSync(f.snapshot);
  const filenames=f.files(),c=makeAction(f);
  assert.equal(c.preview.saved,false);
  assert.equal(c.preview.encryptedSaveRequiresSeparateConfirm,true);
  assert.equal(c.preview.hostVerified,false);
  const result=save(f,c);
  assert.equal(result.saved,true);
  assert.equal(result.encryptedBackupCreated,true);
  assert.equal(backupNames(f.dir).length,1);
  assert.equal(readFileSync(join(f.dir,backupNames(f.dir)[0])).equals(old),true);
  const after=readPrivateWorkplanFile(f.projection,PASS,f.dir);
  const project=after.projects[0];
  assert.equal(project.actions.length,1);
  assert.equal(project.evidence.length,1);
  assert.equal(project.actions[0].status,'TODO');
  assert.equal(project.actions[0].priority,'P3');
  assert.deepEqual(project.actions[0].evidenceIds,['review-'+'2'.repeat(16)]);
  assert.equal(project.evidence[0].kind,'OWNER_REVIEW');
  assert.equal(project.evidence[0].ref,'https://github.com/'+REPO+'/pull/18');
  assert.equal(project.deployment.state,'NOT_VERIFIED');
  assert.equal(project.decision.state,'NEEDS_REVIEW');
  assert.equal(readFileSync(f.snapshot).equals(oldSnapshot),true);
  assert.equal(f.files().length,filenames.length+1);
  assert.doesNotMatch(readFileSync(f.file,'utf8'),/fictional-school|Fictional encrypted TODO pilot/);
 }finally{f.dispose();}
});

test('PC04L: preview-only cancellation leaves encrypted file and directory unchanged',()=>{
 const f=fixture();
 try{
  const before=readFileSync(f.file),names=f.files();
  const c=makeAction(f);
  assert.equal(c.preview.saved,false);
  // Simulated CANCEL: no commit call by design.
  assert.equal(readFileSync(f.file).equals(before),true);
  assert.deepEqual(f.files(),names);
  assert.equal(backupNames(f.dir).length,0);
 }finally{f.dispose();}
});

test('PC04L: missing confirmation fails before backup or workplan modification',()=>{
 const f=fixture();
 try{
  const c=makeAction(f),before=readFileSync(f.file),names=f.files();
  assert.throws(()=>save(f,c,false),/owner confirmation required/);
  assert.equal(readFileSync(f.file).equals(before),true);
  assert.deepEqual(f.files(),names);
 }finally{f.dispose();}
});

test('PC04L: stale workplan SHA refuses write and leaves no lock or backup',()=>{
 const f=fixture();
 try{
  const c=makeAction(f),before=readFileSync(f.file),names=f.files();
  assert.throws(()=>save(f,c,true,'0'.repeat(64)),/stale read/);
  assert.equal(readFileSync(f.file).equals(before),true);
  assert.deepEqual(f.files(),names);
 }finally{f.dispose();}
});

test('PC04L: repeated owner-review of same reference fails closed without duplicate',()=>{
 const f=fixture();
 try{
  const c=makeAction(f);
  save(f,c);
  const after=readFileSync(f.file),names=f.files();
  const plan=readPrivateWorkplanFile(f.projection,PASS,f.dir);
  const delta=readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID}).diff;
  const picked=selectOwnerDeltaReference(delta,f.projection,plan,REF);
  const observed=validateCurrentGithubRead({
   number:18,html_url:'https://github.com/'+REPO+'/pull/18',
   state:'open',merged_at:null,draft:false,head:{sha:SHA},
   base:{repo:{full_name:REPO}}
  },picked,{at:'2026-11-01T02:01:00.000Z'});
  assert.throws(()=>prepareOwnerReviewedDeltaAction({
   delta,projection:f.projection,workplan:plan,reference:REF,
   githubObservation:observed,manualReviewed:true,title:'Fictional duplicate',
   priority:'P3',owner:'HUMAN',id:'action-'+'3'.repeat(16),
   evidenceId:'review-'+'4'.repeat(16),at:'2026-11-01T02:02:00.000Z'
  }),/EXISTING_ACTION_FOR_REFERENCE/);
  assert.equal(readFileSync(f.file).equals(after),true);
  assert.deepEqual(f.files(),names);
  assert.equal(backupNames(f.dir).length,1);
 }finally{f.dispose();}
});

test('PC04L: encrypted backup restores previous owner workplan in disposable test folder only',()=>{
 const f=fixture();
 try{
  const prior=readFileSync(f.file),oldSnapshot=readFileSync(f.snapshot);
  save(f,makeAction(f));
  const backup=join(f.dir,backupNames(f.dir)[0]);
  assert.equal(readFileSync(backup).equals(prior),true);
  // Recovery rehearsal is deliberately limited to this new temporary fixture.
  copyFileSync(backup,f.file);
  const restored=readPrivateWorkplanFile(f.projection,PASS,f.dir);
  assert.equal(restored.projects[0].actions.length,0);
  assert.equal(restored.projects[0].evidence.length,0);
  assert.equal(readFileSync(f.file).equals(prior),true);
  assert.equal(readFileSync(f.snapshot).equals(oldSnapshot),true);
  assert.equal(readActivatedSnapshotDelta({folder:f.dir,passphrase:PASS,stageId:ID}).noWrites,true);
 }finally{f.dispose();}
});

test('PC04L: missing activated stage rejects before any private workplan write',()=>{
 const f=fixture();
 try{
  const before=readFileSync(f.file),names=f.files();
  assert.throws(()=>readActivatedSnapshotDelta({
   folder:f.dir,passphrase:PASS,stageId:'0'.repeat(24)
  }));
  assert.equal(readFileSync(f.file).equals(before),true);
  assert.deepEqual(f.files(),names);
 }finally{f.dispose();}
});
