// PC-04A — tests use fictional project identifiers and temporary local folders ONLY.
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readFileSync as readSource} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,validateWorkplan,prepareOwnerUpdate,summarizeWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {encryptWorkplan,decryptWorkplan,createPrivateWorkplanFile,readPrivateWorkplanFile,WORKPLAN_FILE} from '../tools/private-plan/encrypted-workplan.mjs';

const owner='fictional-owner',names=[owner+'/alpha-test',owner+'/beta-test'];
const BASE='2026-11-01T06:00:00.000Z',pass='fictional-strong-passphrase';
function fixture(){
 return {format:'BWD-COMPASS-REGISTRY-V1',owner,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:2,matched:2},inspectedRepositories:2,observedAt:BASE,
  projects:names.map((fullName,i)=>({
   fullName,defaultBranch:i?'master':'main',
   defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:i?0:3,atLeast:i?0:3},
   openIssues:{state:'VERIFIED',count:i?1:0,atLeast:i?1:0}
  }))};
}
function projection(){return projectOfflineEvidence(fixture(),names,Date.parse('2026-11-01T07:00:00.000Z'));}
const make=()=>createEmptyWorkplan(projection(),{at:BASE});
const review=(id,kind='OWNER_REVIEW')=>({id,kind,ref:'local://evidence/'+id,observedAt:BASE,recordedBy:'OWNER',note:null});
test('PC04A initial owner workplan is fail-closed, exact selected scope and no invented tasks',()=>{
 const p=make();const q=projection();
 assert.equal(validateWorkplan(p,q),p);
 assert.deepEqual(p.scope.repositories,names);
 assert.equal(p.projects.length,2);
 for(const x of p.projects){
  assert.equal(x.development.state,'UNKNOWN');
  assert.equal(x.deployment.state,'NOT_VERIFIED');
  assert.equal(x.decision.state,'NEEDS_REVIEW');
  assert.deepEqual(x.actions,[]);
  assert.equal(x.localWorktree,null);
 }
 const a=summarizeWorkplan(p,q,{now:BASE});
 assert.equal(a.waitingDecision,2);
 assert.equal(a.openActions,0);
 assert.equal(a.suggestedOwnerReview.length,2);
 assert.ok(a.suggestedOwnerReview.every(x=>x.kind==='SUGGESTION_NOT_VERIFIED'));
 assert.equal(a.hostDeploymentInferredFromGit,false);
});
test('PC04A cannot claim accepted or deployed from Git HEAD or arbitrary note',()=>{
 const q=projection(),p=make();
 let wrong=structuredClone(p);wrong.projects[0].development.state='ACCEPTED_BY_OWNER';
 assert.throws(()=>validateWorkplan(wrong,q),/owner-reviewed/);
 wrong=structuredClone(p);wrong.projects[0].deployment.state='HOST_REVIEWED_BY_OWNER';
 assert.throws(()=>validateWorkplan(wrong,q),/host evidence/);
 wrong=structuredClone(p);wrong.projects[0].decision.state='APPROVED_BY_OWNER';
 assert.throws(()=>validateWorkplan(wrong,q),/owner-review evidence/);
 assert.equal(summarizeWorkplan(p,q).hostReviewedByOwner,0);
});
test('PC04A only explicit owner evidence supports accepted status and completed tasks',()=>{
 const q=projection(),p=make(),ev=review('review-01');
 const action={id:'next-01',title:'ตรวจเอกสารหลักฐานก่อนรับรอง',status:'DONE_BY_OWNER',
  priority:'P1',owner:'HUMAN',dueDate:null,evidenceIds:[ev.id],
  nextStep:null,reason:'เจ้าของรับรองจากหลักฐาน',updatedAt:BASE};
 const updated=prepareOwnerUpdate(p,q,names[0],{
  evidence:[ev],
  development:{state:'ACCEPTED_BY_OWNER',evidenceIds:[ev.id]},
  decision:{state:'APPROVED_BY_OWNER',evidenceIds:[ev.id]},
  actions:[action],
  lastReviewedAt:BASE
 },{at:BASE});
 assert.equal(updated.projects[0].development.state,'ACCEPTED_BY_OWNER');
 assert.equal(summarizeWorkplan(updated,q).developmentAcceptedByOwner,1);
 assert.equal(summarizeWorkplan(updated,q).openActions,0);
 assert.equal(p.projects[0].development.state,'UNKNOWN'); // immutable original
 const forged=structuredClone(updated);
 forged.projects[0].actions[0].evidenceIds=[];
 assert.throws(()=>validateWorkplan(forged,q),/completed task/);
});
test('PC04A host review requires HOST_CHECK evidence, not Git PR or owner prose',()=>{
 const q=projection(),p=make(),r=review('git-01','GITHUB_PR');
 p.projects[0].evidence=[r];
 p.projects[0].deployment={state:'HOST_REVIEWED_BY_OWNER',evidenceIds:[r.id]};
 assert.throws(()=>validateWorkplan(p,q),/host evidence/);
 p.projects[0].evidence.push(review('host-01','HOST_CHECK'));
 p.projects[0].deployment={state:'HOST_REVIEWED_BY_OWNER',evidenceIds:['host-01']};
 assert.doesNotThrow(()=>validateWorkplan(p,q));
});
test('PC04A rejects missing, duplicated or unselected repository and unknown keys',()=>{
 const q=projection(),p=make();
 assert.throws(()=>prepareOwnerUpdate(p,q,'foreign/unknown',{note:'not selected'},{at:BASE}),/nonselected/);
 const wrong=structuredClone(p);wrong.scope.repositories.reverse();
 assert.throws(()=>validateWorkplan(wrong,q),/selection scope/);
 const extra=structuredClone(p);extra.projects[0].isCompleted=true;
 assert.throws(()=>validateWorkplan(extra,q),/unexpected property/);
 const dup=structuredClone(p);dup.projects[1].repository=names[0];
 assert.throws(()=>validateWorkplan(dup,q),/order mismatch/);
});
test('PC04A prioritizes owner pending work, overdue only where explicit due date exists',()=>{
 const q=projection(),p=make(),a={id:'task-01',title:'ตรวจบนอุปกรณ์จริง',status:'BLOCKED',priority:'P0',
  owner:'HUMAN',dueDate:'2026-10-31',evidenceIds:[],nextStep:'เปิดเครื่องจริงและตรวจ',reason:'รอเครื่อง',
  updatedAt:BASE};
 const done=prepareOwnerUpdate(p,q,names[0],{actions:[a],blockers:['รออุปกรณ์จริง']},{at:BASE});
 const report=summarizeWorkplan(done,q,{now:BASE});
 assert.equal(report.openActions,1);
 assert.equal(report.overdueActions,1);
 assert.equal(report.ownerReviewed,0);
});
test('PC04A AES-GCM encrypted workplan round-trips and rejects wrong key or tamper',()=>{
 const plan=make(),e=encryptWorkplan(plan,pass);
 assert.equal(e.format,'BWD-COMPASS-OWNER-WORKPLAN-ENC-V1');
 assert.deepEqual(decryptWorkplan(e,pass),plan);
 assert.doesNotMatch(JSON.stringify(e),/alpha-test|beta-test|fictional-owner/);
 assert.throws(()=>decryptWorkplan(e,'wrong-fake-passphrase'),/./);
 const x={...e,tag:(e.tag[0]==='A'?'B':'A')+e.tag.slice(1)};
 assert.throws(()=>decryptWorkplan(x,pass),/./);
});
test('PC04A create-only private workplan file cannot overwrite existing evidence',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pc04a-private-'));
 try{
  const q=projection(),p=make();
  const first=createPrivateWorkplanFile(p,q,pass,dir);
  assert.equal(first.created,true);
  assert.equal(existsSync(join(dir,WORKPLAN_FILE)),true);
  const raw=readFileSync(first.path,'utf8');
  assert.doesNotMatch(raw,/alpha-test|beta-test/);
  assert.deepEqual(readPrivateWorkplanFile(q,pass,dir),p);
  assert.throws(()=>createPrivateWorkplanFile(p,q,pass,dir),/refusing overwrite/);
  assert.equal(readFileSync(first.path,'utf8'),raw);
  assert.throws(()=>readPrivateWorkplanFile(q,'wrong-fake-passphrase',dir),/./);
 }finally{rmSync(dir,{force:true,recursive:true});}
});
test('PC04A encrypted workplan refuses a changed selection even with correct passphrase',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pc04a-scope-'));
 try{
  const q=projection(),p=make();createPrivateWorkplanFile(p,q,pass,dir);
  const mutated=structuredClone(q);mutated.projects.reverse();
  assert.throws(()=>readPrivateWorkplanFile(mutated,pass,dir),/selection scope|order/);
 }finally{rmSync(dir,{force:true,recursive:true});}
});
test('PC04A PUBLIC Pages never import the private workplan; owner-local explicitly opt-in only',()=>{
 const source=readSource(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const local=readSource(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(source,/workplan-model|encrypted-workplan|owner-workplan\.enc\.json|PRIVATE_LOCAL_WORKPLAN/);
 assert.match(local,/--ack-private-workplan-local/);
 assert.match(local,/readPrivateWorkplanFile/);
 // The private page may DISPLAY a manual CLI instruction; text is not an import.
 // Disallow real static/dynamic module imports and server-side task revisions.
 const serverImportLines=local.split('\n').filter(line=>/^\s*import\s/.test(line));
 assert.doesNotMatch(serverImportLines.join('\n'),/workplan-revision\.mjs|action-entry\.mjs/);
 assert.doesNotMatch(local,/\bimport\s*\(\s*['"][^'"]*(?:workplan-revision|action-entry)\.mjs/);
 assert.match(local,/if\(method==='POST'&&\['\/session','\/session\/details','\/session\/logout'\]\.includes\(path\)\)/);
 assert.doesNotMatch(local,/commitOwnerRevision\s*\(|createOwnerAction\s*\(/);
});

test('PC04A CLI preflight reports only existence, never private project names',async()=>{
 const {runPrivateWorkplanCLI}=await import('../tools/private-plan/workplan-cli.mjs');
 const dir=mkdtempSync(join(tmpdir(),'pc04a-check-'));
 try{
  const r=await runPrivateWorkplanCLI(['--check'],{BWD_COMPASS_PRIVATE_DIR:dir});
  assert.equal(r.mode,'CHECK');
  assert.equal(r.workplanExists,false);
  assert.equal(r.writes,false);
  assert.doesNotMatch(JSON.stringify(r),/fictional-owner|alpha-test|beta-test/);
 }finally{rmSync(dir,{force:true,recursive:true});}
});
