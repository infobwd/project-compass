// PC-04H synthetic owner-local PR/Issue pagination: no real identifiers or writes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {buildPrivateCandidatePage} from '../tools/private-plan/review-candidates.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const OWNER='fictional-owner',NAME=OWNER+'/fictional-lab',NOW='2026-11-01T00:00:00.000Z',CODE='A1B2C3D4E5F60708';
function fixture({size=25,issues=3,incomplete=false}={}){
 const prs=Array.from({length:size},(_,i)=>({number:100+i,draft:i%2===0,headSha:'a'.repeat(40),base:'main'}));
 const ids=Array.from({length:issues},(_,i)=>i+10);
 const raw={format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,observedAt:NOW,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:size,atLeast:size,items:incomplete?undefined:prs},
   openIssues:{state:'VERIFIED',count:issues,atLeast:issues,numbers:ids}}]};
 const projection=projectOfflineEvidence(raw,[NAME],Date.parse(NOW)+100000);
 return {projection,plan:createEmptyWorkplan(projection,{at:NOW})};
}
async function withServer(fn,{incomplete=false,hasPlan=true}={}){
 const {projection,plan}=fixture({incomplete}),app=await startOwnerLocalServer({
  projection,workplan:hasPlan?plan:null,pairCode:CODE});
 const hit=(path,{method='GET',body,cookie,headers={},host}={})=>new Promise((ok,no)=>{
  let payload;const h={Host:host??'127.0.0.1:'+app.port,...headers};
  if(cookie)h.Cookie=cookie;
  if(body!==undefined){payload=JSON.stringify(body);h.Origin??='http://127.0.0.1:'+app.port;h['Content-Type']='application/json';h['X-BWD-Local']='1';}
  const r=request({hostname:'127.0.0.1',port:app.port,path,method,headers:h},res=>{
   const blocks=[];res.on('data',v=>blocks.push(v));res.on('end',()=>ok({status:res.statusCode,
    text:Buffer.concat(blocks).toString('utf8'),headers:res.headers}));
  });r.on('error',no);r.end(payload);
 });
 try{await fn({hit,plan,app});}finally{await new Promise(ok=>app.server.close(ok));}
}
async function pair(hit){
 const r=await hit('/session',{method:'POST',body:{code:CODE}});
 assert.equal(r.status,200);
 return r.headers['set-cookie'][0].split(';')[0];
}

