// PC-04F — fictional-only owner review worksheet: no writes or real project identifiers.
import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from 'node:http';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {startOwnerLocalServer} from '../tools/private-ui/private-local.mjs';

const NAME='fictional-owner/task-audit',AT='2026-11-01T00:00:00.000Z',PAIR='A1B2C3D4E5F60708';
function snapshot(){
 return projectOfflineEvidence({format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',observedAt:AT,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
    openPRs:{state:'VERIFIED',count:1,atLeast:1,items:[{number:19,draft:true,headSha:'a'.repeat(40),base:'main'}]},
    openIssues:{state:'VERIFIED',count:1,atLeast:1,numbers:[21]}}]},[NAME],Date.parse(AT)+3600000);
}
async function withServer(fn){
 const p=snapshot(),w=createEmptyWorkplan(p,{at:AT});
 const app=await startOwnerLocalServer({projection:p,workplan:w,pairCode:PAIR});
 const hit=(path,{method='GET',body,cookie}={})=>new Promise((ok,fail)=>{
  const headers={Host:'127.0.0.1:'+app.port};let payload;
  if(body!==undefined){
   payload=JSON.stringify(body);headers.Origin='http://127.0.0.1:'+app.port;
   headers['Content-Type']='application/json';headers['X-BWD-Local']='1';
  }
  if(cookie)headers.Cookie=cookie;
  const req=request({hostname:'127.0.0.1',port:app.port,path,method,headers},res=>{
   const bits=[];res.on('data',v=>bits.push(v));
   res.on('end',()=>ok({status:res.statusCode,text:Buffer.concat(bits).toString('utf8'),headers:res.headers}));
  });
  req.on('error',fail);req.end(payload);
 });
 try{await fn({hit,plan:w});}finally{await new Promise(ok=>app.server.close(ok));}
}
test('PC04F static shell contains only no-data local worksheet scaffold',async()=>{
 await withServer(async({hit})=>{
  const html=(await hit('/')).text,css=(await hit('/style.css')).text,script=(await hit('/app.js')).text;
  assert.match(html,/<div id="review-worksheet" class="review-worksheet" hidden><\/div>/);
  assert.match(css,/\.review-check input\{width:20px;height:20px/);
  assert.match(css,/\.review-worksheet\{[^}]*padding:20px/);
  assert.doesNotMatch(html+css+script,/fictional-owner|task-audit|TOP-SECRET|localWorktree:/);
  assert.doesNotMatch(script,/innerHTML|localStorage|sessionStorage|document\.write/);
 });
});
test('PC04F worksheet is only invoked from step-up gated candidate list',async()=>{
 await withServer(async({hit})=>{
  assert.equal((await hit('/api/candidates/details')).status,401);
  const pair=await hit('/session',{method:'POST',body:{code:PAIR}});
  assert.equal(pair.status,200);
  const cookie=pair.headers['set-cookie'][0].split(';')[0];
  assert.equal((await hit('/api/candidates/details',{cookie})).status,403);
  const step=await hit('/session/details',{method:'POST',body:{},cookie});assert.equal(step.status,200);
  const candidates=JSON.parse((await hit('/api/candidates/details',{cookie})).text);
  assert.deepEqual(candidates.projects[0].candidates.map(x=>x.number),[19,21]);
  const js=(await hit('/app.js')).text;
  assert.match(js,/choose\.addEventListener\('click',\(\)=>renderReviewWorksheet\(project,projectIndex,p\)\)/);
  assert.match(js,/if\(!Number\.isInteger\(item\.number\)\|\|item\.number<1\)throw Error/);
 });
});
test('PC04F user worksheet preserves explicit GitHub, branch, test, host and owner decision gates',async()=>{
 await withServer(async({hit})=>{
  const js=(await hit('/app.js')).text;
  for(const marker of [
   'เปิด '+ '','ตรวจฐาน Branch / PR','ตรวจหลักฐาน Host/Deployment','กำหนด P0–P3 ด้วยตนเอง',
   'ไม่บันทึกสถานะ','ยังไม่บันทึกงาน','CONFIRM','ไม่สร้าง TODO']){
    assert.ok(js.includes(marker),'Missing owner gate: '+marker);
  }
  assert.match(js,/const input=document\.createElement\('input'\);input\.type='checkbox'/);
  assert.match(js,/const close=element\('button','ปิดแบบตรวจ \(ไม่บันทึก\)'\)/);
  assert.match(js,/root\.hidden=true;root\.replaceChildren\(\)/);
 });
});
test('PC04F completion of an on-screen checklist never creates server write routes',async()=>{
 await withServer(async({hit,plan})=>{
  const before=JSON.stringify(plan);
  const paired=await hit('/session',{method:'POST',body:{code:PAIR}});
  assert.equal(paired.status,200);
  const cookie=paired.headers['set-cookie'][0].split(';')[0];
  assert.equal((await hit('/api/candidates/details',{method:'POST',body:{},cookie})).status,404);
  assert.equal((await hit('/api/workplan/actions',{method:'POST',body:{},cookie})).status,404);
  assert.equal(plan.projects[0].actions.length,0);
  assert.equal(JSON.stringify(plan),before);
 });
 const publicUi=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const source=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(publicUi,/review-worksheet|renderReviewWorksheet|candidate-entry/);
 assert.doesNotMatch(source,/commitOwnerRevision|createOwnerAction|writeFileSync\(/);
});
test('PC04F logout clears the temporary worksheet and rejects old detail sessions',async()=>{
 await withServer(async({hit})=>{
  const r=await hit('/session',{method:'POST',body:{code:PAIR}});
  const cookie=r.headers['set-cookie'][0].split(';')[0];
  await hit('/session/details',{method:'POST',body:{},cookie});
  assert.equal((await hit('/api/candidates/details',{cookie})).status,200);
  const js=(await hit('/app.js')).text;
  assert.match(js,/el\('review-worksheet'\)\.hidden=true;el\('review-worksheet'\)\.replaceChildren\(\)/);
  assert.equal((await hit('/session/logout',{method:'POST',body:{},cookie})).status,204);
  assert.equal((await hit('/api/candidates/details',{cookie})).status,401);
 });
});
