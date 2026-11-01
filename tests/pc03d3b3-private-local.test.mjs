// PC-03D3B-3 tests: fictional encrypted Snapshot only. NEVER access real owner's drive.
import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import {mkdtempSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {encryptSnapshot} from '../tools/private-sync/sync.mjs';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {loadPrivateProjection,startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';
import {readFileSync as readSource} from 'node:fs';
import {fileURLToPath} from 'node:url';

const owner='fictional-owner', names=[owner+'/alpha-project',owner+'/beta-project'];
const SHA='a'.repeat(40), pass='fictional-strong-passphrase';
const observed='2026-11-01T00:00:00.000Z';
function example(){
 return {format:'BWD-COMPASS-REGISTRY-V1',observedAt:observed,owner,
 coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:2,matched:2},
 inspectedRepositories:2,projects:[
  {fullName:names[0],defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:2,atLeast:2},openIssues:{state:'VERIFIED',count:3,atLeast:3}},
  {fullName:names[1],defaultBranch:'master',defaultHead:{state:'UNKNOWN',sha:null},
   openPRs:{state:'UNKNOWN',count:null,atLeast:0},openIssues:{state:'VERIFIED',count:0,atLeast:0}}
 ]};
}
const clock=Date.parse('2026-11-01T01:00:00.000Z');
function projection(){return projectOfflineEvidence(example(),names,clock);}
async function withServer(fn,overrides={}){
 const code='1A2B3C4D5E6F7788';
 const app=await startOwnerLocalServer({projection:projection(),pairCode:code,...overrides});
 const hit=(path='/',{method='GET',body,cookie,headers={},host}={})=>new Promise((yes,no)=>{
  const hs={Host:host||'127.0.0.1:'+app.port,...headers};
  let payload;
  if(body!==undefined){payload=JSON.stringify(body);hs.Origin??='http://127.0.0.1:'+app.port;hs['Content-Type']??='application/json';hs['X-BWD-Local']??='1';}
  if(cookie)hs.Cookie=cookie;
  const q=request({hostname:'127.0.0.1',port:app.port,path,method,headers:hs},r=>{
   const chunks=[];r.on('data',p=>chunks.push(p));r.on('end',()=>yes({status:r.statusCode,text:Buffer.concat(chunks).toString('utf8'),headers:r.headers}));
  });q.on('error',no);q.end(payload);
 });
 try{await fn({hit,app,code});}
 finally{await new Promise(ok=>app.server.close(ok));}
}
async function paired(hit,code){
 const r=await hit('/session',{method:'POST',body:{code}});
 assert.equal(r.status,200);
 assert.match(r.headers['set-cookie'][0],/HttpOnly; SameSite=Strict/);
 return r.headers['set-cookie'][0].split(';')[0];
}
test('real local pilot loads ONLY fictional encrypted selected snapshot and validates exact selection',()=>{
 const dir=mkdtempSync(join(tmpdir(),'pc03b3-'));
 try{
  const selection={format:'BWD-COMPASS-SELECTION-V1',owner,repositories:names};
  writeFileSync(join(dir,'projects.selection.json'),JSON.stringify(selection));
  writeFileSync(join(dir,'selected.snapshot.enc.json'),JSON.stringify(encryptSnapshot(example(),pass)));
  const a=loadPrivateProjection(pass,{directory:dir,now:clock});
  assert.equal(a.kind,'PRIVATE_LOCAL_PROJECTION');
  assert.equal(a.projects.length,2);
  assert.equal(a.aggregate.pullRequests.total,null);
  assert.equal(a.hostDeployment,'NOT_VERIFIED');
  assert.throws(()=>loadPrivateProjection('wrong passphrase',{directory:dir,now:clock}));
  assert.doesNotMatch(readFileSync(join(dir,'selected.snapshot.enc.json'),'utf8'),/alpha-project/);
  assert.throws(()=>loadPrivateProjection(pass,{directory:join(dir,'not-exists'),now:clock}));
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('local private browser serves no identifiers before terminal pairing',async()=>{
 await withServer(async({hit,app})=>{
  assert.equal(app.host,'127.0.0.1');
  assert.equal(app.server.address().address,'127.0.0.1');
  for(const route of ['/','/style.css','/app.js']){
   const r=await hit(route);assert.equal(r.status,200);
   assert.doesNotMatch(r.text,/fictional-owner|alpha-project|beta-project|selected.snapshot|github_pat_|passphrase/i);
   assert.equal(r.headers['set-cookie'],undefined);
   assert.match(r.headers['cache-control'],/no-store/);
  }
  for(const path of ['/api/summary','/api/projects']){
   assert.equal((await hit(path)).status,401);
  }
 });
});
test('local private browser scopes summary and requires details step-up for names',async()=>{
 await withServer(async({hit,code})=>{
  const cookie=await paired(hit,code);
  const sum=await hit('/api/summary',{cookie});assert.equal(sum.status,200);
  assert.equal(JSON.parse(sum.text).mode,'PRIVATE_LOCAL_SUMMARY');
  assert.equal(JSON.parse(sum.text).openPRsTotal,null);
  assert.doesNotMatch(sum.text,/alpha-project|beta-project|fictional-owner/);
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const detail=await hit('/api/projects',{cookie});
  assert.equal(detail.status,200);
  const o=JSON.parse(detail.text);
  assert.equal(o.projects.length,2);
  assert.equal(o.projects[1].openPRs,null);
  assert.equal(o.projects[0].axes.deployment,'NOT_VERIFIED');
  assert.equal(o.projects[0].axes.decision,'HUMAN_REVIEW_REQUIRED');
  assert.doesNotMatch(detail.text,/selected\.snapshot|github_pat_|passphrase/);
 });
});
test('logout revokes old cookies and clears all available private projections',async()=>{
 await withServer(async({hit,code})=>{
  const cookie=await paired(hit,code);
  await hit('/session/details',{method:'POST',body:{},cookie});
  const logout=await hit('/session/logout',{method:'POST',body:{},cookie});
  assert.equal(logout.status,204);
  assert.match(logout.headers['set-cookie'][0],/Max-Age=0/);
  assert.equal((await hit('/api/summary',{cookie})).status,401);
  assert.equal((await hit('/api/projects',{cookie})).status,401);
  assert.equal((await hit('/session',{method:'POST',body:{code}})).status,401);
  assert.equal((await hit('/')).status,200);
 });
});
test('host, Origin, fetch-site and non-JSON cross-site state changes rejected',async()=>{
 await withServer(async({hit,code,app})=>{
  const cookie=await paired(hit,code);
  for(const attack of [
   {host:'localhost:'+app.port},{host:'evil.invalid'},
   {headers:{Origin:'https://evil.invalid'}},
   {headers:{'Sec-Fetch-Site':'cross-site'}}
  ]){
   assert.equal((await hit('/api/summary',{cookie,...attack})).status,403);
  }
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie,headers:{Origin:'https://evil.invalid'}})).status,403);
  assert.equal((await hit('/api/projects',{cookie})).status,403);
 });
});
test('private routes, unknown methods and URLs are never public filesystem endpoints',async()=>{
 await withServer(async({hit})=>{
  for(const route of ['/api/raw','/selected.snapshot.enc.json','/projects.selection.json','/api/projects?raw=1','/api/download','/favicon.ico']){
   assert.equal((await hit(route)).status,404);
  }
  for(const method of ['DELETE','PUT','PATCH','OPTIONS']){
   assert.equal((await hit('/',{method})).status,405);
  }
 });
});
test('idle session timeout clears data and prevents pairing code replay',async()=>{
 let time=10000;
 await withServer(async({hit,code})=>{
  const cookie=await paired(hit,code);
  time+=1100;
  assert.equal((await hit('/api/summary',{cookie})).status,401);
  assert.equal((await hit('/session',{method:'POST',body:{code}})).status,401);
 },{now:()=>time,idleMs:1000});
});
test('public React and synthetic HTTP remain fully isolated from real private local module',()=>{
 const publicApp=readSource(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const demo=readSource(fileURLToPath(new URL('../tools/private-ui/auth-synthetic.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(publicApp,/private-local\.mjs|selected\.snapshot|PRIVATE_LOCAL_SUMMARY/);
 assert.doesNotMatch(demo,/private-local\.mjs|loadPrivateProjection|decryptSnapshot|BWD_COMPASS_PRIVATE_DIR/);
 const real=readSource(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(real,/import\(['"]https?:|from ['"]node:https|from ['"]node:net/);
 assert.match(real,/127\.0\.0\.1/);
});
