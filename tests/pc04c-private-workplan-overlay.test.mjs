// PC-04C: fictional owner workplan only. No real selected snapshot, files or GitHub requests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';

const OWNER='fictional-owner', NAME=OWNER+'/synthetic-portfolio';
const NOW='2026-11-01T00:00:00.000Z',CODE='A1B2C3D4E5F60708',PASS='test-only-never-real';
function projection(){
 const repo={fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
 openPRs:{state:'VERIFIED',count:2,atLeast:2},openIssues:{state:'VERIFIED',count:0,atLeast:0}};
 return projectOfflineEvidence({format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,observedAt:NOW,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[repo]},[NAME],Date.parse(NOW)+3600000);
}
function workplan(q){
 const original=createEmptyWorkplan(q,{at:NOW});
 return prepareOwnerUpdate(original,q,NAME,{actions:[{
  id:'fictional-action',title:'Synthetic follow-up task',status:'TODO',priority:'P1',
  owner:'HUMAN',dueDate:null,evidenceIds:[],nextStep:'Review fictional document',reason:'Unverified fixture',
  updatedAt:'2026-11-01T00:01:00.000Z'
 }],localWorktree:'X:\\PRIVATE-DO-NOT-LEAK',hostUrl:'https://secret.invalid/never',
 note:'Sensitive owner-only note'}, {at:'2026-11-01T00:01:00.000Z'});
}
async function withServer(fn,hasPlan=true,options={}){
 const q=projection(),p=hasPlan?workplan(q):null;
 const server=await startOwnerLocalServer({projection:q,workplan:p,pairCode:CODE,...options});
 const hit=(path='/',{method='GET',body,cookie,headers={},host}={})=>new Promise((yes,no)=>{
  const h={Host:host||'127.0.0.1:'+server.port,...headers};let payload;
  if(body!==undefined){payload=JSON.stringify(body);h.Origin??='http://127.0.0.1:'+server.port;h['Content-Type']??='application/json';h['X-BWD-Local']??='1';}
  if(cookie)h.Cookie=cookie;
  const req=request({host:'127.0.0.1',port:server.port,path,method,headers:h},r=>{
   const chunks=[];r.on('data',x=>chunks.push(x));r.on('end',()=>yes({status:r.statusCode,headers:r.headers,text:Buffer.concat(chunks).toString('utf8')}));
  });req.on('error',no);req.end(payload);
 });
 try{await fn({hit,server,q,p});}finally{await new Promise(ok=>server.server.close(ok));}
}
async function login(hit){
 const r=await hit('/session',{method:'POST',body:{code:CODE}});
 assert.equal(r.status,200);
 return r.headers['set-cookie'][0].split(';')[0];
}
test('PC04C workplan APIs deny unpaired clients and never expose private names in static shell',async()=>{
 await withServer(async({hit})=>{
  for(const path of ['/api/workplan/summary','/api/workplan/actions']){
   const r=await hit(path);assert.equal(r.status,401);assert.match(r.headers['cache-control'],/no-store/);
  }
  for(const path of ['/','/style.css','/app.js']){
   const r=await hit(path);assert.equal(r.status,200);
   assert.doesNotMatch(r.text,/fictional-owner|Synthetic follow-up task|PRIVATE-DO-NOT-LEAK|secret\.invalid|Sensitive owner-only note/);
  }
 });
});
test('PC04C aggregate count only after pairing, never reveals project names or private notes',async()=>{
 await withServer(async({hit})=>{
  const cookie=await login(hit);
  const r=await hit('/api/workplan/summary',{cookie});
  assert.equal(r.status,200);
  const data=JSON.parse(r.text);
  assert.equal(data.mode,'OWNER_PRIVATE_WORKPLAN_SUMMARY');
  assert.equal(data.selected,1);
  assert.equal(data.openActions,1);
  assert.equal(data.waitingDecision,1);
  assert.equal(data.source,'OWNER_MANAGED_NOT_GITHUB_LIVE');
  assert.doesNotMatch(r.text,/fictional-owner|Synthetic follow-up task|PRIVATE-DO-NOT-LEAK|secret\.invalid|Sensitive owner-only note/);
  assert.equal((await hit('/api/workplan/actions',{cookie})).status,403);
 });
});
test('PC04C detail step-up exposes only owner-authored actions, not worktrees, hosts or raw evidence',async()=>{
 await withServer(async({hit})=>{
  const cookie=await login(hit);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const r=await hit('/api/workplan/actions',{cookie});
  assert.equal(r.status,200);
  const d=JSON.parse(r.text);assert.equal(d.mode,'OWNER_PRIVATE_WORKPLAN_ACTIONS');
  assert.equal(d.totalActions,1);assert.equal(d.truncated,false);
  assert.equal(d.actions[0].repository,NAME);
  assert.equal(d.actions[0].title,'Synthetic follow-up task');
  assert.equal(d.actions[0].status,'TODO');
  assert.doesNotMatch(r.text,/PRIVATE-DO-NOT-LEAK|secret\.invalid|Sensitive owner-only note|evidenceIds|raw snapshot|worktree/i);
  assert.equal((await hit('/api/workplan/actions',{method:'POST',body:{},cookie})).status,404);
 });
});
test('PC04C logout revokes summary and action list and clears data-bearing session',async()=>{
 await withServer(async({hit})=>{
  const cookie=await login(hit);
  await hit('/session/details',{method:'POST',body:{},cookie});
  assert.equal((await hit('/api/workplan/actions',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  for(const path of ['/api/workplan/summary','/api/workplan/actions']){
   assert.equal((await hit(path,{cookie})).status,401);
   assert.equal((await hit(path)).status,401);
  }
  assert.equal((await hit('/session',{method:'POST',body:{code:CODE}})).status,401);
 });
});
test('PC04C old Snapshot-only opt-in never opens a private workplan API',async()=>{
 await withServer(async({hit})=>{
  const cookie=await login(hit);
  assert.equal((await hit('/api/workplan/summary',{cookie})).status,404);
  await hit('/session/details',{method:'POST',body:{},cookie});
  assert.equal((await hit('/api/workplan/actions',{cookie})).status,404);
  assert.equal((await hit('/api/summary',{cookie})).status,200);
 },false);
});
test('PC04C mismatched private workplan scope is rejected before any listener opens',async()=>{
 const q=projection(),p=workplan(q);
 p.projects[0].repository='fictional-owner/other';
 await assert.rejects(()=>startOwnerLocalServer({projection:q,workplan:p,pairCode:CODE}),/selected registry order mismatch/);
});
test('PC04C hostile origin, host and denied session cannot fetch private actions',async()=>{
 await withServer(async({hit,server})=>{
  const cookie=await login(hit);
  await hit('/session/details',{method:'POST',body:{},cookie});
  const variants=[{headers:{Origin:'https://attacker.invalid'}},{headers:{'Sec-Fetch-Site':'cross-site'}},{host:'localhost:'+server.port}];
  for(const extra of variants){
   assert.equal((await hit('/api/workplan/actions',{cookie,...extra})).status,403);
  }
  const r=await hit('/api/workplan/actions',{cookie});
  assert.equal(r.status,200);assert.equal(r.headers['access-control-allow-origin'],undefined);
 });
});
test('PC04C UI uses textContent-only rendering, and public Pages has no private workplan import',()=>{
 const privateSource=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 const publicSource=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.match(privateSource,/--ack-private-workplan-local/);
 assert.match(privateSource,/readPrivateWorkplanFile/);
 assert.match(privateSource,/document\.createElement/);
 assert.match(privateSource,/n\.textContent=String\(value\)/);
 assert.doesNotMatch(privateSource,/innerHTML|localStorage|sessionStorage/);
 assert.doesNotMatch(publicSource,/workplan-model|encrypted-workplan|owner-workplan\.enc\.json|private-local\.mjs/);
});


test('PC04C mobile layout keeps Git evidence status full-width and separates warning from metrics grid',async()=>{
 await withServer(async({hit})=>{
  const css=(await hit('/style.css')).text;
  const html=(await hit('/')).text;
  const js=(await hit('/app.js')).text;
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(css,/\.axes\{grid-template-columns:1fr\}/);
  assert.match(css,/\.row button\{width:100%\}/);
  assert.match(html,/<div id="workplan-summary" class="grid"><\/div><p id="workplan-note" class="note"><\/p>/);
  assert.match(js,/el\('workplan-note'\)\.textContent=foot\.textContent/);
  assert.match(js,/el\('workplan-note'\)\.textContent=''/);
  assert.doesNotMatch(css+html+js,/fictional-owner|PRIVATE-DO-NOT-LEAK|secret\.invalid/);
 });
});
test('PC04C empty owner plan reports zero recorded tasks without implying projects are complete',async()=>{
 const q=projection(),empty=createEmptyWorkplan(q,{at:NOW});
 const app=await startOwnerLocalServer({projection:q,workplan:empty,pairCode:CODE});
 const hit=(path,{method='GET',body,cookie}={})=>new Promise((resolve,reject)=>{
  let data;const headers={Host:'127.0.0.1:'+app.port};
  if(body!==undefined){data=JSON.stringify(body);headers.Origin='http://127.0.0.1:'+app.port;headers['Content-Type']='application/json';headers['X-BWD-Local']='1';}
  if(cookie)headers.Cookie=cookie;
  const req=request({host:'127.0.0.1',port:app.port,path,method,headers},res=>{
   const chunks=[];res.on('data',b=>chunks.push(b));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text:Buffer.concat(chunks).toString('utf8')}));
  });req.on('error',reject);req.end(data);
 });
 try{
  const pair=await hit('/session',{method:'POST',body:{code:CODE}});
  assert.equal(pair.status,200);
  const cookie=pair.headers['set-cookie'][0].split(';')[0];
  const s=await hit('/api/workplan/summary',{cookie});
  assert.equal(s.status,200);
  const summary=JSON.parse(s.text);
  assert.equal(summary.openActions,0);
  assert.equal(summary.ownerReviewed,0);
  assert.equal(summary.waitingDecision,1);
  assert.equal((await hit('/api/workplan/actions',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',cookie,body:{}})).status,200);
  const actions=await hit('/api/workplan/actions',{cookie});
  assert.equal(actions.status,200);
  assert.equal(JSON.parse(actions.text).totalActions,0);
  assert.deepEqual(JSON.parse(actions.text).actions,[]);
 }finally{await new Promise(ok=>app.server.close(ok));}
});
