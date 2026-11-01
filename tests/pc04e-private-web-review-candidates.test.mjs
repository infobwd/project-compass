// PC-04E — fictional-only private candidate API security/UX tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const NAME='fictional-owner/review-lab',AT='2026-11-01T00:00:00.000Z',PAIR='A1B2C3D4E5F60708';
function projection(complete=true){
 const snap={format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',observedAt:AT,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:2,atLeast:2,items:complete?[
     {number:12,draft:true,headSha:'a'.repeat(40),base:'main'},
     {number:13,draft:false,headSha:'b'.repeat(40),base:'main'}]:undefined},
   openIssues:{state:'VERIFIED',count:1,atLeast:1,numbers:complete?[8]:undefined}}]};
 return projectOfflineEvidence(snap,[NAME],Date.parse(AT)+3600000);
}
async function run(fn,{hasPlan=true,complete=true}={}){
 const p=projection(complete),w=hasPlan?createEmptyWorkplan(p,{at:AT}):null;
 const app=await startOwnerLocalServer({projection:p,workplan:w,pairCode:PAIR});
 const hit=(path,{method='GET',body,cookie,host,headers={}}={})=>new Promise((resolve,reject)=>{
  let data;const h={Host:host??'127.0.0.1:'+app.port,...headers};
  if(body!==undefined){data=JSON.stringify(body);h.Origin??='http://127.0.0.1:'+app.port;h['Content-Type']='application/json';h['X-BWD-Local']='1';}
  if(cookie)h.Cookie=cookie;
  const req=request({hostname:'127.0.0.1',port:app.port,path,method,headers:h},res=>{
   const arr=[];res.on('data',x=>arr.push(x));res.on('end',()=>resolve({status:res.statusCode,
     headers:res.headers,text:Buffer.concat(arr).toString('utf8')}));
  });req.on('error',reject);req.end(data);
 });
 try{await fn({hit,app});}finally{await new Promise(ok=>app.server.close(ok));}
}
async function pair(hit){
 const r=await hit('/session',{method:'POST',body:{code:PAIR}});
 assert.equal(r.status,200);
 return r.headers['set-cookie'][0].split(';')[0];
}
test('PC04E candidate routes unauthenticated 401, no private sources in static shell',async()=>{
 await run(async({hit})=>{
  for(const path of ['/api/candidates/summary','/api/candidates/details']){
   const res=await hit(path);assert.equal(res.status,401);assert.match(res.headers['cache-control'],/no-store/);
  }
  for(const path of ['/','/app.js','/style.css']){
   const res=await hit(path);assert.equal(res.status,200);
   assert.doesNotMatch(res.text,/fictional-owner|review-lab|PRIVATE-EVIDENCE-LINK|12345-secret/);
  }
 });
});
test('PC04E paired summary gives counts only, no names or numbered PR links',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit),r=await hit('/api/candidates/summary',{cookie});
  assert.equal(r.status,200);
  const x=JSON.parse(r.text);assert.equal(x.mode,'PRIVATE_REVIEW_CANDIDATES_SUMMARY');
  assert.equal(x.knownPRReferences,2);assert.equal(x.knownIssueReferences,1);
  assert.equal(x.completeReferenceCollections,2);assert.equal(x.incompleteReferenceCollections,0);
  assert.equal(x.shownCandidates,3);assert.equal(x.ownerTasksAdded,0);
  assert.equal(x.liveGitHubChecked,false);
  assert.doesNotMatch(r.text,/fictional-owner|review-lab|number.*12|number.*13|number.*8/);
  assert.equal((await hit('/api/candidates/details',{cookie})).status,403);
 });
});
test('PC04E detail step-up shows only enumerated PRs/Issue and never creates TODO',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/session/details',{cookie,method:'POST',body:{}})).status,200);
  const r=await hit('/api/candidates/details',{cookie}),x=JSON.parse(r.text);
  assert.equal(r.status,200);assert.equal(x.mode,'PRIVATE_REVIEW_CANDIDATES_DETAILS');
  assert.equal(x.ownerTasksAdded,0);
  assert.equal(x.projects[0].repository,NAME);
  assert.deepEqual(x.projects[0].candidates.map(p=>p.number),[13,12,8]);
  assert.ok(x.projects[0].candidates.every(p=>p.priority==='NOT_ASSESSED'&&p.ownerConfirmed===false));
  assert.doesNotMatch(r.text,/localWorktree|hostUrl|reason|evidenceIds|passphrase|owner-workplan\.enc\.json/);
  assert.equal((await hit('/api/candidates/details',{cookie,method:'POST',body:{}})).status,404);
 });
});
test('PC04E incomplete snapshot enumeration does not fabricate identifiers',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit),summary=JSON.parse((await hit('/api/candidates/summary',{cookie})).text);
  assert.equal(summary.shownCandidates,0);assert.equal(summary.incompleteReferenceCollections,2);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  const details=JSON.parse((await hit('/api/candidates/details',{cookie})).text);
  assert.deepEqual(details.projects[0].candidates,[]);
  assert.equal(details.projects[0].enumeration,'PARTIAL_OR_UNKNOWN');
 },{complete:false});
});
test('PC04E older snapshot-only local mode cannot view candidate routes',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit);
  assert.equal((await hit('/api/candidates/summary',{cookie})).status,404);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/candidates/details',{cookie})).status,404);
 },{hasPlan:false});
});
test('PC04E logout invalidates candidate routes even with old cookie',async()=>{
 await run(async({hit})=>{
  const cookie=await pair(hit);
  await hit('/session/details',{cookie,method:'POST',body:{}});
  assert.equal((await hit('/api/candidates/details',{cookie})).status,200);
  assert.equal((await hit('/session/logout',{cookie,method:'POST',body:{}})).status,204);
  for(const path of ['/api/candidates/summary','/api/candidates/details'])
   assert.equal((await hit(path,{cookie})).status,401);
 });
});
test('PC04E cross-origin/host requests denied with valid cookie',async()=>{
 await run(async({hit,app})=>{
  const cookie=await pair(hit);await hit('/session/details',{cookie,method:'POST',body:{}});
  for(const opts of [{headers:{Origin:'https://attacker.invalid'}},
   {headers:{'Sec-Fetch-Site':'cross-site'}},{host:'localhost:'+app.port}]){
   const r=await hit('/api/candidates/details',{cookie,...opts});assert.equal(r.status,403);
  }
 });
});
test('PC04E safe read-only UI includes collapsed candidate review and no public import',async()=>{
 await run(async({hit})=>{
  const js=(await hit('/app.js')).text,html=(await hit('/')).text;
  assert.match(html,/id="candidates" hidden/);
  assert.match(js,/ข้อเสนอทบทวนจาก PR \/ Issue|รายการเสนอให้เจ้าของพิจารณา/);
  assert.match(js,/element\('details','','review-item'\)/);
  assert.match(js,/ไม่ใช่ TODO/);
  assert.doesNotMatch(js,/innerHTML|localStorage|sessionStorage|fetch\('https:\/\//);
 });
 const publicSrc=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(publicSrc,/review-candidates|prReferences|issueNumbers/);
});
