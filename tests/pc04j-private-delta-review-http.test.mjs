// PC-04J fictional-only local HTTP route / UX regression; all records are synthetic.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {compareSelectedSnapshots,summarizeSnapshotDelta} from '../tools/private-sync/snapshot-delta.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const NAME='fictional-owner/review-lab',SHA='a'.repeat(40),PAIR='A1B2C3D4E5F60708',
 OLD='2026-11-01T00:00:00.000Z',NEW='2026-11-01T01:00:00.000Z';
function snap(fresh){
 const prs=fresh?Array.from({length:26},(_,i)=>i+20):Array.from({length:25},(_,i)=>i+1);
 const issues=fresh?[12,13]:[11,12];
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},
  inspectedRepositories:1,observedAt:fresh?NEW:OLD,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:prs.length,atLeast:prs.length,
    items:prs.map(number=>({number,draft:false,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:issues.length,atLeast:issues.length,numbers:issues}}]};
}
async function run(fn,{optIn=true,withPlan=true}={}){
 const old=snap(false),fresh=snap(true),projection=projectOfflineEvidence(fresh,[NAME],Date.parse(NEW)+30000);
 const plan=createEmptyWorkplan(projection,{at:NEW});
 const diff=compareSelectedSnapshots(old,fresh,[NAME]);
 const app=await startOwnerLocalServer({projection,workplan:withPlan?plan:null,
  snapshotDelta:optIn?{diff,summary:summarizeSnapshotDelta(diff)}:null,pairCode:PAIR});
 const hit=(path,{method='GET',body,cookie,origin,host}={})=>new Promise((ok,fail)=>{
  let data;const headers={Host:host??'127.0.0.1:'+app.port};
  if(cookie)headers.Cookie=cookie;
  if(origin)headers.Origin=origin;
  if(body!==undefined){data=JSON.stringify(body);headers.Origin??='http://127.0.0.1:'+app.port;
   headers['Content-Type']='application/json';headers['X-BWD-Local']='1';}
  const req=request({hostname:'127.0.0.1',port:app.port,path,method,headers},res=>{
   const parts=[];res.on('data',x=>parts.push(x));
   res.on('end',()=>ok({status:res.statusCode,text:Buffer.concat(parts).toString('utf8'),headers:res.headers}));
  });req.on('error',fail);req.end(data);
 });
 try{await fn({hit,plan,app});}finally{await new Promise(ok=>app.server.close(ok));}
}
async function login(hit){
 const r=await hit('/session',{method:'POST',body:{code:PAIR}});assert.equal(r.status,200);
 return r.headers['set-cookie'][0].split(';')[0];
}
test('PC04J unpaired review routes 401 and static shell never renders private identities',async()=>{
 await run(async({hit})=>{
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0')).status,401);
  assert.equal((await hit('/api/delta/review/0/ISSUE/NO_LONGER_OPEN/0')).status,401);
  for(const path of ['/','/app.js','/style.css']){
   const res=await hit(path);assert.equal(res.status,200);
   assert.doesNotMatch(res.text,/fictional-owner|review-lab|selected\.snapshot\.enc\.json/);
  }
 });
});
test('PC04J paired pre-step-up remains 403, after step-up only 10 refs and no TODO',async()=>{
 await run(async({hit,plan})=>{
  const cookie=await login(hit);
  const uri='/api/delta/review/0/PR/NEW_OPEN/0';
  assert.equal((await hit(uri,{cookie})).status,403);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  const r=await hit(uri,{cookie}),d=JSON.parse(r.text);
  assert.equal(r.status,200);assert.match(r.headers['cache-control'],/no-store/);
  assert.equal(d.mode,'PC04J_PRIVATE_DELTA_REVIEW_PAGE');
  assert.equal(d.total,20);assert.equal(d.items.length,10);
  assert.equal(d.items[0].number,45);assert.equal(d.items[9].number,36);
  assert.equal(d.mergeInferred,false);assert.equal(d.ownerTasksAdded,0);
  assert.equal(plan.projects[0].actions.length,0);
  assert.doesNotMatch(r.text,/headSha|hostUrl|evidenceIds|owner-workplan|passphrase/);
  const next=JSON.parse((await hit('/api/delta/review/0/PR/NEW_OPEN/1',{cookie})).text);
  assert.deepEqual(next.items.map(x=>x.number),Array.from({length:10},(_,i)=>35-i));
 });
});
test('PC04J missing OPEN list is a review prompt, not proof of Merge/Close',async()=>{
 await run(async({hit})=>{
  const cookie=await login(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  const pr=JSON.parse((await hit('/api/delta/review/0/PR/NO_LONGER_OPEN/0',{cookie})).text);
  assert.equal(pr.total,19);assert.equal(pr.items[0].number,19);
  assert.ok(pr.items.every(x=>x.status==='REVIEW_SAVED_OPEN_LIST_CHANGE_NOT_LIVE'));
  assert.equal(pr.mergeInferred,false);assert.equal(pr.closeInferred,false);
  const issue=JSON.parse((await hit('/api/delta/review/0/ISSUE/NO_LONGER_OPEN/0',{cookie})).text);
  assert.deepEqual(issue.items.map(x=>x.number),[11]);
 });
});
test('PC04J malformed pages, cross-origin, POST and out-of-scope fail closed',async()=>{
 await run(async({hit,app})=>{
  const cookie=await login(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  for(const path of [
   '/api/delta/review/1/PR/NEW_OPEN/0','/api/delta/review/0/PR/NEW_OPEN/2',
   '/api/delta/review/0/PR/MERGED/0','/api/delta/review/0/TASK/NEW_OPEN/0',
   '/api/delta/review/0/PR/NEW_OPEN/-1','/api/delta/review/0/PR/NEW_OPEN/0?x=1'
  ])assert.equal((await hit(path,{cookie})).status,404);
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',
   {cookie,method:'POST',body:{}})).status,404);
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',
   {cookie,origin:'https://attacker.invalid'})).status,403);
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',
   {cookie,host:'localhost:'+app.port})).status,403);
 });
});
test('PC04J opt-in absent returns 404; logout invalidates prior review cookie',async()=>{
 await run(async({hit})=>{
  const cookie=await login(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',{cookie})).status,404);
 },{optIn:false});
 await run(async({hit})=>{
  const cookie=await login(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{cookie,method:'POST',body:{}})).status,204);
  assert.equal((await hit('/api/delta/review/0/PR/NEW_OPEN/0',{cookie})).status,401);
 });
});
test('PC04J UI uses existing unsaved owner worksheet; Public Pages remains separate',async()=>{
 await run(async({hit})=>{
  const html=(await hit('/')).text,js=(await hit('/app.js')).text;
  assert.match(html,/<div id="delta-review-worksheet" class="review-worksheet" hidden>/);
  assert.match(js,/function openDeltaReviewPage\(project,index,kind,change\)/);
  assert.match(js,/renderReviewWorksheet\(/);
  assert.match(js,/delta-review-worksheet/);
  assert.match(js,/ไม่ใช่หลักฐานว่า Merge หรือปิดงาน/);
  assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage/);
 });
 const publicApp=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(publicApp,/delta-review-queue|PC04J|delta-review-worksheet/);
 const source=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(source,/commitOwnerRevision\s*\(|createOwnerAction\s*\(/);
});
