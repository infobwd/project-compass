// PC-03D3B-1: synthetic-only hostile-origin / auth regression tests.
// This test NEVER reads the owner's selected encrypted snapshot or selection file.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {startSyntheticPairingServer} from '../tools/private-ui/auth-synthetic.mjs';

const TEST_CODE='A0B1C2D3E4F50617';
async function withPilot(callback,options={}){
 const s=await startSyntheticPairingServer({pairCode:TEST_CODE,...options});
 const send=(path,{method='GET',body,cookie,host,headers={}}={})=>new Promise((resolve,reject)=>{
  const h={Host:host||('127.0.0.1:'+s.port),...headers};
  let value;
  if(body!==undefined){
   value=JSON.stringify(body);
   h.Origin??='http://127.0.0.1:'+s.port;
   h['Content-Type']??='application/json';
   h['X-BWD-Local']??='1';
  }
  if(cookie)h.Cookie=cookie;
  const q=request({hostname:'127.0.0.1',port:s.port,path,method,headers:h},r=>{
   const parts=[];
   r.on('data',chunk=>parts.push(chunk));
   r.on('end',()=>resolve({
    status:r.statusCode,
    body:Buffer.concat(parts).toString('utf8'),
    headers:r.headers
   }));
  });
  q.on('error',reject);q.end(value);
 });
 try{return await callback({s,send});}
 finally{await new Promise(ok=>s.server.close(ok));}
}
async function login(send){
 const r=await send('/session',{method:'POST',body:{code:TEST_CODE}});
 assert.equal(r.status,200);
 assert.match(r.headers['set-cookie'][0],/HttpOnly; SameSite=Strict/);
 return r.headers['set-cookie'][0].split(';')[0];
}
test('D3B security: all three private-looking API routes return 401 before pairing',async()=>{
 await withPilot(async({send})=>{
  for(const path of ['/api/summary','/api/projects','/api/evidence']){
   const r=await send(path);
   assert.equal(r.status,401,path);
   assert.doesNotMatch(r.body,/Fictional Atlas|Sample Orchard|openPRs|projects/);
   assert.match(r.headers['cache-control'],/no-store/);
   assert.equal(r.headers['set-cookie'],undefined);
  }
 });
});
test('D3B security: paired session does not grant details without separate step-up',async()=>{
 await withPilot(async({send})=>{
  const cookie=await login(send);
  assert.equal((await send('/api/summary',{cookie})).status,200);
  for(const path of ['/api/projects','/api/evidence']){
   assert.equal((await send(path,{cookie})).status,403,path);
  }
  assert.equal((await send('/session/details',{method:'POST',body:{},cookie})).status,200);
  for(const path of ['/api/projects','/api/evidence']){
   assert.equal((await send(path,{cookie})).status,200,path);
  }
 });
});
test('D3B security: logout revokes summary, projects and evidence even with old cookie',async()=>{
 await withPilot(async({send})=>{
  const cookie=await login(send);
  assert.equal((await send('/session/details',{method:'POST',body:{},cookie})).status,200);
  const logout=await send('/session/logout',{method:'POST',body:{},cookie});
  assert.equal(logout.status,204);
  assert.match(logout.headers['set-cookie'][0],/Max-Age=0/);
  for(const path of ['/api/summary','/api/projects','/api/evidence']){
   assert.equal((await send(path,{cookie})).status,401,path);
   assert.equal((await send(path)).status,401,path);
  }
  assert.equal((await send('/session',{method:'POST',body:{code:TEST_CODE}})).status,401);
 });
});
test('D3B security: forged cookie, hostile host, origin and fetch-site never reveal fixture',async()=>{
 await withPilot(async({send,s})=>{
  const cookie=await login(send);
  await send('/session/details',{method:'POST',body:{},cookie});
  const bogus='bwd_pc03d2='+'0'.repeat(64);
  for(const path of ['/api/summary','/api/projects','/api/evidence']){
   assert.equal((await send(path,{cookie:bogus})).status,401);
   for(const attack of [
    {host:'localhost:'+s.port},
    {host:'127.0.0.1:'+s.port+'.attacker.invalid'},
    {headers:{Origin:'https://attacker.invalid'}},
    {headers:{'Sec-Fetch-Site':'cross-site'}}
   ]){
    const r=await send(path,{cookie,...attack});
    assert.equal(r.status,403,path);
    assert.doesNotMatch(r.body,/Fictional Atlas|Sample Orchard|openPRs|projects/);
   }
  }
 });
});
test('D3B security: invalid post content type and CSRF-like requests are denied',async()=>{
 await withPilot(async({send})=>{
  const cookie=await login(send);
  const tests=[
   {headers:{Origin:'https://attacker.invalid'}},
   {headers:{'X-BWD-Local':'bad'}},
   {headers:{'Content-Type':'text/plain'}},
   {headers:{'Sec-Fetch-Site':'cross-site'}}
  ];
  for(const attack of tests){
   const r=await send('/session/details',{method:'POST',body:{},cookie,headers:attack.headers});
   assert.equal(r.status,403);
  }
  assert.equal((await send('/api/evidence',{cookie})).status,403);
  assert.equal((await send('/session/details',{method:'POST',body:{},cookie})).status,200);
 });
});
test('D3B security: idle timeout revokes all detail endpoints and no secrets appear in static page',async()=>{
 let clock=100000;
 await withPilot(async({send})=>{
  const cookie=await login(send);
  await send('/session/details',{method:'POST',body:{},cookie});
  clock+=1200;
  for(const path of ['/api/summary','/api/projects','/api/evidence']){
   assert.equal((await send(path,{cookie})).status,401);
  }
  const page=await send('/');
  assert.equal(page.status,200);
  assert.doesNotMatch(page.body,/Fictional Atlas|Sample Orchard|github_pat_|selected\.snapshot\.enc\.json|projects\.selection\.json|A0B1C2D3E4F50617/);
 },{now:()=>clock,idleMs:1000,absoluteMs:5000});
});
