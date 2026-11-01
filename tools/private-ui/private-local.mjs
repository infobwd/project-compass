#!/usr/bin/env node
// D3B-3: owner-only REAL selected Snapshot browser pilot. Never import into public src.
// Terminal passphrase; private in-memory validated data; paired loopback browser ONLY.
import { createServer } from 'node:http';
import { randomBytes,createHash,timingSafeEqual } from 'node:crypto';
import { readFileSync,statSync,realpathSync,lstatSync } from 'node:fs';
import { join,relative,isAbsolute,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privateDir,assertOutsideGit,decryptSnapshot } from '../private-sync/sync.mjs';
import { parseSelection } from '../private-sync/selection.mjs';
import { projectOfflineEvidence } from './offline-projection.mjs';

const HOST='127.0.0.1', COOKIE='bwd_pc_real', MAX_BYTES=8*1024*1024;
const HEADERS=Object.freeze({
 'Cache-Control':'no-store, private','Pragma':'no-cache',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; font-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
 'Cross-Origin-Resource-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'
});
const PAGE=`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BWD Compass — Private Local</title><link rel="stylesheet" href="/style.css"><script defer src="/app.js"></script></head><body><div class="wrap"><header><strong>BWD Project Compass</strong><span class="tag">LOCAL · PRIVATE · READ ONLY</span></header><main><h1>Private Registry บนเครื่อง</h1><p class="notice">อ่าน Snapshot ที่ตรวจความครบถ้วนแล้ว ไม่ใช่ข้อมูล GitHub แบบ Live และไม่ยืนยัน Production</p><form id="pair"><label for="code">รหัสจับคู่ครั้งเดียวจาก PowerShell</label><input id="code" autocomplete="off" inputmode="text" maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" required><button type="submit">จับคู่เบราว์เซอร์</button></form><p id="status" role="status" aria-live="polite">LOCKED — ไม่แสดงข้อมูลส่วนตัว</p><section id="private" hidden><h2>สรุปหลักฐานที่บันทึกไว้</h2><div id="metrics" class="grid"></div><p id="freshness" class="note"></p><div class="row"><button id="details" type="button">ยืนยันและแสดงรายโครงการ</button><button id="logout" type="button" class="outline">ออกจากระบบ / ล้าง Session</button></div><div id="projects" hidden></div></section></main><footer>Local loopback only · ไม่มีการ Merge / Deploy / GitHub Sync</footer></div></body></html>`;
const CSS=`:root{font-family:system-ui,"Segoe UI",sans-serif;color:#142f51;background:#f3f6fb}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}.wrap{max-width:1000px;padding:20px;margin:auto}header,.row{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}header{padding:12px 0}.tag{background:#e2edf9;color:#134b84;font-size:11px;font-weight:800;padding:8px 12px;border-radius:40px}main{background:white;padding:clamp(20px,4vw,42px);border:1px solid #dce5f0;border-radius:24px;margin:24px 0}h1{font-size:clamp(24px,4vw,38px)}h2{font-size:20px}p{line-height:1.6}.notice,.note,footer{color:#607791;font-size:14px}form{display:grid;gap:12px;margin:22px 0}label{font-weight:700}input{min-height:48px;padding:12px;border:1px solid #90a9c8;border-radius:10px;font:inherit}button{border:0;background:#1a5188;color:white;padding:12px 17px;border-radius:11px;min-height:44px;cursor:pointer;font:inherit;font-weight:700}button.outline{background:#edf3fa;color:#1a5188}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.metric,.project{border:1px solid #d9e4f2;background:#f7f9fd;border-radius:14px;padding:14px;min-width:0}.metric strong{display:block;font-size:23px;margin-top:8px;overflow-wrap:anywhere}.metric span{font-size:12px;color:#617b99}.row{margin:20px 0}.project{margin-top:12px}.project h3{margin:0 0 10px;overflow-wrap:anywhere}.axes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.axis{border:1px solid #dce6f2;background:white;border-radius:10px;padding:10px;overflow-wrap:anywhere}.axis b{display:block;font-size:12px;color:#52708f}.axis span{font-size:12px;font-weight:750}footer{text-align:center;margin:20px}@media(max-width:600px){.grid,.axes{grid-template-columns:repeat(2,minmax(0,1fr))}.wrap{padding:12px}main{border-radius:14px}}@media(max-width:380px){.grid,.axes{grid-template-columns:1fr}}button:focus-visible,input:focus-visible{outline:3px solid #d6a239;outline-offset:3px}`;
const JS=`(()=>{'use strict';
const el=id=>document.getElementById(id);
const pair=el('pair'),panel=el('private'),projects=el('projects'),status=el('status');
const element=(tag,value,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=String(value);return n;};
async function api(path,method='GET',body){
 const opt={method,credentials:'same-origin',headers:{'X-BWD-Local':'1'}};
 if(body!==undefined){opt.headers['Content-Type']='application/json';opt.body=JSON.stringify(body);}
 const res=await fetch(path,opt);if(!res.ok)throw Error('Not authorized');
 return res.status===204?null:res.json();
}
function lock(message='LOCKED — ไม่แสดงข้อมูลส่วนตัว'){
 panel.hidden=true;pair.hidden=false;pair.reset();el('metrics').replaceChildren();
 projects.hidden=true;projects.replaceChildren();status.textContent=message;
}
function metric(label,value){const c=element('div','','metric');c.append(element('span',label),element('strong',value===null?'UNKNOWN':value));return c;}
function renderSummary(s){
 if(!s||s.mode!=='PRIVATE_LOCAL_SUMMARY')throw Error('Invalid private summary');
 el('metrics').replaceChildren(metric('Repository ที่เลือก',s.selected),metric('HEAD ตรวจสอบแล้ว',s.headVerified),
  metric('Open PRs',s.openPRsTotal),metric('Open Issues',s.openIssuesTotal),
  metric('Host Deployment',s.deployment),metric('Acceptance',s.acceptance));
 el('freshness').textContent='บันทึกเมื่อ '+s.observedAt+' · อายุหลักฐาน '+s.freshness+' · Git default branch ไม่ยืนยัน Production';
 panel.hidden=false;pair.hidden=true;status.textContent='PAIRED — Private local read-only';
}
function renderProjects(d){
 if(!d||d.mode!=='PRIVATE_LOCAL_DETAILS'||!Array.isArray(d.projects))throw Error('Invalid private detail');
 const labels={development:'Development',git:'Git',deployment:'Deployment',decision:'Decision',confidence:'Confidence'};
 const nodes=d.projects.map(p=>{
  const card=element('article','','project');card.append(element('h3',p.id));
  card.append(element('p','Default branch: '+p.defaultBranch+' · PRs: '+String(p.openPRs??'UNKNOWN')+' · Issues: '+String(p.openIssues??'UNKNOWN')));
  const grid=element('div','','axes');
  for(const key of Object.keys(labels)){
   const a=element('div','','axis');a.append(element('b',labels[key]),element('span',p.axes?.[key]??'UNKNOWN'));grid.append(a);
  }
  card.append(grid);return card;
 });
 projects.replaceChildren(...nodes);projects.hidden=false;el('details').disabled=true;
}
pair.addEventListener('submit',async event=>{
 event.preventDefault();const code=el('code').value;el('code').value='';
 try{await api('/session','POST',{code});renderSummary(await api('/api/summary'));}
 catch{lock('จับคู่ไม่สำเร็จหรือรหัสหมดอายุ — โปรดเริ่ม Server ใหม่หากจำเป็น');}
});
el('details').addEventListener('click',async()=>{
 try{await api('/session/details','POST',{});renderProjects(await api('/api/projects'));}catch{lock('Session ไม่ได้รับอนุญาต — LOCKED');}
});
el('logout').addEventListener('click',async()=>{
 try{await api('/session/logout','POST',{});lock('LOCKED — ออกจากระบบแล้ว; เริ่ม Server ใหม่หากต้องการเข้าอีกครั้ง');}
 catch{lock('ไม่ยืนยันการ Logout จาก Server — โปรดปิด Server ด้วย Ctrl+C');}
});
api('/api/summary').then(renderSummary).catch(()=>lock());
})();`;
const hash=value=>createHash('sha256').update(value).digest();
const respond=(res,status,body='',type='application/json; charset=utf-8',extra={})=>{
 res.writeHead(status,{...HEADERS,'Content-Type':type,...extra});res.end(body);
};
const deny=(res,code=403)=>respond(res,code,JSON.stringify({error:'denied'}));
async function readBody(req){
 let size=0;const parts=[];
 for await(const c of req){size+=c.length;if(size>512)throw Error('TOO_LARGE');parts.push(c);}
 const o=JSON.parse(Buffer.concat(parts).toString('utf8'));
 if(!o||typeof o!=='object'||Array.isArray(o))throw Error('INVALID_BODY');
 return o;
}
function safeRead(folder,name){
 const file=join(folder,name);assertOutsideGit(file);
 if(lstatSync(file).isSymbolicLink())throw Error('Symlink private input refused');
 const real=realpathSync(file),rel=relative(folder,real);
 if(rel.startsWith('..')||isAbsolute(rel))throw Error('Private file not within configured folder');
 const stat=statSync(real);if(!stat.isFile()||stat.size===0||stat.size>MAX_BYTES)throw Error('Invalid private file size');
 return readFileSync(real,'utf8');
}
export function loadPrivateProjection(passphrase,{directory=privateDir(),now=Date.now()}={}){
 if(typeof passphrase!=='string'||passphrase.length<12)throw Error('Invalid passphrase');
 const folder=realpathSync(directory);assertOutsideGit(folder);
 const source=safeRead(folder,'projects.selection.json').replace(/^\uFEFF/,'');
 const config=JSON.parse(source);
 const names=parseSelection(source,config?.owner);
 const envelope=JSON.parse(safeRead(folder,'selected.snapshot.enc.json'));
 const snapshot=decryptSnapshot(envelope,passphrase);
 if(snapshot.owner!==config.owner)throw Error('Owner mismatch');
 return projectOfflineEvidence(snapshot,names,now);
}
export async function startOwnerLocalServer({projection,now=()=>Date.now(),pairCode=randomBytes(8).toString('hex').toUpperCase(),
 pairTtlMs=120000,idleMs=300000,absoluteMs=900000,maxAttempts=5}={}){
 if(!projection||projection.kind!=='PRIVATE_LOCAL_PROJECTION'||projection.boundary!=='OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES'||
    !Array.isArray(projection.projects)||projection.projects.length!==projection.selected||
    !/^[0-9A-F]{16}$/.test(pairCode))throw Error('Invalid private projection or pairing configuration');
 let data=projection,session=null,used=false,attempts=0,sessionTimer=null,pairTimer=null;
 const issueTime=now(),codeHash=hash(pairCode);
 const discard=()=>{data=null;session=null;used=true;if(sessionTimer)clearTimeout(sessionTimer);if(pairTimer)clearTimeout(pairTimer);};
 // Unpaired plaintext cannot remain resident indefinitely. Timers are a safety fallback;
 // mocked time is still independently checked on every real request.
 pairTimer=setTimeout(()=>{if(!used)discard();},pairTtlMs+1000);
 pairTimer.unref?.();
 const active=req=>{
  if(!session||!data)return false;
  const time=now();if(time-session.last>idleMs||time-session.created>absoluteMs||time<session.created){
   discard();return false;
  }
  const found=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));
  const token=found?.slice(COOKIE.length+1);
  if(!token||!/^[a-f0-9]{64}$/.test(token)||!timingSafeEqual(hash(token),session.hash))return false;
  session.last=time;return true;
 };
 const handler=async(req,res,port)=>{
  const method=req.method||'GET',path=req.url,origin='http://'+HOST+':'+port;
  if(req.headers.host!==HOST+':'+port||(req.headers.origin&&req.headers.origin!==origin)||
     (req.headers['sec-fetch-site']&&!['none','same-origin'].includes(req.headers['sec-fetch-site'])))return deny(res,403);
  if(!['GET','POST'].includes(method))return deny(res,405);
  if(typeof path!=='string'||path.length>96||path.includes('?')||path.includes('#'))return deny(res,404);
  if(method==='GET'&&Object.hasOwn({'/':PAGE,'/style.css':CSS,'/app.js':JS},path)){
   const body=path==='/'?PAGE:path==='/style.css'?CSS:JS;
   return respond(res,200,body,path==='/'?'text/html; charset=utf-8':path==='/style.css'?'text/css; charset=utf-8':'application/javascript; charset=utf-8');
  }
  if(method==='GET'&&path==='/api/summary'){
   if(!active(req))return deny(res,401);
   const a=data.aggregate;
   return respond(res,200,JSON.stringify({mode:'PRIVATE_LOCAL_SUMMARY',selected:data.selected,
    headVerified:a.gitHead.verified,openPRsTotal:a.pullRequests.total,openIssuesTotal:a.issues.total,
    observedAt:data.observedAt,freshness:data.freshness.state,deployment:'NOT_VERIFIED',acceptance:'NOT_VERIFIED'}));
  }
  if(method==='GET'&&path==='/api/projects'){
   if(!active(req))return deny(res,401);
   if(!session.details)return deny(res,403);
   const items=data.projects.map(p=>({id:p.id,defaultBranch:p.defaultBranch,openPRs:p.github.openPRs,openIssues:p.github.openIssues,
    axes:Object.fromEntries(Object.entries(p.axes).map(([k,v])=>[k,v.state]))}));
   return respond(res,200,JSON.stringify({mode:'PRIVATE_LOCAL_DETAILS',projects:items}));
  }
  if(method==='POST'&&['/session','/session/details','/session/logout'].includes(path)){
   if(req.headers.origin!==origin||req.headers['x-bwd-local']!=='1'||!(/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')))return deny(res,403);
   let body;try{body=await readBody(req);}catch{return deny(res,400);}
   if(path==='/session'){
    if(!data||used||now()<issueTime||now()-issueTime>pairTtlMs)return deny(res,401);
    if(attempts>=maxAttempts){discard();return deny(res,429);}
    attempts++;
    if(Object.keys(body).length!==1||typeof body.code!=='string'||body.code.length!==16||
       !timingSafeEqual(hash(body.code),codeHash))return deny(res,401);
    used=true;const token=randomBytes(32).toString('hex'),time=now();
    session={hash:hash(token),created:time,last:time,details:false};
    if(pairTimer)clearTimeout(pairTimer);
    sessionTimer=setTimeout(discard,absoluteMs+1000);sessionTimer.unref?.();
    return respond(res,200,JSON.stringify({paired:true}),undefined,
     {'Set-Cookie':COOKIE+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+Math.floor(absoluteMs/1000)});
   }
   if(!active(req))return deny(res,401);
   if(Object.keys(body).length)return deny(res,400);
   if(path==='/session/details'){session.details=true;return respond(res,200,JSON.stringify({details:true}));}
   discard();
   return respond(res,204,'','text/plain; charset=utf-8',
    {'Set-Cookie':COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});
  }
  return deny(res,404);
 };
 const server=createServer((req,res)=>handler(req,res,server.address()?.port).catch(()=>deny(res,400)));
 server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxRequestsPerSocket=30;
 await new Promise((ok,no)=>{server.once('error',no);server.listen({host:HOST,port:0,exclusive:true},()=>{server.off('error',no);ok();});});
 server.once('close',discard);
 return {server,url:'http://'+HOST+':'+server.address().port+'/',host:HOST,port:server.address().port,
  pairingCode:pairCode};
}
function terminalSecret(message){
 if(!process.stdin.isTTY||typeof process.stdin.setRawMode!=='function')throw Error('Interactive private Terminal required');
 return new Promise((ok,no)=>{
  let value='';const cleanup=(err)=>{process.stdin.off('data',handler);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');err?no(err):ok(value);};
  const handler=s=>{for(const ch of s){if(ch==='\r'||ch==='\n'){cleanup();return;}if(ch==='\u0003'){cleanup(Error('Cancelled'));return;}
   if(ch==='\b'||ch==='\u007f'){value=value.slice(0,-1);continue;}if(ch>=' ')value+=ch;}};
  process.stdout.write(message);process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();process.stdin.on('data',handler);
 });
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)(async()=>{
 if(process.argv.length!==3||process.argv[2]!=='--ack-real-private-local')
  throw Error('Usage: node tools/private-ui/private-local.mjs --ack-real-private-local');
 if(!process.env.BWD_COMPASS_PRIVATE_DIR)throw Error('Set BWD_COMPASS_PRIVATE_DIR to a protected absolute folder outside Git');
 const passphrase=await terminalSecret('Private Snapshot passphrase (not echoed): ');
 let projection;try{projection=loadPrivateProjection(passphrase);}catch{throw Error('Cannot unlock/validate selected private Snapshot');}
 const {server,url,pairingCode}=await startOwnerLocalServer({projection});
 projection=null;
 console.log('PRIVATE LOCAL (no remote hosting) — '+url);
 console.log('One-time browser pairing code (expires in 2 minutes): '+pairingCode);
 console.log('Selected encrypted snapshot only; Git data is NOT live. Press Ctrl+C to close.');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
})().catch(()=>{console.error('Private local pilot stopped. Check selected files, passphrase and terminal settings.');process.exitCode=1;});
