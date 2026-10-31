import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { startSyntheticPairingServer } from '../tools/private-ui/auth-synthetic.mjs';

const code='AABBCCDDEEFF0011';
async function harness(options={}){
 const s=await startSyntheticPairingServer({pairCode:code,...options});
 const hit=(path='/',{method='GET',body,cookie,headers={},host}={})=>new Promise((resolve,reject)=>{
  const h={Host:host||'127.0.0.1:'+s.port,...headers};
  let payload;
  if(body!==undefined){payload=JSON.stringify(body);h['Content-Type']??='application/json';h['X-BWD-Local']??='1';h.Origin??='http://127.0.0.1:'+s.port;}
  if(cookie)h.Cookie=cookie;
  const q=request({host:'127.0.0.1',port:s.port,path,method,headers:h},r=>{const chunks=[];r.on('data',c=>chunks.push(c));r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,text:Buffer.concat(chunks).toString('utf8')}));});
  q.on('error',reject);q.end(payload);
 });
 const close=()=>new Promise(ok=>s.server.close(ok));
 return {...s,hit,close};
}
async function paired(s){const r=await s.hit('/session',{method:'POST',body:{code}});assert.equal(r.status,200);return r.headers['set-cookie'][0].split(';')[0];}

test('synthetic shell loopback listener, no project or private assets before pairing',async()=>{
 const s=await harness();try{
  assert.equal(s.server.address().address,'127.0.0.1');
  const r=await s.hit();assert.equal(r.status,200);assert.match(r.text,/LOCAL · SYNTHETIC · D2 PILOT/);
  assert.doesNotMatch(r.text,/selected\.snapshot|github_pat_|D:\\|infobwd\//i);
  const css=await s.hit('/shell.css'),js=await s.hit('/app.js');assert.equal(css.status,200);assert.equal(js.status,200);
  assert.doesNotMatch(js.text,/selected\.snapshot|PRIVATE_PROJECT_REGISTRY|github_pat_/i);
  assert.doesNotMatch(r.text,/\bAABBCCDDEEFF0011\b/);
  assert.equal(r.headers['set-cookie'],undefined);
  assert.match(r.headers['content-security-policy'],/default-src 'none'/);
  assert.match(r.headers['cache-control'],/no-store/);
  assert.match(r.headers['referrer-policy'],/no-referrer/);
 }finally{await s.close();}
});
test('unauthenticated API routes fail closed, without project names or counts',async()=>{
 const s=await harness();try{
  for(const p of ['/api/summary','/api/projects']){const r=await s.hit(p);assert.equal(r.status,401);assert.doesNotMatch(r.text,/Fictional Atlas|Sample Orchard|openPRs/);}
  assert.equal((await s.hit('/api/private')).status,404);
  assert.equal((await s.hit('/?code=ABC')).status,404);
 }finally{await s.close();}
});
test('single-use terminal pairing, HttpOnly session, summary and detail step-up',async()=>{
 const s=await harness();try{
  const cookie=await paired(s);
  assert.match(cookie,/^bwd_pc03d2=[a-f0-9]{64}$/);
  const repeat=await s.hit('/session',{method:'POST',body:{code}});assert.equal(repeat.status,401);
  const r=await s.hit('/api/summary',{cookie});assert.equal(r.status,200);
  assert.equal(JSON.parse(r.text).mode,'SYNTHETIC_ONLY');
  assert.doesNotMatch(r.text,/Fictional Atlas|Sample Orchard/);
  assert.equal((await s.hit('/api/projects',{cookie})).status,403);
  assert.equal((await s.hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const d=await s.hit('/api/projects',{cookie});assert.equal(d.status,200);assert.match(d.text,/Fictional Atlas/);
  assert.match(d.headers['cache-control'],/no-store/);
  assert.equal((await s.hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await s.hit('/api/summary',{cookie})).status,401);
 }finally{await s.close();}
});
test('pairing code wrong attempts fail and eventually lock out',async()=>{
 const s=await harness({maxAttempts:3});try{
  for(let i=0;i<3;i++)assert.equal((await s.hit('/session',{method:'POST',body:{code:'FFFFFFFFFFFFFFFF'}})).status,401);
  assert.equal((await s.hit('/session',{method:'POST',body:{code}})).status,429);
 }finally{await s.close();}
});
test('expired one-time code fails and clock backwards fails',async()=>{
 let clock=10_000;const s=await harness({now:()=>clock,pairTtlMs:1000});try{
  clock=11_001;assert.equal((await s.hit('/session',{method:'POST',body:{code}})).status,401);
  clock=9_000;assert.equal((await s.hit('/session',{method:'POST',body:{code}})).status,401);
 }finally{await s.close();}
});
test('session idle expiry and absolute expiry fail closed',async()=>{
 let clock=10_000;const s=await harness({now:()=>clock,idleMs:1000,absoluteMs:3000});try{
  const cookie=await paired(s);
  clock+=900;assert.equal((await s.hit('/api/summary',{cookie})).status,200);
  clock+=1100;assert.equal((await s.hit('/api/summary',{cookie})).status,401);
 }finally{await s.close();}
 const s2=await harness({now:()=>clock,absoluteMs:1000,idleMs:3000});try{
  const cookie=await paired(s2);clock+=1001;assert.equal((await s2.hit('/api/summary',{cookie})).status,401);
 }finally{await s2.close();}
});
test('Host header, cross-origin request, fetch metadata and CSRF-like form rejected',async()=>{
 const s=await harness();try{
  assert.equal((await s.hit('/',{host:'evil.example'})).status,403);
  assert.equal((await s.hit('/',{host:'localhost:'+s.port})).status,403);
  assert.equal((await s.hit('/',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await s.hit('/',{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await s.hit('/session',{method:'POST',body:{code},headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await s.hit('/session',{method:'POST',body:{code},headers:{'X-BWD-Local':'0'}})).status,403);
  assert.equal((await s.hit('/session',{method:'POST',body:{code},headers:{'Content-Type':'text/plain'}})).status,403);
  assert.equal((await s.hit('/session',{method:'POST',body:{code}})).status,200);
 }finally{await s.close();}
});
test('no unexpected HTTP methods, files, redirects or raw snapshot routes',async()=>{
 const s=await harness();try{
  for(const path of ['/api/raw','/snapshot','/projects.selection.json','/selected.snapshot.enc.json','/%2e%2e/','/app.js?debug=1'])
    assert.equal((await s.hit(path)).status,404,path);
  for(const method of ['PUT','PATCH','DELETE','OPTIONS'])assert.equal((await s.hit('/',{method})).status,405);
 }finally{await s.close();}
});
test('content-type, body format and field limits fail closed',async()=>{
 const s=await harness();try{
  assert.equal((await s.hit('/session',{method:'POST',body:{code,extra:'malicious'}})).status,401);
  assert.equal((await s.hit('/session',{method:'POST',body:{code:0}})).status,401);
  assert.equal((await s.hit('/session',{method:'POST',body:{code:'A'.repeat(1100)}})).status,413);
 }finally{await s.close();}
});
test('cookie never present in unauthenticated HTML, pairing token never in URLs, authenticated response no-store',async()=>{
 const s=await harness();try{
  const r=await s.hit();assert.doesNotMatch(r.text,/bwd_pc03d2=/);
  const pair=await s.hit('/session',{method:'POST',body:{code}});
  const str=pair.headers['set-cookie'][0];assert.match(str,/HttpOnly/);assert.match(str,/SameSite=Strict/);
  assert.doesNotMatch(pair.text,/bwd_pc03d2|[0-9a-f]{64}/i);
  assert.match(pair.headers['cache-control'],/no-store/);
 }finally{await s.close();}
});
