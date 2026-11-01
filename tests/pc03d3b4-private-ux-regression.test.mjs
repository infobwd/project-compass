// PC-03D3B-4 — fictional projection ONLY, never owner's encrypted files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const OWNER='fictional-owner', REPO=OWNER+'/demo';
const CODE='A1B2C3D4E5F60708';
const CLOCK=Date.parse('2026-11-01T00:00:00Z');
function fixture(){
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},
  observedAt:'2026-11-01T00:00:00.000Z',inspectedRepositories:1,
  projects:[{fullName:REPO,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:1,atLeast:1},openIssues:{state:'VERIFIED',count:0,atLeast:0}}]};
}
async function harness(fn,opts={}){
 const app=await startOwnerLocalServer({projection:projectOfflineEvidence(fixture(),[REPO],CLOCK),pairCode:CODE,...opts});
 const hit=(path='/',{method='GET',body,cookie,headers={}}={})=>new Promise((yes,no)=>{
  const h={Host:'127.0.0.1:'+app.port,...headers};let payload;
  if(body!==undefined){payload=JSON.stringify(body);h.Origin??='http://127.0.0.1:'+app.port;h['Content-Type']??='application/json';h['X-BWD-Local']??='1';}
  if(cookie)h.Cookie=cookie;
  const q=request({hostname:'127.0.0.1',port:app.port,path,method,headers:h},r=>{
   const chunks=[];r.on('data',c=>chunks.push(c));
   r.on('end',()=>yes({status:r.statusCode,body:Buffer.concat(chunks).toString('utf8'),headers:r.headers}));
  });q.once('error',no);q.end(payload);
 });
 try{await fn(hit,app);}
 finally{await new Promise(ok=>app.server.close(ok));}
}
test('D3B4: private locked HTML never embeds selected repository IDs or passphrases',async()=>{
 await harness(async hit=>{
  for(const path of ['/','/style.css','/app.js']){
   const r=await hit(path);
   assert.equal(r.status,200,path);
   assert.doesNotMatch(r.body,/fictional-owner|selected\.snapshot|passphrase|github_pat_/i,path);
   assert.match(r.headers['cache-control'],/no-store/);
  }
  assert.equal((await hit('/api/summary')).status,401);
  assert.equal((await hit('/api/projects')).status,401);
 });
});
test('D3B4: private UI explicitly updates detail button and formats Bangkok snapshot time',async()=>{
 await harness(async hit=>{
  const html=(await hit('/')).body;
  const script=(await hit('/app.js')).body;
  assert.match(html,/aria-expanded="false" aria-controls="projects"/);
  assert.match(script,/กำลังแสดงรายละเอียดรายโครงการ/);
  assert.match(script,/el\('details'\)\.setAttribute\('aria-expanded','true'\)/);
  assert.match(script,/el\('details'\)\.setAttribute\('aria-expanded','false'\)/);
  assert.match(script,/timeZone:'Asia\/Bangkok'/);
  assert.match(script,/STALE \(ห้ามอ้างสถานะปัจจุบัน\)/);
  assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage|document\.cookie/);
  assert.doesNotThrow(()=>new Function(script));
 });
});
test('D3B4: five wrong terminal pairing attempts permanently deny code, no private response',async()=>{
 await harness(async hit=>{
  for(let i=0;i<5;i++){
   const r=await hit('/session',{method:'POST',body:{code:'0000000000000000'}});
   assert.equal(r.status,401);
  }
  const sixth=await hit('/session',{method:'POST',body:{code:CODE}});
  assert.equal(sixth.status,429);
  assert.equal((await hit('/api/summary')).status,401);
  assert.equal((await hit('/api/projects')).status,401);
 });
});
test('D3B4: expired pairing code denies client with no private summary',async()=>{
 let t=1000;
 await harness(async hit=>{
  t+=120001;
  assert.equal((await hit('/session',{method:'POST',body:{code:CODE}})).status,401);
  assert.equal((await hit('/api/projects')).status,401);
 },{now:()=>t,pairTtlMs:120000});
});
test('D3B4: logout revokes real-runtime cookie and blocks replay after details',async()=>{
 await harness(async hit=>{
  const paired=await hit('/session',{method:'POST',body:{code:CODE}});
  assert.equal(paired.status,200);
  const cookie=paired.headers['set-cookie'][0].split(';')[0];
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const details=await hit('/api/projects',{cookie});
  assert.equal(details.status,200);
  assert.match(details.body,/fictional-owner/);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await hit('/api/projects',{cookie})).status,401);
  assert.equal((await hit('/api/summary',{cookie})).status,401);
  assert.equal((await hit('/session',{method:'POST',body:{code:CODE}})).status,401);
 });
});
