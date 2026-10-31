#!/usr/bin/env node
// PC-03D2 synthetic pairing PILOT. No private snapshot, CLI tokens, filesystem reads or GitHub calls.
import { createServer } from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const COOKIE = 'bwd_pc03d2';
const DATA = Object.freeze([
  Object.freeze({name:'Fictional Atlas',defaultBranch:'main',openPRs:2,openIssues:1,host:'NOT_VERIFIED'}),
  Object.freeze({name:'Sample Orchard',defaultBranch:'master',openPRs:0,openIssues:3,host:'NOT_VERIFIED'})
]);
const HEADERS = Object.freeze({
  'Cache-Control':'no-store, private', 'Pragma':'no-cache',
  'Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'none'; font-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
  'X-Content-Type-Options':'nosniff', 'X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer', 'Cross-Origin-Resource-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=()'
});
const PAGE = `<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>BWD Compass — Local Synthetic Pairing</title><link rel="stylesheet" href="/shell.css"><script src="/app.js" defer></script></head>
<body><div class="shell"><header class="topbar"><div class="identity"><span class="brand-symbol" aria-hidden="true">◇</span><span><strong>BWD Project Compass</strong><small>PRIVATE DASHBOARD PILOT</small></span></div><span class="mode-tag">LOCAL · SYNTHETIC · D2 PILOT</span></header>
<main class="main"><section class="intro" aria-labelledby="page-title"><span class="eyebrow">PC-03D2 · SYNTHETIC AUTHENTICATION</span><h1 id="page-title">ศูนย์ติดตามโครงการ<br><span>ทดสอบการยืนยันตัวตน</span></h1><p>ต้นแบบที่ทำงานเฉพาะบนคอมเครื่องนี้ แสดงข้อมูลสมมติเท่านั้น ไม่มีการอ่าน Private Registry หรือ GitHub จริง</p></section>
<section class="panel"><form id="pair" class="pair-form"><div class="section-heading"><h2>ยืนยันตัวตนบนเครื่อง</h2><p>ใช้รหัสจับคู่ครั้งเดียวที่แสดงใน PowerShell ภายใน 2 นาที</p></div><label for="code">รหัสจับคู่จาก Terminal</label><input id="code" name="code" autocomplete="off" autocapitalize="characters" spellcheck="false" inputmode="text" maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" required><button class="primary" type="submit">จับคู่เพื่อเข้าสู่หน้าตัวอย่าง</button></form>
<p id="status" class="status" role="status" aria-live="polite">LOCKED — no real data loaded</p>
<section id="private" hidden aria-label="สรุปข้อมูลสมมติหลังจับคู่"><div class="paired-header"><div><span class="eyebrow">AUTHENTICATED · SYNTHETIC ONLY</span><h2>ภาพรวมข้อมูลตัวอย่าง</h2></div><span class="paired-badge">PAIRED</span></div><div id="summary" class="metric-grid" aria-label="ตัวเลขสรุปจำลอง"></div>
<p id="evidence-note" class="evidence-note"></p>
<div class="details-head"><div><h2>รายละเอียดโครงการตัวอย่าง</h2><p>ต้องยืนยันแยกต่างหากก่อนแสดงรายชื่อสมมติ</p></div><button id="details" type="button" class="outline">แสดงรายละเอียดสมมติ</button></div>
<ul id="projects" class="project-list" hidden></ul>
<div class="action-row"><button id="logout" type="button" class="secondary">ออกจากระบบและล็อกหน้าจอ</button></div></section></section>
</main><footer>Read-only synthetic pilot · 127.0.0.1 only · No Snapshot · No Merge · No Deploy</footer></div></body></html>`;
const CSS = `:root{color:#172b47;background:#f2f5fa;font-family:system-ui,"Segoe UI",sans-serif;font-synthesis:none}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0;min-height:100vh}.shell{max-width:1160px;margin:auto;padding:22px 26px 28px}.topbar,.identity,.paired-header,.details-head,.action-row{display:flex;align-items:center;gap:16px}.topbar{justify-content:space-between}.identity .brand-symbol{display:grid;place-items:center;width:40px;height:40px;border-radius:13px;background:#174c86;color:white;font-size:27px;font-weight:700}.identity span:last-child{display:flex;flex-direction:column;gap:2px}.identity strong{font-size:15px}.identity small{font-size:10px;letter-spacing:.09em;color:#6b7e99;font-weight:750}.mode-tag,.paired-badge{padding:9px 12px;border-radius:999px;background:#e5eef9;color:#164d83;font-size:11px;font-weight:800;letter-spacing:.06em}.main{max-width:800px;margin:38px auto}.intro{margin-bottom:23px}.eyebrow{font-size:11px;font-weight:800;color:#3b6797;letter-spacing:.11em}.intro h1{font-size:clamp(26px,4.8vw,42px);line-height:1.25;margin:12px 0}.intro h1 span{color:#2866a3}.intro p,.section-heading p,.details-head p,.evidence-note{line-height:1.65;color:#687c97}.intro p{max-width:650px}.panel{background:white;border:1px solid #dee6f1;border-radius:22px;padding:clamp(20px,4vw,34px);box-shadow:0 16px 45px #18314c0a}.section-heading h2,.paired-header h2,.details-head h2{font-size:21px;margin:6px 0}.section-heading p,.details-head p{font-size:14px;margin:6px 0 16px}.pair-form{display:grid;gap:12px}.pair-form label{font-size:14px;font-weight:700}.pair-form input{font:inherit;min-height:48px;padding:10px 14px;border:1px solid #95a9c7;border-radius:11px;width:100%}button{font:inherit;font-size:14px;min-height:44px;border-radius:11px;border:1px solid transparent;padding:11px 16px;cursor:pointer;font-weight:750}button:disabled{opacity:.65;cursor:default}button:focus-visible,input:focus-visible{outline:3px solid #d6a932;outline-offset:3px}.primary{color:white;background:#17518d}.secondary{color:white;background:#254e7b}.outline{border:1px solid #acc0dc;color:#18538d;background:white}.status{font-size:13px;font-weight:750;color:#1e5d95;min-height:20px;margin:18px 0 0}.paired-header{justify-content:space-between;align-items:flex-start;margin:4px 0 18px}.paired-badge{background:#e5f5ed;color:#146a45}.metric-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.metric{padding:16px;border:1px solid #dfe7f2;border-radius:15px;background:#f6f8fd;min-width:0}.metric dt{color:#667a95;font-size:12px;line-height:1.5}.metric dd{font-size:clamp(20px,3.5vw,28px);font-weight:800;margin:9px 0 2px;color:#1e4c80;overflow-wrap:anywhere}.metric-note{display:block;color:#75869b;font-size:11px;line-height:1.5}.evidence-note{font-size:12px;border-left:3px solid #e0b64c;padding-left:12px;margin:18px 0}.details-head{justify-content:space-between;align-items:end;flex-wrap:wrap;margin:24px 0 10px;padding-top:20px;border-top:1px solid #e4eaf3}.details-head h2{font-size:17px}.project-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}.project-item{border:1px solid #dfe7f2;border-radius:14px;padding:15px 17px;background:#fbfcff}.project-item strong{font-size:16px}.project-meta{display:flex;flex-wrap:wrap;gap:9px;margin-top:9px}.project-meta span{font-size:12px;color:#496682;border-radius:8px;background:#eff4fa;padding:6px 8px}.action-row{justify-content:flex-end;margin-top:24px}footer{text-align:center;color:#71839d;font-size:12px;margin:28px 0 10px}@media(max-width:680px){.shell{padding:15px}.main{margin-top:27px}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.paired-header{align-items:flex-start}.details-head{align-items:stretch}.details-head button,.action-row button{width:100%}}@media(max-width:370px){.metric-grid{grid-template-columns:1fr}.mode-tag{font-size:9px;padding:7px}.topbar{gap:5px}}`;
const JS = `(function(){'use strict';
const by=id=>document.getElementById(id);
const pair=by('pair'), panel=by('private'), status=by('status'), detailButton=by('details'), list=by('projects');
async function api(path,method,body){
 const options={method,credentials:'same-origin',headers:{'X-BWD-Local':'1'}};
 if(body!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}
 const response=await fetch(path,options);
 if(!response.ok)throw new Error('HTTP '+response.status);
 return response.status===204?null:response.json();
}
function node(tag,text,className){
 const el=document.createElement(tag);
 if(className)el.className=className;
 el.textContent=String(text);
 return el;
}
function reset(message){
 panel.hidden=true;pair.hidden=false;pair.reset();list.hidden=true;list.replaceChildren();
 detailButton.disabled=false;detailButton.textContent='แสดงรายละเอียดสมมติ';
 by('summary').replaceChildren();status.textContent=message||'LOCKED — no real data loaded';
}
function card(label,value,note){
 const cell=node('div','', 'metric');
 cell.append(node('dt',label),node('dd',value),node('span',note,'metric-note'));
 return cell;
}
function renderSummary(data){
 if(!data||data.mode!=='SYNTHETIC_ONLY')throw new Error('Unexpected demonstration data');
 const git=data.git||{};
 by('summary').replaceChildren(
  card('โครงการตัวอย่าง',data.scope??'—','ชุดข้อมูลสมมติ'),
  card('Git HEAD ตรวจสอบแล้ว',git.verified??'—','ข้อมูลจำลอง'),
  card('Git HEAD ยังไม่ทราบ',git.unknown??'—','UNKNOWN'),
  card('Open PRs',data.openPRs??'—','ยอดตัวอย่าง'),
  card('Open Issues',data.openIssues??'—','ยอดตัวอย่าง'),
  card('Host / Acceptance',data.host==='NOT_VERIFIED'?'ยังไม่ตรวจ':'UNKNOWN','NOT VERIFIED')
 );
 by('evidence-note').textContent='ข้อมูลนี้ไม่มีเวลาตรวจหลักฐานจริง และไม่ใช่สถานะโครงการของโรงเรียน — Project Acceptance: '+String(data.acceptance||'NOT_VERIFIED');
 panel.hidden=false;pair.hidden=true;
 status.textContent='PAIRED — synthetic data only';
}
function renderProjects(payload){
 if(!payload||payload.mode!=='SYNTHETIC_ONLY'||!Array.isArray(payload.projects))throw new Error('Unexpected project data');
 const entries=payload.projects.map(p=>{
  const item=node('li','', 'project-item');
  item.append(node('strong',p.name||'ตัวอย่าง'));
  const meta=node('div','', 'project-meta');
  meta.append(node('span','Branch: '+(p.defaultBranch||'UNKNOWN')),
              node('span','Open PRs: '+String(p.openPRs??'UNKNOWN')),
              node('span','Issues: '+String(p.openIssues??'UNKNOWN')),
              node('span','Host: '+String(p.host||'NOT_VERIFIED')));
  item.append(meta);return item;
 });
 list.replaceChildren(...entries);list.hidden=false;
 detailButton.disabled=true;detailButton.textContent='กำลังแสดงรายละเอียดสมมติ';
}
async function refresh(){
 try{renderSummary(await api('/api/summary','GET'));}
 catch{reset('LOCKED — no real data loaded');}
}
pair.addEventListener('submit',async event=>{
 event.preventDefault();
 const code=by('code').value.trim();by('code').value='';
 try{await api('/session','POST',{code});renderSummary(await api('/api/summary','GET'));}
 catch{reset('จับคู่ไม่สำเร็จ: ตรวจรหัสหรือเริ่มเซิร์ฟเวอร์ใหม่');}
});
detailButton.addEventListener('click',async()=>{
 try{
  await api('/session/details','POST',{});
  renderProjects(await api('/api/projects','GET'));
 }catch{
  reset('ไม่สามารถยืนยันสิทธิ์แสดงรายละเอียด — ล็อกหน้าจอตัวอย่างแล้ว');
 }
});
by('logout').addEventListener('click',async()=>{
 try{await api('/session/logout','POST',{});reset('ออกจากระบบแล้ว — LOCKED');}
 catch{reset('ไม่ยืนยันการเพิกถอน Session จาก Server — โปรดปิด Server ด้วย Ctrl+C');}
});
refresh();
})();`;
const hash = text => createHash('sha256').update(text).digest();
const equalHash = (a,b) => timingSafeEqual(a,b);
const json = value => JSON.stringify(value);
function send(res,status,body,ctype='application/json; charset=utf-8',extra={}){
  res.writeHead(status,{...HEADERS,'Content-Type':ctype,...extra});res.end(body);
}
const deny = (res,status=403) => send(res,status,json({error:status===429?'retry_limit':'denied'}));
async function readJson(req){
  let total=0;const chunks=[];
  for await(const c of req){total+=c.length;if(total>1024)throw new Error('TOO_LARGE');chunks.push(c);}
  const raw=Buffer.concat(chunks).toString('utf8');
  let v;try{v=JSON.parse(raw);}catch{throw new Error('INVALID_JSON');}
  if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('INVALID_JSON');
  return v;
}
export async function startSyntheticPairingServer({now=()=>Date.now(),pairCode=randomBytes(8).toString('hex').toUpperCase(),pairTtlMs=120000,idleMs=300000,absoluteMs=1200000,maxAttempts=5}={}){
  if(!/^[0-9A-F]{16}$/.test(pairCode))throw new Error('Invalid test pairing code');
  const codeHash=hash(pairCode),issued=now();let used=false,attempts=0,session=null;
  const sessionValid=req=>{
    if(!session)return false;
    const clock=now();if(clock-session.last>idleMs||clock-session.created>absoluteMs||clock<session.created){session=null;return false;}
    const cookie=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(c=>c.startsWith(COOKIE+'='));
    const value=cookie?.slice(COOKIE.length+1);
    if(typeof value!=='string'||!/^[a-f0-9]{64}$/.test(value))return false;
    if(!equalHash(hash(value),session.tokenHash))return false;
    session.last=clock;return true;
  };
  const clearCookie = COOKIE+'=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';
  const handler=async(req,res,port)=>{
    const origin='http://'+HOST+':'+port,method=req.method||'GET',path=req.url;
    if(req.headers.host!==HOST+':'+port || (req.headers.origin&&req.headers.origin!==origin) ||
       (req.headers['sec-fetch-site']&&!['none','same-origin'].includes(req.headers['sec-fetch-site'])))return deny(res);
    if(!['GET','HEAD','POST'].includes(method))return deny(res,405);
    if(typeof path!=='string'||path.includes('?')||path.includes('#')||path.length>128)return deny(res,404);
    const staticFiles={'/':[PAGE,'text/html; charset=utf-8'],'/shell.css':[CSS,'text/css; charset=utf-8'],'/app.js':[JS,'application/javascript; charset=utf-8']};
    if((method==='GET'||method==='HEAD')&&Object.hasOwn(staticFiles,path)){
      const [body,ctype]=staticFiles[path];return send(res,200,method==='HEAD'?'':body,ctype);
    }
    if(method==='GET'&&path==='/api/summary'){
      if(!sessionValid(req))return deny(res,401);
      return send(res,200,json({mode:'SYNTHETIC_ONLY',scope:2,observedAt:null,git:{verified:0,unknown:2},openPRs:2,openIssues:4,host:'NOT_VERIFIED',acceptance:'NOT_VERIFIED'}));
    }
    if(method==='GET'&&path==='/api/projects'){
      if(!sessionValid(req))return deny(res,401);
      if(!session.details)return deny(res,403);
      return send(res,200,json({mode:'SYNTHETIC_ONLY',projects:DATA}));
    }
    if(method==='POST'&&['/session','/session/details','/session/logout'].includes(path)){
      if(req.headers.origin!==origin||req.headers['x-bwd-local']!=='1'||!(/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')))return deny(res);
      let body;try{body=await readJson(req);}catch(e){return deny(res,e.message==='TOO_LARGE'?413:400);}
      if(path==='/session'){
        if(used||now()-issued>pairTtlMs||now()<issued)return deny(res,401);
        if(attempts>=maxAttempts)return deny(res,429);
        attempts++;
        if(Object.keys(body).length!==1||typeof body.code!=='string'||body.code.length!==16||!equalHash(hash(body.code),codeHash))return deny(res,401);
        used=true;
        const token=randomBytes(32).toString('hex');const clock=now();session={tokenHash:hash(token),created:clock,last:clock,details:false};
        return send(res,200,json({paired:true,mode:'SYNTHETIC_ONLY'}),undefined,{'Set-Cookie':COOKIE+'='+token+'; HttpOnly; SameSite=Strict; Path=/; Max-Age='+Math.floor(absoluteMs/1000)});
      }
      if(!sessionValid(req))return deny(res,401);
      if(path==='/session/details'){
        if(Object.keys(body).length) return deny(res,400);
        session.details=true;return send(res,200,json({details:true,mode:'SYNTHETIC_ONLY'}));
      }
      if(Object.keys(body).length)return deny(res,400);
      session=null;return send(res,204,'','text/plain; charset=utf-8',{'Set-Cookie':clearCookie});
    }
    return deny(res,404);
  };
  const server=createServer((req,res)=>handler(req,res,server.address()?.port).catch(()=>deny(res,400)));
  server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxRequestsPerSocket=30;
  await new Promise((ok,no)=>{server.once('error',no);server.listen({host:HOST,port:0,exclusive:true},()=>{server.off('error',no);ok();});});
  server.once('close',()=>{session=null;used=true;});
  return {server,url:'http://'+HOST+':'+server.address().port+'/',port:server.address().port,host:HOST,
    // Terminal/test caller only; never serialised to HTTP, URL, JS or a file.
    pairingCode:pairCode};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain)startSyntheticPairingServer().then(({server,url,pairingCode})=>{
  console.log('PC-03D2 SYNTHETIC-ONLY LOCAL PAIRING — '+url);
  console.log('One-time pairing code (expires after 2 minutes): '+pairingCode);
  console.log('NO PRIVATE SNAPSHOT LOADED. Ctrl+C to close.');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
}).catch(()=>{console.error('PC-03D2 failed to bind loopback.');process.exitCode=1;});
