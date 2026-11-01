// PC-04D2: localhost-only fictional Morning Brief API and privacy regression.
// NO actual project identifiers, snapshots, passphrases or private files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const OWNER='fictional-owner', NAME=OWNER+'/demo-portfolio';
const NOW='2026-11-01T00:00:00.000Z', CODE='A1B2C3D4E5F60708';
function projection(){
 return projectOfflineEvidence({format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},
  inspectedRepositories:1,observedAt:NOW,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:2,atLeast:2},openIssues:{state:'VERIFIED',count:1,atLeast:1}}]
 },[NAME],Date.parse(NOW)+3600000);
}
function workplan(q,{empty=false}={}){
 const p=createEmptyWorkplan(q,{at:NOW});
 if(empty)return p;
 return prepareOwnerUpdate(p,q,NAME,{actions:[{
  id:'synthetic-task',title:'ตรวจแผนสมมติ',status:'TODO',priority:'P0',
  owner:'HUMAN',dueDate:'2026-10-31',evidenceIds:[],
  nextStep:'ตรวจหลักฐานตัวอย่าง',reason:'local fictional only',
  updatedAt:'2026-11-01T00:01:00.000Z'
 }],localWorktree:'X:\\TOP-SECRET-NEVER-EXPOSE',hostUrl:'https://private.invalid/no-access',
 note:'Owner confidential note'}, {at:'2026-11-01T00:01:00.000Z'});
}
async function withServer(fn,{hasPlan=true,empty=false,now=()=>Date.parse('2026-11-01T18:00:00.000Z'),idleMs=300000}={}){
 const p=projection(),w=hasPlan?workplan(p,{empty}):null;
 const server=await startOwnerLocalServer({projection:p,workplan:w,pairCode:CODE,now,idleMs});
 const hit=(path,{method='GET',body,cookie,host,headers={}}={})=>new Promise((ok,no)=>{
  let payload;const h={Host:host??'127.0.0.1:'+server.port,...headers};
  if(body!==undefined){payload=JSON.stringify(body);h.Origin??='http://127.0.0.1:'+server.port;h['Content-Type']='application/json';h['X-BWD-Local']='1';}
  if(cookie)h.Cookie=cookie;
  const r=request({host:'127.0.0.1',port:server.port,path,method,headers:h},response=>{
   const chunks=[];response.on('data',x=>chunks.push(x));
   response.on('end',()=>ok({status:response.statusCode,headers:response.headers,text:Buffer.concat(chunks).toString('utf8')}));
  });r.on('error',no);r.end(payload);
 });
 try{await fn({hit,server});}finally{await new Promise(ok=>server.server.close(ok));}
}
async function pair(hit){
 const response=await hit('/session',{method:'POST',body:{code:CODE}});
 assert.equal(response.status,200);
 return response.headers['set-cookie'][0].split(';')[0];
}
test('PC04D2 HTTP unpaired clients receive 401 and never receive private data from static shell',async()=>{
 await withServer(async({hit})=>{
  for(const path of ['/api/morning/summary','/api/morning/details']){
   const r=await hit(path);assert.equal(r.status,401);assert.match(r.headers['cache-control'],/no-store/);
  }
  for(const path of ['/','/app.js','/style.css']){
   const r=await hit(path);assert.equal(r.status,200);
   assert.doesNotMatch(r.text,/fictional-owner|TOP-SECRET-NEVER-EXPOSE|private\.invalid|Owner confidential note|ตรวจแผนสมมติ/);
  }
 });
});
test('PC04D2 paired Morning Brief summary is nonidentifying and Bangkok-date aware',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit),r=await hit('/api/morning/summary',{cookie});
  assert.equal(r.status,200);
  const d=JSON.parse(r.text);
  assert.equal(d.mode,'OWNER_PRIVATE_MORNING_SUMMARY');
  assert.equal(d.dayBangkok,'2026-11-02'); // 18:00Z is next calendar day in Bangkok
  assert.equal(d.openActions,1);assert.equal(d.overdueActions,1);
  assert.equal(d.waitingDecision,1);assert.equal(d.reviewPrompts,1);
  assert.equal(d.liveGitHubChecked,false);assert.equal(d.deploymentInferred,false);
  assert.doesNotMatch(r.text,/fictional-owner|ตรวจแผนสมมติ|TOP-SECRET-NEVER-EXPOSE|private\.invalid|Owner confidential note/);
  assert.equal((await hit('/api/morning/details',{cookie})).status,403);
 });
});
test('PC04D2 after detail step-up shows only owner-entered TODO and labeled review gaps',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  const r=await hit('/api/morning/details',{cookie}),d=JSON.parse(r.text);
  assert.equal(r.status,200);assert.equal(d.mode,'OWNER_PRIVATE_MORNING_DETAILS');
  assert.equal(d.actions.length,1);assert.equal(d.actions[0].title,'ตรวจแผนสมมติ');
  assert.equal(d.actions[0].repository,NAME);assert.equal(d.actions[0].overdue,true);
  assert.equal(d.reviewPrompts[0].repository,NAME);
  assert.ok(d.reviewPrompts[0].missing.includes('OWNER_DECISION_PENDING'));
  assert.equal(d.source,'OWNER_LOCAL_REVIEW_PROMPTS_NOT_VERIFIED');
  assert.doesNotMatch(r.text,/TOP-SECRET-NEVER-EXPOSE|private\.invalid|Owner confidential note|evidenceIds|localWorktree|hostUrl|owner-workplan\.enc/);
  assert.equal((await hit('/api/morning/details',{cookie,method:'POST',body:{}})).status,404);
 });
});
test('PC04D2 empty owner plan remains zero recorded actions, with review prompt (not completion)',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);const s=JSON.parse((await hit('/api/morning/summary',{cookie})).text);
  assert.equal(s.openActions,0);assert.equal(s.waitingDecision,1);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  const d=JSON.parse((await hit('/api/morning/details',{cookie})).text);
  assert.deepEqual(d.actions,[]);assert.equal(d.reviewPrompts.length,1);
  assert.ok(d.reviewPrompts[0].missing.includes('NO_ACTION_RECORDED'));
 },{empty:true});
});
test('PC04D2 snapshot-only mode has no Morning Brief endpoints',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/api/morning/summary',{cookie})).status,404);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  assert.equal((await hit('/api/morning/details',{cookie})).status,404);
 },{hasPlan:false});
});
test('PC04D2 logout invalidates all morning endpoints, including previous cookie',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/morning/details',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{cookie,method:'POST',body:{}})).status,204);
  for(const path of ['/api/morning/summary','/api/morning/details']){
   assert.equal((await hit(path,{cookie})).status,401);
   assert.equal((await hit(path)).status,401);
  }
 });
});
test('PC04D2 hostile browser origin/Host denied even with paired detail cookie',async()=>{
 await withServer(async({hit,server})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  for(const opts of [{headers:{Origin:'https://hostile.invalid'}},
   {headers:{'Sec-Fetch-Site':'cross-site'}},
   {host:'localhost:'+server.port}]){
    assert.equal((await hit('/api/morning/details',{cookie,...opts})).status,403);
  }
  const valid=await hit('/api/morning/details',{cookie});
  assert.equal(valid.status,200);
  assert.equal(valid.headers['access-control-allow-origin'],undefined);
 });
});
test('PC04D2 browser UI displays Thai text via UTF-8 DOM and scrubs on logout, no public app imports',async()=>{
 await withServer(async({hit})=>{
  const page=(await hit('/')).text;
  const app=(await hit('/app.js')).text;
  assert.match(page,/<html lang="th">/);
  assert.match(page,/<meta charset="utf-8">/);
  assert.match(page,/id="morning" hidden/);
  assert.match(page,/สรุปงานวันนี้/);
  assert.match(app,/งานถัดไปที่เจ้าของบันทึกจริง/);
  assert.match(app,/สิ่งที่ควรตรวจสอบ — ยังไม่ใช่งานที่รับรองแล้ว/);
  assert.match(app,/el\('morning-detail'\)\.replaceChildren\(\)/);
  assert.doesNotMatch(app,/innerHTML|localStorage|sessionStorage/);
 });
 const pub=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(pub,/morning-brief|api\/morning|private-local|owner-workplan/);
});