test('PC04H exact 25 saved PRs paginated 10/10/5; no silently omitted entries',()=>{
 const {projection,plan}=fixture();
 const pages=[0,1,2].map(page=>buildPrivateCandidatePage(projection,plan,{projectIndex:0,kind:'PR',page}));
 assert.deepEqual(pages.map(p=>p.items.length),[10,10,5]);
 assert.ok(pages.every(p=>p.total===25&&p.pages===3&&p.ownerTasksAdded===0));
 assert.deepEqual(pages.flatMap(p=>p.items.map(x=>x.number)),
  Array.from({length:25},(_,i)=>124-i));
 assert.ok(pages[0].items.every(x=>x.priority==='NOT_ASSESSED'&&x.ownerConfirmed===false));
 assert.equal(pages[0].source,'SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE');
 assert.equal(plan.projects[0].actions.length,0);
});
test('PC04H saved Issues are separately enumerated, not fabricated from PR count',()=>{
 const {projection,plan}=fixture();
 const p=buildPrivateCandidatePage(projection,plan,{projectIndex:0,kind:'ISSUE',page:0});
 assert.equal(p.total,3);assert.deepEqual(p.items.map(i=>i.number),[12,11,10]);
 assert.ok(p.items.every(i=>i.draft===null));
 assert.equal(p.enumeration,'SAVED_ENUMERATION_COMPLETE');
});
test('PC04H invalid or absent enumerations fail closed without making up identifiers',()=>{
 const {projection,plan}=fixture({incomplete:true});
 const p=buildPrivateCandidatePage(projection,plan,{projectIndex:0,kind:'PR',page:0});
 assert.equal(p.enumeration,'PARTIAL_OR_UNKNOWN');
 assert.deepEqual(p.items,[]);assert.equal(p.total,null);
 assert.match(p.missingSource,/PR_ENUMERATION_INCOMPLETE/);
 assert.equal(buildPrivateCandidatePage(projection,plan,{projectIndex:0,kind:'ISSUE',page:0}).total,3);
});
test('PC04H scope/pagination bounds and no workplan mutations',()=>{
 const {projection,plan}=fixture();
 const before=JSON.stringify(plan);
 for(const opts of [
  {projectIndex:1,kind:'PR',page:0},{projectIndex:-1,kind:'PR',page:0},
  {projectIndex:0,kind:'TASK',page:0},{projectIndex:0,kind:'PR',page:-1},
  {projectIndex:0,kind:'PR',page:3},{projectIndex:0,kind:'PR',page:99}
 ])assert.throws(()=>buildPrivateCandidatePage(projection,plan,opts));
 assert.equal(JSON.stringify(plan),before);
});
test('PC04H unpaired and paired-before-step-up page route cannot reveal project names',async()=>{
 await withServer(async({hit})=>{
  const path='/api/candidates/page/0/PR/0';
  assert.equal((await hit(path)).status,401);
  const cookie=await pair(hit);
  assert.equal((await hit(path,{cookie})).status,403);
  for(const route of ['/','/app.js','/style.css']){
   const r=await hit(route);assert.equal(r.status,200);
   assert.doesNotMatch(r.text,/fictional-owner|fictional-lab|owner-workplan\.enc\.json/);
  }
 });
});
test('PC04H step-up-only page returns max 10 items and rejects bad pages and POST',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  const r=await hit('/api/candidates/page/0/PR/0',{cookie});
  assert.equal(r.status,200);assert.match(r.headers['cache-control'],/no-store/);
  const page=JSON.parse(r.text);
  assert.equal(page.mode,'PRIVATE_REVIEW_CANDIDATE_PAGE');
  assert.equal(page.total,25);assert.equal(page.items.length,10);assert.equal(page.ownerTasksAdded,0);
  assert.equal(page.items[0].number,124);assert.equal(page.items[9].number,115);
  assert.doesNotMatch(r.text,/headSha|localWorktree|hostUrl|evidenceIds|owner-workplan|passphrase/);
  for(const bad of ['/api/candidates/page/0/PR/3','/api/candidates/page/0/PR/99',
    '/api/candidates/page/1/PR/0','/api/candidates/page/0/NOTPR/0',
    '/api/candidates/page/0/PR/0?leak=yes']){
   assert.equal((await hit(bad,{cookie})).status,404);
  }
  assert.equal((await hit('/api/candidates/page/0/PR/0',{cookie,method:'POST',body:{}})).status,404);
 });
});
test('PC04H incomplete reference and legacy Snapshot-only mode do not expose a page',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  const p=JSON.parse((await hit('/api/candidates/page/0/PR/0',{cookie})).text);
  assert.deepEqual(p.items,[]);assert.equal(p.enumeration,'PARTIAL_OR_UNKNOWN');
 },{incomplete:true});
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/candidates/page/0/PR/0',{cookie})).status,404);
 },{hasPlan:false});
});
test('PC04H logout revokes page access, and public App never imports paging code',async()=>{
 await withServer(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/candidates/page/0/PR/0',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{cookie,method:'POST',body:{}})).status,204);
  assert.equal((await hit('/api/candidates/page/0/PR/0',{cookie})).status,401);
 });
 const pub=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const server=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(pub,/buildPrivateCandidatePage|api\/candidates\/page/);
 assert.match(server,/function openCandidatePage\(project,projectIndex,kind\)/);
 assert.match(server,/if\(!active\(req\)\)return deny\(res,401\)/);
 assert.doesNotMatch(server,/commitOwnerRevision\s*\(|createOwnerAction\s*\(/);
});
