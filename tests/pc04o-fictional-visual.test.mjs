// PC-04O visual preview gate, invented records only. Never use real encrypted files.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {fictionalVisualProjection,startFictionalVisualPreview} from '../tools/private-ui/pc04o-fictional-visual.mjs';

const OLD_ENV=process.env.BWD_COMPASS_PRIVATE_DIR;
const restore=()=>{if(OLD_ENV===undefined)delete process.env.BWD_COMPASS_PRIVATE_DIR;
 else process.env.BWD_COMPASS_PRIVATE_DIR=OLD_ENV;};

test('PC04O fictional visual fixture contains four invented projects and unverified Host',()=>{
 const p=fictionalVisualProjection('2026-11-02T00:00:00.000Z');
 assert.equal(p.projects.length,4);
 assert.equal(p.hostDeployment,'NOT_VERIFIED');
 assert.equal(p.projects.every(x=>String(x.id).startsWith('fictional-preview-only/')),true);
 assert.equal(p.projects.some(x=>x.id.includes('alpha-classroom')),true);
});

test('PC04O visual preview refuses any session configured with owner private directory',async()=>{
 try{
  process.env.BWD_COMPASS_PRIVATE_DIR='FAKE_SHOULD_NOT_BE_OPENED';
  await assert.rejects(startFictionalVisualPreview(),/clean PowerShell session/);
 }finally{restore();}
});

test('PC04O fictional visual preview is loopback, requires details step-up and locks on logout',async()=>{
 let app;
 try{
  delete process.env.BWD_COMPASS_PRIVATE_DIR;
  app=await startFictionalVisualPreview();
  assert.equal(app.host,'127.0.0.1');
  const hit=(path,{method='GET',cookie,body}={})=>new Promise((yes,no)=>{
   const headers={Host:'127.0.0.1:'+app.port};
   if(cookie)headers.Cookie=cookie;
   let payload;
   if(body!==undefined){
    payload=JSON.stringify(body);
    headers.Origin='http://127.0.0.1:'+app.port;
    headers['Content-Type']='application/json';
    headers['X-BWD-Local']='1';
   }
   const req=request({hostname:'127.0.0.1',port:app.port,path,method,headers},res=>{
    const bytes=[];res.on('data',x=>bytes.push(x));
    res.on('end',()=>yes({status:res.statusCode,body:Buffer.concat(bytes).toString('utf8'),
     headers:res.headers}));
   });req.on('error',no);req.end(payload);
  });
  assert.equal((await hit('/api/summary')).status,401);
  assert.equal((await hit('/api/projects')).status,401);
  const paired=await hit('/session',{method:'POST',body:{code:app.pairingCode}});
  assert.equal(paired.status,200);
  const cookie=paired.headers['set-cookie'][0].split(';')[0];
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const projects=await hit('/api/projects',{cookie});
  assert.equal(projects.status,200);
  assert.equal(JSON.parse(projects.body).projects.length,4);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await hit('/api/projects',{cookie})).status,401);
 }finally{
  if(app)await new Promise(ok=>app.server.close(ok));
  restore();
 }
});
