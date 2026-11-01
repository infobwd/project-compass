import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readdirSync,readFileSync,writeFileSync,rmSync,openSync,closeSync,unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate,summarizeWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {createPrivateWorkplanFile,readPrivateWorkplanFile,WORKPLAN_FILE} from '../tools/private-plan/encrypted-workplan.mjs';
import {inspectRevision,commitOwnerRevision} from '../tools/private-plan/workplan-revision.mjs';

const owner='fictional-owner', repo=owner+'/only-demo', pass='synthetic-passphrase-not-a-real-secret';
const NOW='2026-11-01T06:00:00.000Z',AFTER='2026-11-01T06:01:00.000Z';
function projection(){
 const data={format:'BWD-COMPASS-REGISTRY-V1',owner,coverage:'ALL_SELECTED',
 selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,observedAt:NOW,
 projects:[{fullName:repo,defaultBranch:'main',
 defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
 openPRs:{state:'VERIFIED',count:2,atLeast:2},
 openIssues:{state:'VERIFIED',count:0,atLeast:0}}]};
 return projectOfflineEvidence(data,[repo],Date.parse(AFTER));
}
function action(now=AFTER){
 return {id:'task-demo-01',title:'ตรวจรายงานและบันทึกหลักฐาน',status:'TODO',priority:'P1',
  owner:'HUMAN',dueDate:null,evidenceIds:[],nextStep:'ตรวจหลักฐานฉบับล่าสุด',
  reason:'ยังไม่รับรองสถานะ',updatedAt:now};
}
function setup(){
 const dir=mkdtempSync(join(tmpdir(),'pc04b-private-')),p=projection(),
  before=createEmptyWorkplan(p,{at:NOW});
 createPrivateWorkplanFile(before,p,pass,dir);
 return {dir,p,before};
}
function change({p,before}){
 return prepareOwnerUpdate(before,p,repo,{actions:[action()]},{at:AFTER});
}
test('PC04B encrypts revision with backup; old encrypted bytes preserved separately',()=>{
 const f=setup();try{
  const {plan,digest}=inspectRevision(f.dir,pass,f.p);
  assert.deepEqual(plan,f.before);
  const old=readFileSync(join(f.dir,WORKPLAN_FILE),'utf8');
  const updated=change(f);
  const result=commitOwnerRevision({directory:f.dir,passphrase:pass,
   projection:f.p,before:f.before,after:updated,expectedDigest:digest,confirmed:true});
  assert.equal(result.saved,true);assert.equal(result.encryptedBackupCreated,true);
  const current=readFileSync(join(f.dir,WORKPLAN_FILE),'utf8');
  assert.notEqual(current,old);
  assert.doesNotMatch(current,/only-demo|ตรวจรายงาน|fictional-owner/);
  assert.deepEqual(readPrivateWorkplanFile(f.p,pass,f.dir),updated);
  const files=readdirSync(f.dir);
  const backups=files.filter(x=>x.startsWith('owner-workplan.enc.backup-'));
  assert.equal(backups.length,1);
  assert.equal(readFileSync(join(f.dir,backups[0]),'utf8'),old);
  assert.ok(!files.some(x=>x.endsWith('.tmp')||x.endsWith('.lock')));
  assert.equal(summarizeWorkplan(updated,f.p,{now:AFTER}).openActions,1);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('PC04B refuses save without explicit terminal confirmation and leaves original',()=>{
 const f=setup();try{
  const {digest}=inspectRevision(f.dir,pass,f.p),old=readFileSync(join(f.dir,WORKPLAN_FILE),'utf8');
  assert.throws(()=>commitOwnerRevision({directory:f.dir,passphrase:pass,projection:f.p,
   before:f.before,after:change(f),expectedDigest:digest,confirmed:false}),/confirmation/);
  assert.equal(readFileSync(join(f.dir,WORKPLAN_FILE),'utf8'),old);
  assert.equal(readdirSync(f.dir).length,1);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('PC04B stale digest and stale owner-reviewed object both fail closed',()=>{
 const f=setup();try{
  const {digest}=inspectRevision(f.dir,pass,f.p);
  assert.throws(()=>commitOwnerRevision({directory:f.dir,passphrase:pass,projection:f.p,
   before:f.before,after:change(f),expectedDigest:'a'.repeat(64),confirmed:true}),/stale read/);
  const other=structuredClone(f.before);other.projects[0].note='เจ้าของปรับแก้';
  assert.throws(()=>commitOwnerRevision({directory:f.dir,passphrase:pass,projection:f.p,
   before:other,after:prepareOwnerUpdate(other,f.p,repo,{actions:[action()]},{at:AFTER}),
   expectedDigest:digest,confirmed:true}),/differs from reviewed/);
  assert.equal(readdirSync(f.dir).filter(x=>x.startsWith('owner-workplan.enc.backup-')).length,0);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('PC04B pre-existing lock prevents competing writer and untouched original',()=>{
 const f=setup();let fd;
 try{
  const {digest}=inspectRevision(f.dir,pass,f.p),beforeText=readFileSync(join(f.dir,WORKPLAN_FILE),'utf8');
  const lock=join(f.dir,'owner-workplan.enc.lock');fd=openSync(lock,'wx');
  assert.throws(()=>commitOwnerRevision({directory:f.dir,passphrase:pass,projection:f.p,
   before:f.before,after:change(f),expectedDigest:digest,confirmed:true}));
  assert.equal(readFileSync(join(f.dir,WORKPLAN_FILE),'utf8'),beforeText);
 }finally{if(fd!==undefined)closeSync(fd);try{unlinkSync(join(f.dir,'owner-workplan.enc.lock'));}catch{}
  rmSync(f.dir,{recursive:true,force:true});}
});
test('PC04B incorrect passphrase and mismatched scope reject decrypt/revision',()=>{
 const f=setup();try{
  assert.throws(()=>inspectRevision(f.dir,'wrong-passphrase-with-length',f.p));
  const mismatch=structuredClone(f.p);mismatch.projects[0].id=owner+'/other';
  assert.throws(()=>inspectRevision(f.dir,pass,mismatch),/selection scope|order/);
  const {digest}=inspectRevision(f.dir,pass,f.p);
  const bad=structuredClone(change(f));
  bad.projects[0].actions[0].status='DONE_BY_OWNER';
  assert.throws(()=>commitOwnerRevision({directory:f.dir,passphrase:pass,projection:f.p,
   before:f.before,after:bad,expectedDigest:digest,confirmed:true}),/completed task/);
 }finally{rmSync(f.dir,{recursive:true,force:true});}
});
test('PC04B user-facing private entry is terminal-only; no public frontend/HTTP integration',async()=>{
 const {readFileSync}=await import('node:fs');
 const {fileURLToPath}=await import('node:url');
 const entry=readFileSync(fileURLToPath(new URL('../tools/private-plan/action-entry.mjs',import.meta.url)),'utf8');
 const app=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const server=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.match(entry,/Type CONFIRM to save encrypted revision/);
 assert.match(entry,/status:'TODO'/);
 assert.doesNotMatch(entry,/fetch\(|createServer\(|writeFileSync\(/);
 // Public Pages must have no private references; private local text may explain
 // how to use the separate owner-confirmed terminal CLI without importing it.
 assert.doesNotMatch(app,/action-entry\.mjs|workplan-revision\.mjs|owner-workplan\.enc\.json/);
 const serverImportLines=server.split('\n').filter(line=>/^\s*import\s/.test(line));
 assert.doesNotMatch(serverImportLines.join('\n'),/action-entry\.mjs|workplan-revision\.mjs/);
 assert.doesNotMatch(server,/\bimport\s*\(\s*['"][^'"]*(?:action-entry|workplan-revision)\.mjs/);
 assert.doesNotMatch(server,/commitOwnerRevision\s*\(|createOwnerAction\s*\(/);
 // Only session pairing, step-up, and logout use POST; never edit workplan via HTTP.
 assert.match(server,/if\(method==='POST'&&\['\/session','\/session\/details','\/session\/logout'\]\.includes\(path\)\)/);
});
