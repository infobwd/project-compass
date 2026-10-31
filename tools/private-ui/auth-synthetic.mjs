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
const PAGE = \`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BWD Compass — Synthetic Local Pairing</title><link rel="stylesheet" href="/shell.css"><script src="/app.js" defer></script></head>
<body><main><header><strong>BWD Project Compass</strong><small>LOCAL · SYNTHETIC · D2 PILOT</small></header><section class="panel"><p class="label">PC-03D2 — AUTHENTICATION PILOT</p><h1>ยืนยันตัวตนบนเครื่อง (ข้อมูลสมมติ)</h1><p>รับรหัสจับคู่จาก PowerShell ที่เปิดเซิร์ฟเวอร์อยู่เท่านั้น ไม่มีการอ่าน Private Registry</p>
<form id="pair"><label for="code">รหัสจับคู่จาก Terminal</label><input id="code" name="code" autocomplete="off" spellcheck="false" maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" required><button type="submit">จับคู่ครั้งเดียว</button></form>
<p id="status" role="status" aria-live="polite">LOCKED — no real data loaded</p><section id="private" hidden><h2>ภาพรวมสมมติ</h2><pre id="summary"></pre><button type="button" id="details">ยืนยันเพื่อดูรายละเอียดสมมติ</button><pre id="projects" hidden></pre><button type="button" id="logout">ออกจากระบบ</button></section></section><footer>Only 127.0.0.1 · No private snapshot · No Sync · No Merge · No Deploy</footer></main></body></html>\`;
const CSS = \`:root{color:#162e4a;background:#f3f6fb;font-family:system-ui,"Segoe UI",sans-serif}*{box-sizing:border-box}body{margin:0}main{max-width:950px;margin:auto;padding:24px}header{display:flex;justify-content:space-between;align-items:center;gap:10px}header small,.label{color:#315f9a;letter-spacing:.08em;font-size:12px;font-weight:700}.panel{max-width:650px;margin:9vh auto 30px;padding:clamp(22px,5vw,46px);background:white;border:1px solid #d8e3f0;border-radius:20px;box-shadow:0 18px 55px #1728400e}h1{font-size:clamp(23px,4vw,36px)}p{line-height:1.8}form{display:grid;gap:12px;margin:20px 0}input{font-size:17px;padding:12px;border:1px solid #8ca7c7;border-radius:9px}button{border:0;border-radius:9px;padding:13px 18px;cursor:pointer;background:#164d82;color:white;font-weight:700;min-height:44px;margin-right:10px;margin-bottom:8px}button:focus-visible,input:focus-visible{outline:3px solid #dfb642;outline-offset:2px}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f1f5fc;border:1px solid #dbe4f0;padding:15px;border-radius:10px}#status{font-weight:700;color:#22578a}footer{text-align:center;font-size:13px;color:#637894}@media(max-width:540px){main{padding:14px}.panel{margin-top:8vh;border-radius:15px}}\`;
const JS = \`(function(){'use strict';const by=id=>document.getElementById(id);const status=by('status');const panel=by('private');async function api(path,method,body){const options={method,credentials:'same-origin',headers:{'X-BWD-Local':'1'}};if(body!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}const r=await fetch(path,options);if(!r.ok)throw new Error('HTTP '+r.status);return r.status===204?null:r.json();}async function summary(){try{const s=await api('/api/summary','GET');by('summary').textContent=JSON.stringify(s,null,2);panel.hidden=false;status.textContent='PAIRED — synthetic data only';}catch{panel.hidden=true;status.textContent='LOCKED';}}by('pair').addEventListener('submit',async e=>{e.preventDefault();const code=by('code').value.trim();by('code').value='';try{await api('/session','POST',{code});await summary();}catch{status.textContent='จับคู่ไม่สำเร็จ: ตรวจรหัสหรือเปิดเซิร์ฟเวอร์ใหม่';}});by('details').addEventListener('click',async()=>{try{await api('/session/details','POST',{});const x=await api('/api/projects','GET');by('projects').textContent=JSON.stringify(x,null,2);by('projects').hidden=false;}catch{status.textContent='ยังไม่อนุญาตรายละเอียด';}});by('logout').addEventListener('click',async()=>{try{await api('/session/logout','POST',{});}catch{}panel.hidden=true;by('projects').hidden=true;status.textContent='LOCKED';});summary();})();\`;
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
