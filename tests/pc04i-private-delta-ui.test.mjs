// PC-04I fictional private HTTP delta: paired aggregate, step-up details and zero writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {compareSelectedSnapshots,summarizeSnapshotDelta} from '../tools/private-sync/snapshot-delta.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const NAME='fictional-owner/snapshot-audit',AT0='2026-11-01T00:00:00.000Z';
const AT1='2026-11-01T01:00:00.000Z',SHA='a'.repeat(40),PAIR='A1B2C3D4E5F60708';
function snap(fresh){
 const ids=fresh?[12,13]:[11,12],issues=fresh?[7,9]:[7];
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',coverage:'ALL_SELECTED',
  observedAt:fresh?AT1:AT0,selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[{fullName:NAME,repositoryId:11,visibility:'private',defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:ids.length,atLeast:ids.length,
    items:ids.map(n=>({number:n,draft:false,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:issues.length,atLeast:issues.length,numbers:issues}}]};
}
async function run(fn,{withDelta=true}={}){
 const old=snap(false),fresh=snap(true);
 const projection=projectOfflineEvidence(fresh,[NAME],Date.parse(AT1)+30000);
 const plan=createEmptyWorkplan(projection,{at:AT1});
 const diff=compareSelectedSnapshots(old,fresh,[NAME]);
 const delta={diff,summary:summarizeSnapshotDelta(diff)};
 const app=await startOwnerLocalServer({projection,workplan:plan,
  snapshotDelta:withDelta?delta:null,pairCode:PAIR});
 const hit=(path,{method='GET',body,cookie,headers={},host}={})=>new Promise((ok,fail)=>{
  let data;const h={Host:host??'127.0.0.1:'+app.port,...headers};
  if(cookie)h.Cookie=cookie;
  if(body!==undefined){data=JSON.stringify(body);h['Content-Type']='application/json';h.Origin??='http://127.0.0.1:'+app.port;h['X-BWD-Local']='1';}
  const r=request({hostname:'127.0.0.1',port:app.port,path,method,headers:h},res=>{
   const arr=[];res.on('data',x=>arr.push(x));
   res.on('end',()=>ok({status:res.statusCode,headers:res.headers,text:Buffer.concat(arr).toString('utf8')}));
  });r.on('error',fail);r.end(data);
 });
 try{await fn({hit,plan,app});}finally{await new Promise(ok=>app.server.close(ok));}
}
async function pair(hit){
 const r=await hit('/session',{method:'POST',body:{code:PAIR}});
 assert.equal(r.status,200);return r.headers['set-cookie'][0].split(';')[0];
}
test('PC04I unpaired delta routes return HTTP 401, static pages contain no private project',async()=>{
 await run(async({hit})=>{
  for(const uri of ['/api/delta/summary','/api/delta/details']){
   const r=await hit(uri);assert.equal(r.status,401);assert.match(r.headers['cache-control'],/no-store/);
  }
  for(const uri of ['/','/app.js','/style.css']){
   const r=await hit(uri);assert.equal(r.status,200);
   assert.doesNotMatch(r.text,/fictional-owner|snapshot-audit|snapshot-refresh-stage-[a-f0-9]{24}/);
  }
 });
});
test('PC04I paired summary is counts only, details require step-up authorization',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit);
  const s=await hit('/api/delta/summary',{cookie}),value=JSON.parse(s.text);
  assert.equal(s.status,200);
  assert.equal(value.mode,'PC04I_SAVED_SNAPSHOT_DELTA_SUMMARY');
  assert.equal(value.selected,1);
  assert.equal(value.totals.prsNewlyObservedOpen,1);
  assert.equal(value.totals.prsNoLongerObservedOpen,1);
  assert.equal(value.totals.issuesNewlyObservedOpen,1);
  assert.equal(value.ownerTasksAdded,0);
  assert.doesNotMatch(s.text,/fictional-owner|snapshot-audit|number.*13|number.*11/);
  assert.equal((await hit('/api/delta/details',{cookie})).status,403);
 });
});
test('PC04I step-up detail returns bounded saved deltas, never merge or status inference',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  const r=await hit('/api/delta/details',{cookie}),d=JSON.parse(r.text);
  assert.equal(r.status,200);assert.equal(d.mode,'PC04I_SAVED_SNAPSHOT_DELTA_DETAILS');
  assert.equal(d.mergeInferred,false);assert.equal(d.hostVerified,false);
  assert.equal(d.projects[0].repository,NAME);
  assert.deepEqual(d.projects[0].prAdded,[13]);assert.deepEqual(d.projects[0].prMissing,[11]);
  assert.deepEqual(d.projects[0].issueAdded,[9]);assert.deepEqual(d.projects[0].issueMissing,[]);
  assert.equal(d.projects[0].prAddedOmitted,0);
  assert.doesNotMatch(r.text,/localWorktree|hostUrl|headSha|owner-workplan|passphrase|repositoryId/);
 });
});
test('PC04I malformed requests, cross-origin and POST never expose private delta',async()=>{
 await run(async({hit,app})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  for(const uri of ['/api/delta/details?x=1','/api/delta/details/other']){
   assert.equal((await hit(uri,{cookie})).status,404);
  }
  assert.equal((await hit('/api/delta/details',{cookie,method:'POST',body:{}})).status,404);
  assert.equal((await hit('/api/delta/details',{cookie,headers:{Origin:'https://attacker.invalid'}})).status,403);
  assert.equal((await hit('/api/delta/details',{cookie,host:'localhost:'+app.port})).status,403);
 });
});
test('PC04I Logout invalidates old cookie, legacy viewer has 404 and no TODO created',async()=>{
 await run(async({hit,plan})=>{
  const before=JSON.stringify(plan),cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/delta/details',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{cookie,method:'POST',body:{}})).status,204);
  for(const uri of ['/api/delta/summary','/api/delta/details'])
   assert.equal((await hit(uri,{cookie})).status,401);
  assert.equal(JSON.stringify(plan),before);
 },{withDelta:true});
 await run(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/delta/summary',{cookie})).status,404);
  assert.equal((await hit('/api/delta/details',{cookie})).status,404);
 },{withDelta:false});
});
test('PC04I wrong owner-selected project or mismatched observation is rejected before server binds',async()=>{
 const fresh=snap(true),old=snap(false);
 const projection=projectOfflineEvidence(fresh,[NAME],Date.parse(AT1)+1000);
 const workplan=createEmptyWorkplan(projection,{at:AT1});
 const diff=compareSelectedSnapshots(old,fresh,[NAME]);
 for(const modify of [
  d=>{d.currentObservedAt=AT0;},
  d=>{d.projects[0].repository='fictional-owner/other';},
  d=>{d.selected=2;}
 ]){
  const bad=structuredClone(diff);modify(bad);
  await assert.rejects(()=>startOwnerLocalServer({projection,workplan,
   snapshotDelta:{diff:bad,summary:summarizeSnapshotDelta(bad)},pairCode:PAIR}),
   /Invalid private Snapshot delta scope/);
 }
});
test('PC04I static HTML and JS include delta UX but PUBLIC Pages remain separate',async()=>{
 await run(async({hit})=>{
  const html=(await hit('/')).text,script=(await hit('/app.js')).text;
  assert.match(html,/<section id="delta" hidden>/);
  assert.match(script,/function renderDeltaSummary\(d\)/);
  assert.match(script,/function renderDeltaDetails\(d\)/);
  assert.match(script,/ไม่ใช่หลักฐาน Merge/);
  assert.match(script,/el\('delta'\)\.hidden=true/);
  assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage/);
 });
 const publicApp=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(publicApp,/PC04I|snapshot-delta|api\/delta\/details/);
});
