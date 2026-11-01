// PC-04O O1/O2 — fictional-only source/mode boundary regression.
// Never opens real encrypted files or the owner's local private directory.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const OWNER='fictional-only',REPO=OWNER+'/synthetic-project';
const PAIR='A1B2C3D4E5F60708';
const AT='2026-11-01T00:00:00.000Z';
function projection(){
 const saved={format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,observedAt:AT,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},
  inspectedRepositories:1,projects:[{fullName:REPO,defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:1,atLeast:1},
   openIssues:{state:'VERIFIED',count:0,atLeast:0}}]};
 return projectOfflineEvidence(saved,[REPO],Date.parse(AT));
}
async function withApp(callback,workplanMode=false){
 const p=projection();
 const app=await startOwnerLocalServer({
  projection:p,workplan:workplanMode?createEmptyWorkplan(p,{at:AT}):null,pairCode:PAIR
 });
 const hit=(path,opts={})=>new Promise((yes,no)=>{
  const headers={Host:'127.0.0.1:'+app.port,...opts.headers};
  let payload;
  if(opts.body!==undefined){
   payload=JSON.stringify(opts.body);
   headers.Origin='http://127.0.0.1:'+app.port;
   headers['Content-Type']='application/json';
   headers['X-BWD-Local']='1';
  }
  if(opts.cookie)headers.Cookie=opts.cookie;
  const req=request({hostname:'127.0.0.1',port:app.port,path,
   method:opts.method||'GET',headers},res=>{
    const parts=[];res.on('data',c=>parts.push(c));
    res.on('end',()=>yes({status:res.statusCode,
     body:Buffer.concat(parts).toString('utf8'),headers:res.headers}));
  });req.on('error',no);req.end(payload);
 });
 try{await callback({hit,app});}
 finally{await new Promise(resolve=>app.server.close(resolve));}
}
async function pair(hit){
 const response=await hit('/session',{method:'POST',body:{code:PAIR}});
 assert.equal(response.status,200);
 return response.headers['set-cookie'][0].split(';')[0];
}

test('PC04O: locked public shell has neutral scope placeholder and no private fixture IDs',async()=>{
 await withApp(async({hit})=>{
  const html=await hit('/'),js=await hit('/app.js'),css=await hit('/style.css');
  for(const r of [html,js,css]){
   assert.equal(r.status,200);
   assert.match(r.headers['cache-control'],/no-store/);
   assert.doesNotMatch(r.body,/fictional-only|synthetic-project|selected\.snapshot\.enc\.json/);
  }
  assert.match(html.body,/id="data-scope"[^>]*hidden/);
  assert.match(html.body,/id="private" hidden/);
  assert.match(js.body,/NOT_LOADED/);
  assert.match(js.body,/ไม่ได้แปลว่าไม่มีงานค้าง/);
  assert.match(js.body,/status:res\.status/);
  assert.doesNotMatch(js.body,/innerHTML|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotThrow(()=>new Function(js.body));
  assert.match(css.body,/@media\(max-width:600px\)/);
 });
});

test('PC04O: Snapshot-only optional endpoints remain 401 before pairing, then 404, without false DONE',async()=>{
 await withApp(async({hit})=>{
  const missing=['/api/workplan/summary','/api/morning/summary',
   '/api/candidates/summary','/api/delta/summary'];
  for(const path of ['/api/summary','/api/projects',...missing]){
   assert.equal((await hit(path)).status,401,path);
  }
  const cookie=await pair(hit);
  const summary=await hit('/api/summary',{cookie});
  assert.equal(summary.status,200);
  const body=JSON.parse(summary.body);
  assert.equal(body.deployment,'NOT_VERIFIED');
  assert.equal(body.acceptance,'NOT_VERIFIED');
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  for(const path of missing){
   assert.equal((await hit(path,{cookie})).status,404,path);
  }
  assert.equal((await hit('/api/summary',{cookie})).status,200);
 });
});

test('PC04O: explicit step-up, logout and old-cookie revocation unchanged by labels',async()=>{
 await withApp(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const projects=await hit('/api/projects',{cookie});
  assert.equal(projects.status,200);
  assert.equal(JSON.parse(projects.body).projects.length,1);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  for(const path of ['/api/summary','/api/projects','/api/workplan/summary']){
   assert.equal((await hit(path,{cookie})).status,401,path);
  }
  assert.equal((await hit('/session',{method:'POST',body:{code:PAIR}})).status,401);
 });
});

test('PC04O: optional Workplan explicitly loaded returns 200, still no browser writer',async()=>{
 await withApp(async({hit})=>{
  const cookie=await pair(hit);
  const data=await hit('/api/workplan/summary',{cookie});
  assert.equal(data.status,200);
  assert.match(data.body,/OWNER_PRIVATE_WORKPLAN_SUMMARY/);
  assert.doesNotMatch(data.body,/fictional-only\/synthetic-project/);
  assert.equal((await hit('/api/delta/summary',{cookie})).status,404);
  for(const path of ['/api/todo/create','/api/workplan/save','/api/delta/activate']){
   assert.equal((await hit(path,{method:'POST',body:{},cookie})).status,404,path);
  }
 },true);
});
