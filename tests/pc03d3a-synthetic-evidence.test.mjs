import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {buildSyntheticEvidence,validateSyntheticEvidence,AXES} from '../tools/private-ui/synthetic-evidence.mjs';
import {startSyntheticPairingServer} from '../tools/private-ui/auth-synthetic.mjs';

const CODE='112233445566AABB';
async function withServer(callback){
  const server=await startSyntheticPairingServer({pairCode:CODE});
  const send=(path,{method='GET',body,cookie,origin,host,headers={}}={})=>new Promise((resolve,reject)=>{
    const h={Host:host||'127.0.0.1:'+server.port,...headers};
    let payload;
    if(body!==undefined){payload=JSON.stringify(body);h.Origin=origin||'http://127.0.0.1:'+server.port;h['Content-Type']='application/json';h['X-BWD-Local']='1';}
    if(cookie)h.Cookie=cookie;
    const q=request({hostname:'127.0.0.1',port:server.port,path,method,headers:h},r=>{
      const parts=[];r.on('data',part=>parts.push(part));r.on('end',()=>resolve({status:r.statusCode,text:Buffer.concat(parts).toString('utf8'),headers:r.headers}));
    });
    q.on('error',reject);q.end(payload);
  });
  try{await callback(send,server);}
  finally{await new Promise(resolve=>server.server.close(resolve));}
}
async function login(send){
 const response=await send('/session',{method:'POST',body:{code:CODE}});
 assert.equal(response.status,200);
 return response.headers['set-cookie'][0].split(';')[0];
}
test('synthetic evidence contract has five explicit independent axes and no observed actual state',()=>{
 const x=buildSyntheticEvidence();
 assert.equal(x.mode,'SYNTHETIC_ONLY');
 assert.equal(x.source,'FICTIONAL_FIXTURE');
 assert.equal(x.observedAt,null);
 assert.equal(x.projects.length,2);
 assert.deepEqual(AXES,['development','git','deployment','decision','confidence']);
 for(const p of x.projects){
  assert.deepEqual(Object.keys(p.axes),AXES);
  assert.equal(p.axes.development.state,'UNKNOWN');
  assert.equal(p.axes.git.state,'SIMULATED');
  assert.equal(p.axes.deployment.state,'NOT_VERIFIED');
  assert.equal(p.axes.decision.state,'NEEDS_REVIEW');
  assert.equal(p.axes.confidence.state,'DEMO_ONLY');
 }
 const data=JSON.stringify(x);
 assert.doesNotMatch(data,/infobwd\/|\.esdc\.app|selected\.snapshot|github_pat_|ghp_|D:\\/i);
});
test('contract rejects invented verification or fixture identity mismatch',()=>{
 let x=buildSyntheticEvidence();
 x.projects[0].axes.deployment.state='VERIFIED';
 assert.throws(()=>validateSyntheticEvidence(x));
 x=buildSyntheticEvidence();x.projects[0].name='Real School';
 assert.throws(()=>validateSyntheticEvidence(x));
 x=buildSyntheticEvidence();x.observedAt='2026-11-01T00:00:00.000Z';
 assert.throws(()=>validateSyntheticEvidence(x));
});
test('evidence endpoint denies unauthenticated and paired but not detail-authorized clients',async()=>{
 await withServer(async send=>{
  assert.equal((await send('/api/evidence')).status,401);
  const cookie=await login(send);
  assert.equal((await send('/api/evidence',{cookie})).status,403);
  assert.equal((await send('/session/details',{method:'POST',body:{},cookie})).status,200);
  const result=await send('/api/evidence',{cookie});
  assert.equal(result.status,200);
  const data=JSON.parse(result.text);
  validateSyntheticEvidence(data);
  assert.match(result.headers['cache-control'],/no-store/);
  assert.equal((await send('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await send('/api/evidence',{cookie})).status,401);
 });
});
test('evidence endpoint blocks hostile hosts/origins and refuses query paths',async()=>{
 await withServer(async (send,server)=>{
  const cookie=await login(send);
  await send('/session/details',{method:'POST',body:{},cookie});
  assert.equal((await send('/api/evidence',{cookie,host:'evil.example'})).status,403);
  assert.equal((await send('/api/evidence',{cookie,headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await send('/api/evidence?raw=1',{cookie})).status,404);
  assert.equal((await send('/api/evidence',{method:'POST',body:{},cookie})).status,404);
  assert.equal(server.server.address().address,'127.0.0.1');
 });
});
test('local UI has evidence cards and no raw JSON, private snapshot paths or external resources',async()=>{
 await withServer(async send=>{
  const page=await send('/'), js=await send('/app.js'), css=await send('/shell.css');
  assert.equal(page.status,200);
  assert.match(page.text,/id="axes-button"/);
  assert.match(page.text,/id="axes-content"[^>]* hidden/);
  assert.match(js.text,/renderAxes\(/);
  assert.match(js.text,/api\('\/api\/evidence','GET'\)/);
  assert.match(js.text,/document\.createElement/);
  assert.match(css.text,/axis-grid/);
  assert.doesNotMatch(page.text,/<pre\b|https?:\/\/|Fictional Atlas|Sample Orchard/i);
  assert.doesNotMatch(js.text,/innerHTML|localStorage|sessionStorage|readFileSync|decryptSnapshot|selected\.snapshot|https?:\/\//i);
 });
});
