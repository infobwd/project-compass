// PC-04O O3 — fictional-only DOM and HTTP gate regression.
// No real owner file, passphrase, browser profile or GitHub network.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {runInNewContext} from 'node:vm';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const OWNER='fictional-only';
const NAMES=[OWNER+'/alpha-school',OWNER+'/beta-school'];
const CODE='A1B2C3D4E5F60708',AT='2026-11-01T00:00:00.000Z';
function projection(){
 const record={format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,observedAt:AT,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:2,matched:2},
  inspectedRepositories:2,projects:NAMES.map(name=>({
   fullName:name,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:1,atLeast:1},
   openIssues:{state:'VERIFIED',count:0,atLeast:0}
  }))};
 return projectOfflineEvidence(record,NAMES,Date.parse(AT));
}
async function withServer(fn){
 const app=await startOwnerLocalServer({projection:projection(),pairCode:CODE});
 const hit=(path,{method='GET',cookie,body}={})=>new Promise((resolve,reject)=>{
  const headers={Host:'127.0.0.1:'+app.port};
  if(cookie)headers.Cookie=cookie;
  let data;
  if(body!==undefined){
   data=JSON.stringify(body);
   headers.Origin='http://127.0.0.1:'+app.port;
   headers['Content-Type']='application/json';
   headers['X-BWD-Local']='1';
  }
  const req=request({hostname:'127.0.0.1',port:app.port,path,method,headers},res=>{
   const chunks=[];
   res.on('data',c=>chunks.push(c));
   res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,
    body:Buffer.concat(chunks).toString('utf8')}));
  });
  req.on('error',reject);req.end(data);
 });
 try{await fn(hit);}
 finally{await new Promise(done=>app.server.close(done));}
}
function fakeDom(html){
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
 const nodes=new Map();
 function element(tag='div'){
  return {tagName:tag.toUpperCase(),hidden:false,value:'',textContent:'',children:[],
   attrs:{},handlers:{},className:'',disabled:false,
   append(...items){this.children.push(...items);},
   replaceChildren(...items){this.children=[...items];},
   addEventListener(type,fn){this.handlers[type]=fn;},
   setAttribute(key,value){this.attrs[key]=value;},
   reset(){this.value='';}
  };
 }
 for(const id of ids)nodes.set(id,element());
 for(const id of ['private','projects','project-filter'])nodes.get(id).hidden=true;
 return {nodes,document:{
  getElementById(id){assert.ok(nodes.has(id),'Unexpected DOM id '+id);return nodes.get(id);},
  createElement:element
 }};
}
function mockResponse(status,body){
 return {status,ok:status>=200&&status<300,json:async()=>body};
}
async function tick(){
 await new Promise(resolve=>setImmediate(resolve));
}

test('PC04O O3: locked HTML/JS never exposes fictional names or filter before step-up',async()=>{
 await withServer(async hit=>{
  const [html,js,css]=await Promise.all([hit('/'),hit('/app.js'),hit('/style.css')]);
  for(const r of [html,js,css]){
   assert.equal(r.status,200);
   assert.match(r.headers['cache-control'],/no-store/);
   assert.doesNotMatch(r.body,/fictional-only|alpha-school|beta-school|github_pat_/);
  }
  assert.match(html.body,/id="project-filter"[^>]*hidden/);
  assert.match(html.body,/id="project-query" type="search"/);
  assert.match(js.body,/authorizedProjectRows=\[\]/);
  assert.match(js.body,/if\(el\('project-filter'\)\.hidden\|\|projects\.hidden\)return/);
  assert.doesNotMatch(js.body,/innerHTML|document\.cookie|localStorage|sessionStorage/);
  assert.doesNotThrow(()=>new Function(js.body));
  assert.match(css.body,/\.project-filter input\{width:100%/);
  assert.equal((await hit('/api/projects')).status,401);
 });
});

test('PC04O O3: live synthetic HTTP detail step-up and logout remain 403/200/204/401',async()=>{
 await withServer(async hit=>{
  const r=await hit('/session',{method:'POST',body:{code:CODE}});
  assert.equal(r.status,200);
  const cookie=r.headers['set-cookie'][0].split(';')[0];
  assert.equal((await hit('/api/projects',{cookie})).status,403);
  assert.equal((await hit('/session/details',{method:'POST',body:{},cookie})).status,200);
  const authorized=await hit('/api/projects',{cookie});
  assert.equal(authorized.status,200);
  assert.equal(JSON.parse(authorized.body).projects.length,2);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await hit('/api/projects',{cookie})).status,401);
  assert.equal((await hit('/api/summary',{cookie})).status,401);
 });
});

