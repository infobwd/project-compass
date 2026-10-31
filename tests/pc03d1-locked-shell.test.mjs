import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {startLockedDemoServer,SHELL_INFO} from '../tools/private-ui/locked-demo.mjs';

let server,port;
before(async()=>({server,port}=await startLockedDemoServer()));
after(async()=>{if(server)await new Promise(ok=>server.close(ok));});

function hit(path='/',{method='GET',headers={}}={}) {
  return new Promise((yes,no)=>{
    const q=request({host:'127.0.0.1',port,path,method,headers},r=>{
      const parts=[];r.on('data',x=>parts.push(x));r.on('end',()=>{
        yes({status:r.statusCode,headers:r.headers,body:Buffer.concat(parts).toString('utf8')});
      });
    });
    q.on('error',no);q.end();
  });
}
test('listener strictly on IPv4 loopback and uses random OS port',()=>{
  assert.equal(SHELL_INFO.host,'127.0.0.1');
  assert.equal(server.address().address,'127.0.0.1');
  assert.ok(port>=1&&port<=65535);
});
test('locked demo is responsive, has no private identifiers or data routes',async()=>{
  const x=await hit();
  assert.equal(x.status,200);
  assert.match(x.body,/viewport/);
  assert.match(x.body,/SYNTHETIC SECURITY SHELL/);
  assert.match(x.body,/NO PRIVATE DATA LOADED/);
  assert.doesNotMatch(x.body,/\.esdc\.app|selected\.snapshot|projects\.selection|github_pat_|ghp_/i);
  assert.doesNotMatch(x.body,/<script/i);
  assert.doesNotMatch(x.body,/<form/i);
});
test('required security and browser cache isolation headers',async()=>{
  const {headers}=await hit();
  assert.match(headers['cache-control'],/no-store/);
  assert.match(headers['content-security-policy'],/default-src 'none'/);
  assert.match(headers['content-security-policy'],/script-src 'none'/);
  assert.match(headers['content-security-policy'],/connect-src 'none'/);
  assert.match(headers['content-security-policy'],/frame-ancestors 'none'/);
  assert.equal(headers['x-frame-options'],'DENY');
  assert.equal(headers['referrer-policy'],'no-referrer');
  assert.equal(headers['x-content-type-options'],'nosniff');
  assert.equal(headers['set-cookie'],undefined);
});
test('local CSS only, no third-party assets',async()=>{
  const x=await hit('/shell.css');
  assert.equal(x.status,200);
  assert.match(x.headers['content-type'],/text\/css/);
  assert.match(x.body,/@media\(max-width:560px\)/);
  assert.doesNotMatch(x.body,/@import|https?:\/\//i);
});
test('private and unknown API paths are inaccessible',async()=>{
  for(const uri of ['/api/summary','/api/projects','/session','/private','/snapshot','/favicon.ico','/../','/%2e%2e/']){
    const x=await hit(uri);
    assert.equal(x.status,404,uri);
    assert.equal(x.body,'Not found');
    assert.match(x.headers['cache-control'],/no-store/);
  }
});
test('forged Host header is blocked (DNS rebinding hardening)',async()=>{
  for(const host of ['evil.example','localhost:'+port,'127.0.0.1:9999','127.0.0.1:'+port+'.evil.test']){
    const x=await hit('/',{headers:{Host:host}});
    assert.equal(x.status,403,host);
    assert.doesNotMatch(x.body,/Private Dashboard|SYNTHETIC SECURITY/);
  }
});
test('untrusted Origin and Sec-Fetch-Site are rejected',async()=>{
  assert.equal((await hit('/',{headers:{Origin:'https://evil.example'}})).status,403);
  assert.equal((await hit('/',{headers:{Origin:'http://127.0.0.1:'+port}})).status,200);
  assert.equal((await hit('/',{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
  assert.equal((await hit('/',{headers:{'Sec-Fetch-Site':'same-origin'}})).status,200);
});
test('no write, unlock, pairing or other state-changing method available',async()=>{
  for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']){
    const x=await hit('/',{method});assert.equal(x.status,405,method);
  }
});
test('nonempty request bodies are rejected',async()=>{
  const x=await hit('/',{headers:{'Content-Length':'2'}});
  assert.equal(x.status,400);
});
test('HEAD carries no body and may not leak details',async()=>{
  const x=await hit('/',{method:'HEAD'});
  assert.equal(x.status,200);assert.equal(x.body,'');
});
