#!/usr/bin/env node
// PC-03D1: intentionally LOCKED, synthetic-only, read-only loopback shell.
// No private filesystem reads, GitHub access, auth endpoints, cookies, client JS, or data APIs.
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
const HTML = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Project Compass — Local locked demo</title><link rel="stylesheet" href="/shell.css"></head>
<body><main class="shell"><header><span class="mark" aria-hidden="true">◈</span>
<span>BWD Project Compass</span><strong class="flag">LOCAL · DEMO · LOCKED</strong></header>
<section class="panel" aria-labelledby="title"><div class="lock" aria-hidden="true">◎</div>
<p class="eyebrow">PC-03D1 · SYNTHETIC SECURITY SHELL</p>
<h1 id="title">Private Dashboard ยังล็อกอยู่</h1>
<p>ต้นแบบสำหรับตรวจสอบการแสดงผลและความปลอดภัยบนเครื่องเท่านั้น ยังไม่เชื่อม Private Registry</p>
<div class="status" role="status"><b>NO PRIVATE DATA LOADED</b><span>ยังไม่มีระบบ Login หรือ Pairing ในระยะนี้</span></div>
<p class="note">การเปิดหน้าเว็บนี้ไม่ได้ยืนยันสิทธิ์เข้าถึง Snapshot หรือสถานะของโครงการใด ๆ</p>
</section><footer>Only local loopback · No Sync · No Merge · No Deploy</footer></main></body></html>`;
const CSS = `:root{font-family:system-ui,"Segoe UI",sans-serif;color-scheme:light;background:#f5f7fc;color:#192b4a}*{box-sizing:border-box}body{margin:0;min-height:100vh}.shell{max-width:960px;margin:auto;padding:28px 22px}header{display:flex;gap:12px;align-items:center;font-weight:700}.mark{font-size:26px;color:#0b589a}.flag{margin-left:auto;font-size:11px;letter-spacing:.07em;padding:9px 12px;border-radius:999px;background:#e7eef9;color:#1d467c}.panel{margin:9vh auto 36px;max-width:680px;padding:clamp(24px,5vw,50px);background:white;border:1px solid #dde5f1;border-radius:24px;box-shadow:0 14px 50px #132e4b10}.lock{font-size:38px;color:#6f91c1}.eyebrow{font-size:12px;color:#657b9e;font-weight:700;letter-spacing:.09em}h1{font-size:clamp(25px,4.4vw,40px);line-height:1.25;margin:16px 0}p{line-height:1.8}.status{display:flex;flex-direction:column;gap:5px;margin-top:28px;padding:18px;border-radius:14px;background:#f5f8fc;border:1px solid #dce6f1}.status b{color:#174d83}.status span,.note,footer{color:#667895;font-size:14px}footer{text-align:center}@media(max-width:560px){.shell{padding:18px 14px}.flag{font-size:10px;padding:7px}.panel{margin-top:8vh;border-radius:16px}}`;

export const SHELL_INFO = Object.freeze({mode:'SYNTHETIC_LOCKED', host:HOST});
const SECURITY_HEADERS = Object.freeze({
  'Cache-Control':'no-store, private', 'Pragma':'no-cache',
  'Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'none'; img-src 'none'; font-src 'none'; connect-src 'none'; form-action 'none'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
  'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY',
  'Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin'
});
function reply(res,status,body='',contentType='text/plain; charset=utf-8',method='GET') {
  res.writeHead(status,{...SECURITY_HEADERS,'Content-Type':contentType});
  res.end(method==='HEAD'?'':body);
}
function handler(req,res,port) {
  const method=req.method||'GET';
  const expectedHost=HOST+':'+port;
  // The correct Host is required; DNS rebinding and hostile browser origins are denied.
  if(req.headers.host!==expectedHost || req.headers.origin && req.headers.origin!=='http://'+expectedHost ||
     req.headers['sec-fetch-site'] && !['none','same-origin'].includes(req.headers['sec-fetch-site'])) {
    return reply(res,403,'Forbidden',undefined,method);
  }
  if(!['GET','HEAD'].includes(method)) return reply(res,405,'Method not allowed',undefined,method);
  if(req.headers['transfer-encoding'] || req.headers['content-length'] && req.headers['content-length']!=='0')
    return reply(res,400,'Bad request',undefined,method);
  if(req.url==='/') return reply(res,200,HTML,'text/html; charset=utf-8',method);
  if(req.url==='/shell.css') return reply(res,200,CSS,'text/css; charset=utf-8',method);
  // There are intentionally no /api, session, pairing, snapshot or wildcard file routes.
  return reply(res,404,'Not found',undefined,method);
}
export async function startLockedDemoServer() {
  const server=createServer((req,res)=>handler(req,res,server.address()?.port));
  server.requestTimeout=5000;server.headersTimeout=5000;server.keepAliveTimeout=1000;
  server.maxRequestsPerSocket=30;
  await new Promise((yes,no)=>{
    server.once('error',no);
    server.listen({host:HOST,port:0,exclusive:true},()=>{server.off('error',no);yes();});
  });
  return {server,host:HOST,port:server.address().port,url:'http://'+HOST+':'+server.address().port+'/'};
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain)startLockedDemoServer().then(({url,server})=>{
  console.log('PC-03D1 LOCKED SYNTHETIC LOCAL DEMO — '+url);
  console.log('No private data loaded. Press Ctrl+C to close. No private login in D1.');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
}).catch(()=>{console.error('Could not bind locked demo to loopback');process.exitCode=1;});