test('PC04O O3: synthetic browser search is post-step-up, local-only and cleared at logout',async()=>{
 await withServer(async hit=>{
  const h=(await hit('/')).body,script=(await hit('/app.js')).body;
  const {nodes,document}=fakeDom(h);
  let paired=false,detail=false;
  const privateItems=[
   {id:NAMES[0],defaultBranch:'main',openPRs:1,openIssues:0,axes:{development:'UNKNOWN'}},
   {id:NAMES[1],defaultBranch:'main',openPRs:1,openIssues:0,axes:{development:'UNKNOWN'}}
  ];
  const summary={mode:'PRIVATE_LOCAL_SUMMARY',selected:2,headVerified:2,
   openPRsTotal:2,openIssuesTotal:0,deployment:'NOT_VERIFIED',
   acceptance:'NOT_VERIFIED',observedAt:AT,freshness:'RECENT'};
  const calls=[];
  const fetch=async(path,options={})=>{
   calls.push(path);
   if(path==='/api/summary')return mockResponse(paired?200:401,summary);
   if(path==='/session'&&options.method==='POST'){paired=true;return mockResponse(200,{paired:true});}
   if(path==='/session/details'){detail=true;return mockResponse(200,{details:true});}
   if(path==='/api/projects')return mockResponse(!paired?401:!detail?403:200,
    {mode:'PRIVATE_LOCAL_DETAILS',projects:privateItems});
   if(path==='/session/logout'){paired=false;detail=false;return mockResponse(204,null);}
   if(path.startsWith('/api/'))return mockResponse(paired?404:401,{error:'denied'});
   return mockResponse(404,{error:'unknown'});
  };
  runInNewContext(script,{document,fetch,Intl,Date,Promise,console});
  await tick();
  assert.equal(nodes.get('project-filter').hidden,true);
  assert.equal(nodes.get('private').hidden,true);

  nodes.get('code').value=CODE;
  await nodes.get('pair').handlers.submit({preventDefault(){}});
  assert.equal(nodes.get('project-filter').hidden,true);
  assert.equal(nodes.get('projects').hidden,true);
  assert.equal(nodes.get('data-scope').hidden,false);
  assert.ok(!calls.includes('/api/projects'));

  await nodes.get('details').handlers.click();
  assert.equal(nodes.get('project-filter').hidden,false);
  assert.equal(nodes.get('projects').children.length,2);
  assert.match(nodes.get('project-filter-status').textContent,/2 จาก 2/);

  nodes.get('project-query').value='alpha';
  nodes.get('project-query').handlers.input();
  assert.equal(nodes.get('projects').children.length,1);
  assert.equal(nodes.get('projects').children[0].children[0].textContent,NAMES[0]);
  assert.match(nodes.get('project-filter-status').textContent,/1 จาก 2/);

  nodes.get('project-query').value='not-listed';
  nodes.get('project-query').handlers.input();
  assert.equal(nodes.get('projects').children.length,1);
  assert.match(nodes.get('projects').children[0].textContent,/ไม่พบโครงการ/);

  await nodes.get('logout').handlers.click();
  assert.equal(nodes.get('project-filter').hidden,true);
  assert.equal(nodes.get('project-query').value,'');
  assert.equal(nodes.get('projects').hidden,true);
  assert.equal(nodes.get('projects').children.length,0);
  assert.equal(nodes.get('private').hidden,true);
  assert.equal(nodes.get('data-scope').hidden,true);
  assert.equal(calls.includes('/api/workplan/save'),false);
 });
});
