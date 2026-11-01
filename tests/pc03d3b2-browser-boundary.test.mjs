// D3B-2: simulated browser boundary regression. FICTIONAL DATA ONLY.
import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { startSyntheticPairingServer } from '../tools/private-ui/auth-synthetic.mjs';

const CODE='EDCB1234AABB0099';
async function harness(fn,options={}){
 const app=await startSyntheticPairingServer({pairCode:CODE,...options});
 const hit=(path='/',{method='GET',headers={},body,cookie,host}={})=>new Promise((resolve,reject)=>{
  const h={Host:host||'127.0.0.1:'+app.port,...headers};
  let payload;
  if(body!==undefined){
   payload=JSON.stringify(body);
   h.Origin??='http://127.0.0.1:'+app.port;
   h['Content-Type']??='application/json';
   h['X-BWD-Local']??='1';
  }
  if(cookie)h.Cookie=cookie;
  const q=request({host:'127.0.0.1',port:app.port,path,method,headers:h},r=>{
   const data=[];r.on('data',x=>data.push(x));
   r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,text:Buffer.concat(data).toString('utf8')}));
  });q.on('error',reject);q.end(payload);
 });
 try{await fn(app,hit);}
 finally{await new Promise(resolve=>app.server.close(resolve));}
}
async function login(hit){
 const result=await hit('/session',{method:'POST',body:{code:CODE}});
 assert.equal(result.status,200);
 return result.headers['set-cookie'][0].split(';')[0];
}
test('D3B2: protected and static responses disallow caching, framing and permissive CORS',async()=>{
 await harness(async(_,hit)=>{
  for(const path of ['/','/shell.css','/app.js','/api/summary','/api/projects','/api/evidence','/not-found']){
   const r=await hit(path);
   assert.match(r.headers['cache-control'],/no-store/,path);
   assert.equal(r.headers['x-frame-options'],'DENY',path);
   assert.equal(r.headers['referrer-policy'],'no-referrer',path);
   assert.equal(r.headers['access-control-allow-origin'],undefined,path);
   assert.match(r.headers['content-security-policy'],/frame-ancestors 'none'/,path);
  }
 });
});
test('D3B2: errors, unknown paths and raw data guesses reveal no private data',async()=>{
 await harness(async(_,hit)=>{
  for(const path of ['/selected.snapshot.enc.json','/projects.selection.json','/api/raw','/api/export','/admin','/api/evidence?download=1','/%2e%2e/snapshot']){
   const r=await hit(path);
   assert.equal(r.status,404,path);
   assert.doesNotMatch(r.text,/Fictional Atlas|Sample Orchard|stack|passphrase|D:\\|github_pat_/i,path);
   assert.equal(r.headers['set-cookie'],undefined,path);
  }
 });
});
test('D3B2: invalid cross-origin detail POST does not confer step-up permission',async()=>{
 await harness(async(_,hit)=>{
  const cookie=await login(hit);
  const attack=await hit('/session/details',{method:'POST',cookie,body:{},headers:{Origin:'https://hostile.invalid'}});
  assert.equal(attack.status,403);
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/api/evidence',{cookie})).status,403);
  assert.equal((await hit('/api/summary',{cookie})).status,200);
 });
});
test('D3B2: session cookie not exposed to static page or response body',async()=>{
 await harness(async(_,hit)=>{
  const cookie=await login(hit);
  const token=cookie.split('=')[1];
  for(const path of ['/','/shell.css','/app.js']){
   const r=await hit(path,{cookie});
   assert.equal(r.status,200,path);
   assert.doesNotMatch(r.text,new RegExp(token,'i'),path);
   assert.doesNotMatch(r.text,/bwd_pc03d2=/,path);
   assert.equal(r.headers['set-cookie'],undefined,path);
  }
  const sum=await hit('/api/summary',{cookie});
  assert.equal(sum.status,200);
  assert.doesNotMatch(sum.text,new RegExp(token,'i'));
 });
});
test('D3B2: expired absolute session rejects all three APIs irrespective of idle activity',async()=>{
 let clock=10000;
 await harness(async(_,hit)=>{
  const cookie=await login(hit);
  clock+=400;
  assert.equal((await hit('/api/summary',{cookie})).status,200);
  clock+=400;
  assert.equal((await hit('/api/summary',{cookie})).status,200);
  clock+=401;
  for(const path of ['/api/summary','/api/projects','/api/evidence']){
   assert.equal((await hit(path,{cookie})).status,401,path);
  }
 },{now:()=>clock,idleMs:10000,absoluteMs:1000});
});
test('D3B2: closed local server no longer accepts its former TCP listener',async()=>{
 let usedPort;
 await harness(async(app,hit)=>{
  usedPort=app.port;
  assert.equal(app.server.address().address,'127.0.0.1');
  assert.equal((await hit('/')).status,200);
 });
 await new Promise(resolve=>{
  const q=request({host:'127.0.0.1',port:usedPort,path:'/',timeout:1500},()=>resolve(false));
  q.once('error',()=>resolve(true));
  q.once('timeout',()=>{q.destroy();resolve(false);});
  q.end();
 }).then(closed=>assert.equal(closed,true,'Port still accepting connections after shutdown'));
});
