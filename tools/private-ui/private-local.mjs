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
import { readPrivateWorkplanFile } from '../private-plan/encrypted-workplan.mjs';
import { validateWorkplan,summarizeWorkplan } from '../private-plan/workplan-model.mjs';
import { buildPrivateMorningBrief } from '../private-plan/morning-brief.mjs';
import { buildPrivateReviewCandidates,summarizePrivateReviewCandidates,buildPrivateCandidatePage } from '../private-plan/review-candidates.mjs';
import { buildPrivateDeltaReviewPage } from '../private-plan/delta-review-queue.mjs';

const HOST='127.0.0.1', COOKIE='bwd_pc_real', MAX_BYTES=8*1024*1024;
const HEADERS=Object.freeze({
 'Cache-Control':'no-store, private','Pragma':'no-cache',
 'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; font-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'; object-src 'none'",
 'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
 'Cross-Origin-Resource-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()'
});
const PAGE=`<!doctype html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BWD Compass — Private Local</title><link rel="stylesheet" href="/style.css"><script defer src="/app.js"></script></head><body><div class="wrap"><header><strong>BWD Project Compass</strong><span class="tag">LOCAL · PRIVATE · READ ONLY</span></header><main><h1>Private Registry บนเครื่อง</h1><p class="notice">อ่าน Snapshot ที่ตรวจความครบถ้วนแล้ว ไม่ใช่ข้อมูล GitHub แบบ Live และไม่ยืนยัน Production</p><form id="pair"><label for="code">รหัสจับคู่ครั้งเดียวจาก PowerShell</label><input id="code" autocomplete="off" inputmode="text" maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" required><button type="submit">จับคู่เบราว์เซอร์</button></form><p id="status" role="status" aria-live="polite">LOCKED — ไม่แสดงข้อมูลส่วนตัว</p><section id="private" hidden><h2>สรุปหลักฐานที่บันทึกไว้</h2><div id="metrics" class="grid"></div><p id="freshness" class="note"></p><div class="row"><button id="details" type="button" aria-expanded="false" aria-controls="projects">ยืนยันและแสดงรายโครงการ</button><button id="logout" type="button" class="outline">ออกจากระบบ / ล้าง Session</button></div><section id="workplan" hidden><h2>ทะเบียนงานที่เจ้าของบันทึกไว้</h2><p class="note">ข้อมูลจากไฟล์แผนงานส่วนตัว ไม่ใช่ GitHub Live · ไม่มีการเพิ่มงานอัตโนมัติ</p><div id="workplan-summary" class="grid"></div><p id="workplan-note" class="note"></p><div id="workplan-actions" hidden></div></section><section id="morning" hidden><h2>สรุปงานวันนี้ · Morning Brief</h2><p class="note">ข้อมูลจาก Snapshot ที่บันทึกไว้และงานที่เจ้าของบันทึกจริง ไม่ใช่ GitHub Live · ไม่ยืนยันว่า Deploy หรือเสร็จแล้ว</p><div id="morning-counts" class="grid"></div><p id="morning-context" class="note"></p><div id="morning-detail" hidden></div></section><section id="candidates" hidden><h2>ข้อเสนอทบทวนจาก PR / Issue</h2><p class="note">จาก Snapshot เข้ารหัสที่บันทึกไว้ ไม่ใช่ GitHub Live · ยังไม่ใช่ TODO และไม่กำหนดความสำคัญให้อัตโนมัติ</p><div id="candidate-counts" class="grid"></div><p id="candidate-note" class="note"></p><div id="candidate-detail" hidden></div><div id="review-worksheet" class="review-worksheet" hidden></div></section><section id="delta" hidden><h2>มีอะไรเปลี่ยนไปตั้งแต่ Snapshot ครั้งก่อน</h2><p class="note">เปรียบเทียบรายการที่บันทึกไว้สองช่วงเวลา ไม่ใช่ GitHub Live และไม่สรุปว่า PR ถูก Merge หรือปิดงานแล้ว</p><div id="delta-counts" class="grid"></div><p id="delta-note" class="note"></p><div id="delta-detail" hidden></div><div id="delta-review-worksheet" class="review-worksheet" hidden></div></section><div id="projects" hidden></div></section></main><footer>Local loopback only · ไม่มีการ Merge / Deploy / GitHub Sync</footer></div></body></html>`;
const CSS=`:root{font-family:system-ui,"Segoe UI",sans-serif;color:#142f51;background:#f3f6fb}*{box-sizing:border-box}[hidden]{display:none!important}body{margin:0}.wrap{max-width:1000px;padding:20px;margin:auto}header,.row{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap}header{padding:12px 0}.tag{background:#e2edf9;color:#134b84;font-size:11px;font-weight:800;padding:8px 12px;border-radius:40px}main{background:white;padding:clamp(20px,4vw,42px);border:1px solid #dce5f0;border-radius:24px;margin:24px 0}h1{font-size:clamp(24px,4vw,38px)}h2{font-size:20px}p{line-height:1.6}.notice,.note,footer{color:#607791;font-size:14px}form{display:grid;gap:12px;margin:22px 0}label{font-weight:700}input{min-height:48px;padding:12px;border:1px solid #90a9c8;border-radius:10px;font:inherit}button{border:0;background:#1a5188;color:white;padding:12px 17px;border-radius:11px;min-height:44px;cursor:pointer;font:inherit;font-weight:700}button.outline{background:#edf3fa;color:#1a5188}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.metric,.project{border:1px solid #d9e4f2;background:#f7f9fd;border-radius:14px;padding:14px;min-width:0}.metric strong{display:block;font-size:23px;margin-top:8px;overflow-wrap:anywhere}.metric span{font-size:12px;color:#617b99}.row{margin:20px 0}.project{margin-top:12px}.project h3{margin:0 0 10px;overflow-wrap:anywhere}.review-item{border:1px solid #d9e4f2;background:#f7f9fd;border-radius:14px;margin-top:10px;overflow:hidden}.review-heading{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:16px;cursor:pointer;min-height:48px;overflow-wrap:anywhere}.review-heading strong{font-size:16px;min-width:0;overflow-wrap:anywhere}.review-heading span{font-size:12px;color:#52708f;white-space:nowrap}.review-item[open] .review-heading{border-bottom:1px solid #d9e4f2}.review-reasons{margin:12px 18px 16px;padding-left:18px;color:#52708f;font-size:14px;line-height:1.7}.review-heading:focus-visible{outline:3px solid #d6a239;outline-offset:-3px}.candidate-entry{padding:10px 0;border-bottom:1px solid #d9e4f2}.candidate-entry p{margin:0 0 7px}.candidate-entry button{padding:9px 14px;font-size:13px;min-height:44px}.review-worksheet{margin-top:18px;border:2px solid #1c4f84;border-radius:15px;background:#f9fbfe;padding:20px}.review-check{display:flex;align-items:flex-start;gap:11px;margin:12px 0;line-height:1.5}.review-page{border:1px solid #d9e4f2;border-radius:12px;padding:12px;margin:10px 0;background:white}.review-page .row{margin:8px 0;gap:8px;flex-wrap:wrap}.review-page button{min-height:44px;padding:8px 12px}.review-page button:disabled{opacity:.5;cursor:not-allowed}.review-check input{width:20px;height:20px;flex-shrink:0;margin-top:2px}.review-worksheet button{margin-top:8px}.review-worksheet:focus-within{scroll-margin-top:16px}.axes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.axis{border:1px solid #dce6f2;background:white;border-radius:10px;padding:10px;overflow-wrap:anywhere}.axis b{display:block;font-size:12px;color:#52708f}.axis span{font-size:12px;font-weight:750}footer{text-align:center;margin:20px}@media(max-width:600px){.grid,.axes{grid-template-columns:repeat(2,minmax(0,1fr))}.axes{grid-template-columns:1fr}.axis span{overflow-wrap:anywhere;word-break:normal}.row button{width:100%}.wrap{padding:12px}main{border-radius:14px}.metric{min-width:0}.metric strong{font-size:22px}}@media(max-width:380px){.grid,.axes{grid-template-columns:1fr}}button:focus-visible,input:focus-visible{outline:3px solid #d6a239;outline-offset:3px}`;
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
 projects.hidden=true;projects.replaceChildren();
 el('workplan').hidden=true;el('workplan-summary').replaceChildren();el('workplan-note').textContent='';
 el('workplan-actions').hidden=true;el('workplan-actions').replaceChildren();
 el('morning').hidden=true;el('morning-counts').replaceChildren();el('morning-context').textContent='';
 el('morning-detail').hidden=true;el('morning-detail').replaceChildren();
 el('candidates').hidden=true;el('candidate-counts').replaceChildren();
 el('candidate-note').textContent='';el('candidate-detail').hidden=true;el('candidate-detail').replaceChildren();
 el('review-worksheet').hidden=true;el('review-worksheet').replaceChildren();
 el('delta').hidden=true;el('delta-counts').replaceChildren();el('delta-note').textContent='';
 el('delta-detail').hidden=true;el('delta-detail').replaceChildren();
 el('delta-review-worksheet').hidden=true;el('delta-review-worksheet').replaceChildren();
 el('details').disabled=false;el('details').textContent='ยืนยันและแสดงรายโครงการ';el('details').setAttribute('aria-expanded','false');status.textContent=message;
}
function metric(label,value){const c=element('div','','metric');c.append(element('span',label),element('strong',value===null?'UNKNOWN':value));return c;}
function renderSummary(s){
 if(!s||s.mode!=='PRIVATE_LOCAL_SUMMARY')throw Error('Invalid private summary');
 el('metrics').replaceChildren(metric('Repository ที่เลือก',s.selected),metric('HEAD ตรวจสอบแล้ว',s.headVerified),
  metric('Open PRs',s.openPRsTotal),metric('Open Issues',s.openIssuesTotal),
  metric('Host Deployment',s.deployment),metric('Acceptance',s.acceptance));
 const date=new Date(s.observedAt);
 const localTime=Number.isFinite(date.getTime())?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(date):'ไม่ระบุเวลา';
 const ageLabel=s.freshness==='RECENT'?'RECENT (ไม่ใช่ GitHub Live)':s.freshness==='AGING'?'AGING (ควรตรวจใหม่)':s.freshness==='STALE'?'STALE (ห้ามอ้างสถานะปัจจุบัน)':'CLOCK_SKEW / UNKNOWN';
 el('freshness').textContent='บันทึกเมื่อ '+localTime+' (เวลาไทย) · อายุหลักฐาน '+ageLabel+' · Git default branch ไม่ยืนยัน Production';
 panel.hidden=false;pair.hidden=true;status.textContent='PAIRED — Private local read-only';
}
function renderOwnerSummary(d){
 if(!d||d.mode!=='OWNER_PRIVATE_WORKPLAN_SUMMARY')throw Error('Invalid owner workplan summary');
 el('workplan-summary').replaceChildren(
  metric('งานที่เจ้าของบันทึกและยังเปิดอยู่',d.openActions),
  metric('งานเกินกำหนดจากวันบันทึก',d.overdueActions),
  metric('โครงการรอการตัดสินใจ',d.waitingDecision),
  metric('ตรวจสถานะโดยเจ้าของแล้ว',d.ownerReviewed));
 const foot=element('p','จำนวนงาน 0 หมายถึงยังไม่บันทึกงาน ไม่ได้หมายความว่าโครงการจริงไม่มีงานค้าง','note');
 el('workplan-note').textContent=foot.textContent;
 el('workplan').hidden=false;
}
function renderOwnerActions(d){
 if(!d||d.mode!=='OWNER_PRIVATE_WORKPLAN_ACTIONS'||!Array.isArray(d.actions))throw Error('Invalid owner workplan actions');
 const root=el('workplan-actions');root.replaceChildren();
 root.append(element('h3','งานถัดไปที่เจ้าของบันทึกจริง — '+d.totalActions+' รายการ'));
 if(d.actions.length===0)root.append(element('p','ยังไม่มีงานที่เจ้าของบันทึกลงทะเบียน — ไม่ได้หมายถึงงานจริงเสร็จแล้ว','note'));
 for(const task of d.actions){
  const card=element('article','','project');
  card.append(element('h3',task.title));
  card.append(element('p','โครงการ: '+task.repository+' · '+task.priority+' · '+task.status+' · '+task.owner));
  card.append(element('p','ครบกำหนด: '+(task.dueDate??'ยังไม่กำหนด')+' · บันทึกเมื่อ '+task.updatedAt));
  if(task.nextStep)card.append(element('p','ทำต่อ: '+task.nextStep));
  if(task.reason)card.append(element('p','สาเหตุ/ช่องว่าง: '+task.reason));
  root.append(card);
 }
 if(d.truncated)root.append(element('p','รายการบางส่วนถูกจำกัดจำนวนเพื่อการแสดงผล กรุณาอ่านไฟล์ส่วนตัวผ่าน CLI','note'));
 root.hidden=false;
}
function renderMorningSummary(b){
 if(!b||b.mode!=='OWNER_PRIVATE_MORNING_SUMMARY')throw Error('Invalid private morning summary');
 el('morning-counts').replaceChildren(
  metric('งานที่เจ้าของบันทึกว่ายังต้องทำ',b.openActions),
  metric('งานเกินกำหนดตามเวลาไทย',b.overdueActions),
  metric('โครงการรอการตัดสินใจ',b.waitingDecision),
  metric('โครงการต้องตรวจหลักฐาน',b.reviewPrompts));
 const dated=new Date(b.observedAt);
 const when=Number.isFinite(dated.getTime())
  ?new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(dated)
  :'ไม่ทราบเวลาบันทึกหลักฐาน';
 el('morning-context').textContent='รายงานวันที่ '+b.dayBangkok+
  ' · Snapshot บันทึก '+when+' · '+b.freshness+
  ' · ไม่ใช่ GitHub Live · งาน 0 หมายถึงยังไม่บันทึก TODO ไม่ใช่งานจริงเสร็จแล้ว';
 el('morning').hidden=false;
}
function renderMorningDetails(b){
 if(!b||b.mode!=='OWNER_PRIVATE_MORNING_DETAILS'||!Array.isArray(b.actions)||!Array.isArray(b.reviewPrompts))
  throw Error('Invalid private morning details');
 const parent=el('morning-detail');parent.replaceChildren();
 if(b.actions.length>0)parent.append(element('h3','งานถัดไปที่เจ้าของบันทึกจริง'));
 else parent.append(element('p','ยังไม่มี TODO ที่เจ้าของบันทึก — ดูเรื่องที่ควรตรวจสอบด้านล่างเพื่อเริ่มทบทวนหลักฐาน','note'));
 for(const task of b.actions){
  const card=element('article','','project');
  card.append(element('h3',task.title));
  card.append(element('p','โครงการ '+task.repository+' · '+task.priority+' · '+task.status+(task.overdue?' · เกินกำหนด':'')+' · '+task.owner));
  if(task.dueDate)card.append(element('p','ครบกำหนด '+task.dueDate));
  if(task.nextStep)card.append(element('p','ทำต่อ '+task.nextStep));
  parent.append(card);
 }
 if(b.moreActions)parent.append(element('p','มีงานเพิ่มเติมที่ไม่ได้แสดง ให้ดูผ่านระบบส่วนตัวหลังทบทวนสิทธิ์','note'));
 parent.append(element('h3','สิ่งที่ควรตรวจสอบ — ยังไม่ใช่งานที่รับรองแล้ว ('+b.reviewPrompts.length+' โครงการ)'));
 parent.append(element('p','แตะชื่อโครงการเพื่อดูประเด็นที่ยังไม่มีหลักฐานรับรอง','note'));
 const labels={OWNER_REVIEW_NOT_RECORDED:'ยังไม่มีบันทึกตรวจโดยเจ้าของ',
   DEVELOPMENT_NOT_OWNER_ACCEPTED:'ยังไม่รับรองการพัฒนา',
   HOST_NOT_OWNER_REVIEWED:'ยังไม่ได้บันทึกผลตรวจ Host',
   OWNER_DECISION_PENDING:'รอการตัดสินใจ',
   NO_ACTION_RECORDED:'ยังไม่มี TODO ที่บันทึก'};
 for(const entry of b.reviewPrompts){
  const card=element('details','','review-item');
  const heading=element('summary','','review-heading');
  heading.append(element('strong',entry.repository));
  heading.append(element('span',entry.missing.length+' ประเด็น'));
  card.append(heading);
  const reasons=element('ul','','review-reasons');
  for(const code of entry.missing)reasons.append(element('li',labels[code]??'หลักฐานยังไม่ครบ'));
  card.append(reasons);parent.append(card);
 }
 if(b.moreReviews)parent.append(element('p','มีโครงการที่ควรตรวจเพิ่มเติม รายงานนี้จำกัดจำนวนรายการเพื่อความปลอดภัย','note'));
 parent.hidden=false;
}
function renderCandidateSummary(d){
 if(!d||d.mode!=='PRIVATE_REVIEW_CANDIDATES_SUMMARY')throw Error('Invalid review candidate summary');
 el('candidate-counts').replaceChildren(
  metric('PR ที่มีหมายเลขใน Snapshot',d.knownPRReferences),
  metric('Issue ที่มีหมายเลขใน Snapshot',d.knownIssueReferences),
  metric('ข้อเสนอที่แสดงเพื่อทบทวน',d.shownCandidates),
  metric('ชุดข้อมูลที่ต้องตรวจเพิ่ม',d.incompleteReferenceCollections));
 el('candidate-note').textContent='ข้อมูลบันทึกเมื่อ '+d.observedAt+' · '+d.freshness+
  ' · หมายเลข PR/Issue อาจเปลี่ยนสถานะแล้ว ต้องเปิดตรวจ GitHub ล่าสุดก่อนดำเนินการ · ยังไม่สร้าง TODO';
 el('candidates').hidden=false;
}
// PC-04F: browser-only review worksheet, never a saved TODO or a claim of current GitHub state.
function renderReviewWorksheet(project,index,item,rootId='review-worksheet',changeContext=''){
 const root=el(rootId);root.replaceChildren();
 if(!Number.isInteger(item.number)||item.number<1)throw Error('Invalid reference');
 const kind=item.kind==='REVIEW_OPEN_PR_AT_SNAPSHOT'?'PR':'Issue';
 const heading=element('h3','แบบตรวจสอบ '+kind+' #'+item.number+' — ยังไม่บันทึกงาน');
 root.append(heading);
 root.append(element('p','โครงการ '+project.repository+' · ลำดับโครงการในทะเบียน '+(index+1),'note'));
 root.append(element('p','อ้างอิงจาก Snapshot ที่บันทึกไว้ อาจไม่ใช่สถานะ GitHub ล่าสุด และยังไม่ได้จัดลำดับความสำคัญ','note'));
 if(changeContext)root.append(element('p',changeContext+' — เป็นความเปลี่ยนแปลงของรายการเปิด ไม่ใช่หลักฐานว่า Merge หรือปิดงาน','note'));
 const checks=[
  'เปิด '+kind+' #'+item.number+' ที่ GitHub และตรวจสถานะล่าสุดก่อน',
  'ตรวจฐาน Branch / PR ที่เป็นเงื่อนไขและผลทดสอบล่าสุด',
  'ตรวจหลักฐาน Host/Deployment แยกจาก Git HEAD หากเกี่ยวข้อง',
  'เจ้าของพิจารณาว่ามีงานถัดไปจริงและกำหนด P0–P3 ด้วยตนเอง'
 ];
 for(const [i,label] of checks.entries()){
  const wrap=element('label','','review-check');
  const input=document.createElement('input');input.type='checkbox';
  input.setAttribute('aria-label','ข้อ '+(i+1)+': '+label);
  wrap.append(input,element('span',label));root.append(wrap);
 }
 root.append(element('p','การทำเครื่องหมายในแบบตรวจนี้ไม่บันทึกสถานะ และไม่สร้าง TODO หรือยืนยันว่า PR พร้อม Merge','note'));
 root.append(element('p','หากตัดสินใจรับเป็นงาน: กลับไป PowerShell ส่วนตัว ใช้ action-entry.mjs --add-action เลือกโครงการลำดับ '+(index+1)+' กรอกงานด้วยตนเอง แล้วพิมพ์ CONFIRM เพื่อบันทึกไฟล์เข้ารหัส','note'));
 const close=element('button','ปิดแบบตรวจ (ไม่บันทึก)');close.type='button';
 close.addEventListener('click',()=>{root.hidden=true;root.replaceChildren();});
 root.append(close);root.hidden=false;
 heading.setAttribute('tabindex','-1');heading.focus();
}
// PC-04H: inspect complete VERIFIED saved lists in bounded pages, never live GitHub or owner TODO.
function openCandidatePage(project,projectIndex,kind){
 const host=document.createElement('div');host.className='review-page';
 const label=element('p','กำลังอ่านข้อมูล Snapshot ที่บันทึกไว้','note');
 host.append(label);
 let version=0;
 async function show(page){
  const request=++version;
  label.textContent='กำลังอ่านรายการที่บันทึกไว้ — ไม่ใช่ GitHub Live';
  try{
   const d=await api('/api/candidates/page/'+projectIndex+'/'+kind+'/'+page);
   if(!host.isConnected||panel.hidden||request!==version)return;
   host.replaceChildren();
   if(d.mode!=='PRIVATE_REVIEW_CANDIDATE_PAGE'||d.kind!==kind||d.projectIndex!==projectIndex)
    throw Error('Invalid candidate page');
   host.append(element('p',(kind==='PR'?'PR':'Issue')+' — '+project.repository+' · ข้อมูล Snapshot ไม่ใช่ GitHub Live','note'));
   if(d.enumeration!=='SAVED_ENUMERATION_COMPLETE'){
    host.append(element('p','หลักฐานหมายเลขไม่ครบ จึงไม่สร้างรายการขึ้นเอง','note'));return;
   }
   host.append(element('p','รายการที่ '+(d.total?d.page*d.pageSize+1:0)+'–'+
    Math.min(d.total,(d.page+1)*d.pageSize)+' จาก '+d.total+' รายการ · ความสำคัญยังไม่ประเมิน','note'));
   for(const item of d.items){
    const entry=element('div','','candidate-entry');
    entry.append(element('p',(kind==='PR'?'PR #':'Issue #')+item.number+
     (item.draft===true?' · Draft':'')+' · ยังไม่ใช่ TODO'));
    const choose=element('button','เลือกตรวจรายการนี้');choose.type='button';
    choose.addEventListener('click',()=>renderReviewWorksheet(project,projectIndex,{
     number:item.number,kind:kind==='PR'?'REVIEW_OPEN_PR_AT_SNAPSHOT':'REVIEW_OPEN_ISSUE_AT_SNAPSHOT'
    }));
    entry.append(choose);host.append(entry);
   }
   const nav=element('div','','row');
   const prev=element('button','ก่อนหน้า');prev.type='button';prev.disabled=d.page===0;
   prev.addEventListener('click',()=>show(d.page-1));
   const next=element('button','หน้าถัดไป');next.type='button';next.disabled=d.page+1>=d.pages;
   next.addEventListener('click',()=>show(d.page+1));
   nav.append(prev,next);host.append(nav);
  }catch{
   if(host.isConnected&&!panel.hidden&&request===version)
    host.replaceChildren(element('p','เปิดรายการไม่ได้ — ตรวจสิทธิ์และความครบถ้วนของหลักฐาน','note'));
  }
 }
 return {host,show};
}
function renderCandidateDetails(d){
 if(!d||d.mode!=='PRIVATE_REVIEW_CANDIDATES_DETAILS'||!Array.isArray(d.projects))
  throw Error('Invalid review candidate details');
 const root=el('candidate-detail');root.replaceChildren();
 el('review-worksheet').hidden=true;el('review-worksheet').replaceChildren();
 root.append(element('h3','รายการเสนอให้เจ้าของพิจารณา — ไม่ใช่ TODO'));
 root.append(element('p','เรียงหมายเลข PR/Issue เพื่อใช้ค้นหาเท่านั้น ไม่ใช่การจัดลำดับความสำคัญ โปรดเปิดตรวจสถานะล่าสุดก่อนรับเป็นงาน','note'));
 for(const [projectIndex,project] of d.projects.entries()){
  const box=element('details','','review-item');
  const header=element('summary','','review-heading');
  header.append(element('strong',project.repository));
  header.append(element('span',project.candidates.length+' ข้อเสนอ'));
  box.append(header);
  const details=element('div','','project');
  if(project.enumeration!=='SAVED_ENUMERATIONS_COMPLETE')
   details.append(element('p','รายการ PR/Issue จาก Snapshot ไม่ครบหรือไม่ตรวจยืนยัน — ไม่เสนอรายการที่ไม่มีหลักฐาน','note'));
  for(const p of project.candidates){
   const entry=element('div','','candidate-entry');
   entry.append(element('p',(p.kind==='REVIEW_OPEN_PR_AT_SNAPSHOT'?'PR #':'Issue #')+p.number+
    (p.draft===true?' · Draft':'')+' · ยังไม่ใช่ TODO / ความสำคัญยังไม่ประเมิน'));
   const choose=element('button','เลือกตรวจรายการนี้');choose.type='button';
   choose.addEventListener('click',()=>renderReviewWorksheet(project,projectIndex,p));
   entry.append(choose);details.append(entry);
  }
  if(project.omittedPRs>0||project.omittedIssues>0){
   details.append(element('p','ยังมีหมายเลขที่ไม่ได้แสดงในรายการย่อ: PR '+(project.omittedPRs??'?')+
    ' / Issue '+(project.omittedIssues??'?')+' — เปิดดูจาก Snapshot ทีละหน้าได้','note'));
   for(const kind of ['PR','ISSUE']){
    const remaining=kind==='PR'?project.omittedPRs:project.omittedIssues;
    if(!(remaining>0))continue;
    const button=element('button','ดู'+(kind==='PR'?' PR':' Issue')+' ทั้งหมดจาก Snapshot');button.type='button';
    let view=null;
    button.addEventListener('click',()=>{
     if(view){view.host.remove();view=null;button.textContent='ดู'+(kind==='PR'?' PR':' Issue')+' ทั้งหมดจาก Snapshot';return;}
     view=openCandidatePage(project,projectIndex,kind);
     button.insertAdjacentElement('afterend',view.host);button.textContent='ปิดรายการ'+(kind==='PR'?' PR':' Issue');
     view.show(0);
    });
    details.append(button);
   }
  }
  details.append(element('p','ขั้นต่อไป: ตรวจ PR/Issue ตามหมายเลขบน GitHub แล้วบันทึก TODO ผ่านคำสั่งเจ้าของและยืนยัน CONFIRM เฉพาะรายการที่เลือก','note'));
  box.append(details);root.append(box);
 }
 root.hidden=false;
}
function renderDeltaSummary(d){
 if(!d||d.mode!=='PC04I_SAVED_SNAPSHOT_DELTA_SUMMARY')throw Error('Invalid delta summary');
 el('delta-counts').replaceChildren(
  metric('PR ที่เพิ่งพบในรายการเปิด',d.totals.prsNewlyObservedOpen),
  metric('PR ที่ไม่อยู่ในรายการเปิดแล้ว',d.totals.prsNoLongerObservedOpen),
  metric('Issue ที่เพิ่งพบในรายการเปิด',d.totals.issuesNewlyObservedOpen),
  metric('Git HEAD ที่เปลี่ยน (ตรวจเทียบได้)',d.totals.defaultHeadsChanged));
 el('delta-note').textContent='บันทึกเก่า '+d.previousObservedAt+' · ใหม่ '+d.currentObservedAt+
  ' · ไม่ทราบว่า PR ที่หายไปนั้น Merge, ปิด หรือเกิดจากสาเหตุใด ต้องตรวจ GitHub ล่าสุด';
 el('delta').hidden=false;
}
// PC-04J — paginate all saved OPEN-list changes, then open the existing unsaved worksheet.
function openDeltaReviewPage(project,index,kind,change){
 const host=element('div','','review-page');host.append(element('p','กำลังอ่านรายการเปลี่ยนแปลง','note'));
 let version=0;
 async function show(page){
  const request=++version;
  host.replaceChildren(element('p','กำลังอ่าน Snapshot ที่บันทึกไว้ ไม่ใช่ GitHub Live','note'));
  try{
   const data=await api('/api/delta/review/'+index+'/'+kind+'/'+change+'/'+page);
   if(!host.isConnected||panel.hidden||request!==version)return;
   if(data.mode!=='PC04J_PRIVATE_DELTA_REVIEW_PAGE'||data.projectIndex!==index||
      data.kind!==kind||data.change!==change||data.repository!==project.repository)
    throw Error('Invalid saved delta review page');
   host.replaceChildren();
   const changeLabel=change==='NEW_OPEN'?'เพิ่งพบว่าเปิด':'ไม่อยู่ในรายการเปิดแล้ว';
   host.append(element('p',kind+' '+changeLabel+' · หน้า '+(data.page+1)+'/'+Math.max(1,data.pages)+
    ' · ข้อมูลเก่า ไม่ใช่ GitHub Live','note'));
   host.append(element('p','แสดง '+(data.total?data.page*data.pageSize+1:0)+'–'+
    Math.min(data.total,(data.page+1)*data.pageSize)+' จาก '+data.total+
    ' · ไม่จัดอันดับ ไม่ใช่ TODO และไม่ยืนยัน Merge/Close','note'));
   for(const row of data.items){
    const entry=element('div','','candidate-entry');
    entry.append(element('p',kind+' #'+row.number+' · '+changeLabel+
     ' · ยังไม่ประเมินความสำคัญ','note'));
    const button=element('button','เปิดแบบตรวจหลักฐาน');button.type='button';
    button.addEventListener('click',()=>renderReviewWorksheet(
     {repository:project.repository},index,{
      number:row.number,kind:kind==='PR'?'REVIEW_OPEN_PR_AT_SNAPSHOT':'REVIEW_OPEN_ISSUE_AT_SNAPSHOT'
     },'delta-review-worksheet',changeLabel));
    entry.append(button);host.append(entry);
   }
   const nav=element('div','','row');
   const prev=element('button','ก่อนหน้า');prev.type='button';prev.disabled=data.page===0;
   prev.addEventListener('click',()=>show(data.page-1));
   const next=element('button','หน้าถัดไป');next.type='button';next.disabled=data.page+1>=data.pages;
   next.addEventListener('click',()=>show(data.page+1));
   nav.append(prev,next);host.append(nav);
  }catch{
   if(host.isConnected&&!panel.hidden&&request===version)
    host.replaceChildren(element('p','ไม่สามารถแสดงรายการได้ กรุณาตรวจสิทธิ์หรือหลักฐาน','note'));
  }
 }
 return {host,show};
}
function renderDeltaDetails(d){
 if(!d||d.mode!=='PC04I_SAVED_SNAPSHOT_DELTA_DETAILS'||!Array.isArray(d.projects))
  throw Error('Invalid Snapshot delta detail');
 const root=el('delta-detail');root.replaceChildren();
 el('delta-review-worksheet').hidden=true;el('delta-review-worksheet').replaceChildren();
 root.append(element('h3','หลักฐานที่เปลี่ยน — ยังไม่ใช่ TODO'));
 for(const [projectIndex,p] of d.projects.entries()){
  const box=element('details','','review-item'),head=element('summary','','review-heading');
  head.append(element('strong',p.repository));head.append(element('span',
   'PR เพิ่ม '+p.prAddedCount+' / ไม่พบ '+p.prMissingCount));
  box.append(head);
  const details=element('div','','project');
  const renderNumbers=(label,nums,omitted)=>{
   details.append(element('p',label+': '+(nums.length?nums.join(', '):'ไม่มี')+
    (omitted>0?' · และอีก '+omitted+' รายการที่ไม่ได้แสดง':''),'note'));
  };
  renderNumbers('PR ที่เพิ่งพบว่าเปิด',p.prAdded,p.prAddedOmitted);
  renderNumbers('PR ที่ไม่พบในรายการเปิด (ไม่ใช่หลักฐาน Merge)',p.prMissing,p.prMissingOmitted);
  renderNumbers('Issue ที่เพิ่งพบว่าเปิด',p.issueAdded,p.issueAddedOmitted);
  renderNumbers('Issue ที่ไม่พบในรายการเปิด (ไม่ใช่หลักฐานปิด)',p.issueMissing,p.issueMissingOmitted);
  for(const [kind,change,count] of [
   ['PR','NEW_OPEN',p.prAddedCount],['PR','NO_LONGER_OPEN',p.prMissingCount],
   ['ISSUE','NEW_OPEN',p.issueAdded.length+p.issueAddedOmitted],
   ['ISSUE','NO_LONGER_OPEN',p.issueMissing.length+p.issueMissingOmitted]
  ]){
   if(count===0)continue;
   const label=(kind==='PR'?'PR':'Issue')+' '+(change==='NEW_OPEN'?'เพิ่งพบว่าเปิด':'ไม่อยู่ในรายการเปิดแล้ว');
   const button=element('button','ตรวจ '+label+' ทั้งหมด ('+count+')');button.type='button';
   let view=null;
   button.addEventListener('click',()=>{
    if(view){view.host.remove();view=null;button.textContent='ตรวจ '+label+' ทั้งหมด ('+count+')';return;}
    view=openDeltaReviewPage(p,projectIndex,kind,change);
    button.insertAdjacentElement('afterend',view.host);button.textContent='ปิด '+label;
    view.show(0);
   });
   details.append(button);
  }
  details.append(element('p','Default HEAD เปลี่ยน: '+(
   p.headChanged===null?'ยังเปรียบเทียบไม่ได้':p.headChanged?'ใช่':'ไม่พบการเปลี่ยน')+
   ' · ยังไม่ยืนยัน Production','note'));
  box.append(details);root.append(box);
 }
 root.hidden=false;
}
async function showDeltaSummaryIfAvailable(){
 try{renderDeltaSummary(await api('/api/delta/summary'));return true;}
 catch{el('delta').hidden=true;return false;}
}
async function showCandidatesSummaryIfAvailable(){
 try{renderCandidateSummary(await api('/api/candidates/summary'));return true;}
 catch{el('candidates').hidden=true;return false;}
}
async function showMorningSummaryIfAvailable(){
 try{renderMorningSummary(await api('/api/morning/summary'));return true;}
 catch{el('morning').hidden=true;return false;}
}
async function showOwnerSummaryIfAvailable(){
 try{renderOwnerSummary(await api('/api/workplan/summary'));return true;}
 catch{el('workplan').hidden=true;return false;}
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
 projects.replaceChildren(...nodes);projects.hidden=false;el('details').disabled=true;el('details').textContent='กำลังแสดงรายละเอียดรายโครงการ';el('details').setAttribute('aria-expanded','true');
}
pair.addEventListener('submit',async event=>{
 event.preventDefault();const code=el('code').value;el('code').value='';
 try{await api('/session','POST',{code});renderSummary(await api('/api/summary'));await showOwnerSummaryIfAvailable();await showMorningSummaryIfAvailable();await showCandidatesSummaryIfAvailable();await showDeltaSummaryIfAvailable();}
 catch{lock('จับคู่ไม่สำเร็จหรือรหัสหมดอายุ — โปรดเริ่ม Server ใหม่หากจำเป็น');}
});
el('details').addEventListener('click',async()=>{
 try{
  await api('/session/details','POST',{});
  renderProjects(await api('/api/projects'));
  // Morning Brief and Workplan share the same owner-entered TODOs. Avoid duplicate cards.
  if(!el('morning').hidden)renderMorningDetails(await api('/api/morning/details'));
  if(!el('candidates').hidden)renderCandidateDetails(await api('/api/candidates/details'));
  if(!el('delta').hidden)renderDeltaDetails(await api('/api/delta/details'));
  else if(!el('workplan').hidden)renderOwnerActions(await api('/api/workplan/actions'));
 }catch{lock('Session ไม่ได้รับอนุญาต — LOCKED');}
});
el('logout').addEventListener('click',async()=>{
 try{await api('/session/logout','POST',{});lock('LOCKED — ออกจากระบบแล้ว; เริ่ม Server ใหม่หากต้องการเข้าอีกครั้ง');}
 catch{lock('ไม่ยืนยันการ Logout จาก Server — โปรดปิด Server ด้วย Ctrl+C');}
});
api('/api/summary').then(async s=>{renderSummary(s);await showOwnerSummaryIfAvailable();await showMorningSummaryIfAvailable();await showCandidatesSummaryIfAvailable();await showDeltaSummaryIfAvailable();}).catch(()=>lock());
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
export async function startOwnerLocalServer({projection,workplan=null,snapshotDelta=null,now=()=>Date.now(),pairCode=randomBytes(8).toString('hex').toUpperCase(),
 pairTtlMs=120000,idleMs=300000,absoluteMs=900000,maxAttempts=5}={}){
 if(!projection||projection.kind!=='PRIVATE_LOCAL_PROJECTION'||projection.boundary!=='OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES'||
    !Array.isArray(projection.projects)||projection.projects.length!==projection.selected||
    !/^[0-9A-F]{16}$/.test(pairCode))throw Error('Invalid private projection or pairing configuration');
 if(workplan!==null)validateWorkplan(workplan,projection);
 if(snapshotDelta!==null){
  if(!workplan||snapshotDelta.diff?.mode!=='PC04I_SAVED_SNAPSHOT_DELTA'||
     snapshotDelta.diff.selected!==projection.selected||
     snapshotDelta.diff.currentObservedAt!==projection.observedAt||
     snapshotDelta.diff.projects?.length!==projection.projects.length||
     snapshotDelta.diff.projects.some((x,i)=>x.repository!==projection.projects[i].id))
   throw Error('Invalid private Snapshot delta scope');
 }
 let data=projection,ownerPlan=workplan,deltaData=snapshotDelta,session=null,used=false,attempts=0,sessionTimer=null,pairTimer=null;
 const issueTime=now(),codeHash=hash(pairCode);
 const discard=()=>{data=null;ownerPlan=null;deltaData=null;session=null;used=true;if(sessionTimer)clearTimeout(sessionTimer);if(pairTimer)clearTimeout(pairTimer);};
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
  if(method==='GET'&&path.startsWith('/api/delta/review/')){
   if(!active(req))return deny(res,401);
   if(!deltaData||!ownerPlan)return deny(res,404);
   if(!session.details)return deny(res,403);
   const pieces=path.split('/');
   if(pieces.length!==8||!(/^(?:0|[1-9][0-9]?)$/.test(pieces[4]))||
      !['PR','ISSUE'].includes(pieces[5])||
      !['NEW_OPEN','NO_LONGER_OPEN'].includes(pieces[6])||
      !(/^(?:0|[1-9][0-9]?)$/.test(pieces[7])))return deny(res,404);
   try{return respond(res,200,JSON.stringify(buildPrivateDeltaReviewPage(
    deltaData.diff,data,ownerPlan,{
     projectIndex:Number(pieces[4]),kind:pieces[5],change:pieces[6],page:Number(pieces[7])
    })));
   }catch{return deny(res,404);}
  }
  if(method==='GET'&&path==='/api/delta/summary'){
   if(!active(req))return deny(res,401);
   if(!deltaData)return deny(res,404);
   return respond(res,200,JSON.stringify(deltaData.summary));
  }
  if(method==='GET'&&path==='/api/delta/details'){
   if(!active(req))return deny(res,401);
   if(!deltaData)return deny(res,404);
   if(!session.details)return deny(res,403);
   const LIMIT=12;
   return respond(res,200,JSON.stringify({mode:'PC04I_SAVED_SNAPSHOT_DELTA_DETAILS',
    previousObservedAt:deltaData.diff.previousObservedAt,
    currentObservedAt:deltaData.diff.currentObservedAt,
    mergeInferred:false,hostVerified:false,noWrites:true,
    projects:deltaData.diff.projects.map(p=>({
     repository:p.repository,headChanged:p.git.defaultHeadChanged,
     prAddedCount:p.openPRs.nowObservedOpen.length,prMissingCount:p.openPRs.noLongerObservedOpen.length,
     prAdded:p.openPRs.nowObservedOpen.slice(0,LIMIT),
     prAddedOmitted:Math.max(0,p.openPRs.nowObservedOpen.length-LIMIT),
     prMissing:p.openPRs.noLongerObservedOpen.slice(0,LIMIT),
     prMissingOmitted:Math.max(0,p.openPRs.noLongerObservedOpen.length-LIMIT),
     issueAdded:p.openIssues.nowObservedOpen.slice(0,LIMIT),
     issueAddedOmitted:Math.max(0,p.openIssues.nowObservedOpen.length-LIMIT),
     issueMissing:p.openIssues.noLongerObservedOpen.slice(0,LIMIT),
     issueMissingOmitted:Math.max(0,p.openIssues.noLongerObservedOpen.length-LIMIT)
    }))
   }));
  }
  if(method==='GET'&&path==='/api/candidates/summary'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   const record=buildPrivateReviewCandidates(data,ownerPlan);
   return respond(res,200,JSON.stringify(summarizePrivateReviewCandidates(record)));
  }
  if(method==='GET'&&path.startsWith('/api/candidates/page/')){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   if(!session.details)return deny(res,403);
   const parts=path.split('/');
   if(parts.length!==7||!(/^(?:0|[1-9][0-9]?)$/.test(parts[4]))||
      !['PR','ISSUE'].includes(parts[5])||!(/^(?:0|[1-9][0-9]?)$/.test(parts[6])))
      return deny(res,404);
   const index=Number(parts[4]),kind=parts[5],page=Number(parts[6]);
   try{return respond(res,200,JSON.stringify(buildPrivateCandidatePage(data,ownerPlan,{projectIndex:index,kind,page})));}
   catch{return deny(res,404);}
  }
  if(method==='GET'&&path==='/api/candidates/details'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   if(!session.details)return deny(res,403);
   const record=buildPrivateReviewCandidates(data,ownerPlan);
   return respond(res,200,JSON.stringify({mode:'PRIVATE_REVIEW_CANDIDATES_DETAILS',
    observedAt:record.observedAt,freshness:record.freshness,source:record.source,
    ownerTasksAdded:0,requiresOwnerReview:true,
    projects:record.projects.map(p=>({
     repository:p.repository,enumeration:p.enumeration,
     omittedPRs:p.omittedReferences,omittedIssues:p.omittedIssueReferences,
     candidates:record.suggestedItems.filter(t=>t.repository===p.repository).map(t=>({
      kind:t.kind,number:t.number,draft:t.draft,ownerConfirmed:false,priority:'NOT_ASSESSED'
     }))
    }))}));
  }
  if(method==='GET'&&path==='/api/morning/summary'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   const brief=buildPrivateMorningBrief(data,ownerPlan,{now:new Date(now()).toISOString()});
   return respond(res,200,JSON.stringify({mode:'OWNER_PRIVATE_MORNING_SUMMARY',
    dayBangkok:brief.dayBangkok,observedAt:brief.github.observedAt,freshness:brief.github.freshness,
    openActions:brief.ownerPlan.openActions,overdueActions:brief.ownerPlan.overdueActions,
    waitingDecision:brief.ownerPlan.waitingDecision,reviewPrompts:brief.reviewPrompts.length,
    source:'SAVED_ENCRYPTED_SNAPSHOT_NOT_LIVE',liveGitHubChecked:false,
    deploymentInferred:false}));
  }
  if(method==='GET'&&path==='/api/morning/details'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   if(!session.details)return deny(res,403);
   const brief=buildPrivateMorningBrief(data,ownerPlan,{now:new Date(now()).toISOString()});
   return respond(res,200,JSON.stringify({mode:'OWNER_PRIVATE_MORNING_DETAILS',
    dayBangkok:brief.dayBangkok,
    actions:brief.actualOpenActions.slice(0,30).map(a=>({repository:a.repository,
     title:a.title,status:a.status,priority:a.priority,owner:a.owner,
     dueDate:a.dueDate,overdue:a.overdue,nextStep:a.nextStep})),
    reviewPrompts:brief.reviewPrompts.slice(0,25).map(r=>({repository:r.repository,missing:r.missing})),
    moreActions:brief.actualOpenActions.length>30,moreReviews:brief.reviewPrompts.length>25,
    source:'OWNER_LOCAL_REVIEW_PROMPTS_NOT_VERIFIED',noWrites:true}));
  }
  if(method==='GET'&&path==='/api/workplan/summary'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   const plan=summarizeWorkplan(ownerPlan,data,{now:new Date(now()).toISOString()});
   return respond(res,200,JSON.stringify({mode:'OWNER_PRIVATE_WORKPLAN_SUMMARY',
    selected:plan.repositories,openActions:plan.openActions,overdueActions:plan.overdueActions,
    waitingDecision:plan.waitingDecision,ownerReviewed:plan.ownerReviewed,lastOwnerUpdate:plan.lastOwnerUpdate,
    snapshotFreshness:plan.githubSnapshotFreshness,source:'OWNER_MANAGED_NOT_GITHUB_LIVE'}));
  }
  if(method==='GET'&&path==='/api/workplan/actions'){
   if(!active(req))return deny(res,401);
   if(!ownerPlan)return deny(res,404);
   if(!session.details)return deny(res,403);
   const source=ownerPlan.projects.flatMap(project=>project.actions.map(a=>({
    repository:project.repository,title:a.title,priority:a.priority,status:a.status,
    owner:a.owner,dueDate:a.dueDate,nextStep:a.nextStep,reason:a.reason,updatedAt:a.updatedAt
   })));
   // Never expose localWorktree, hostUrl, evidence refs, private notes, or raw encrypted workplan.
   source.sort((a,b)=>Number(a.status==='DONE_BY_OWNER')-Number(b.status==='DONE_BY_OWNER')
      || (a.priority||'P9').localeCompare(b.priority||'P9') || (a.dueDate||'9999').localeCompare(b.dueDate||'9999'));
   return respond(res,200,JSON.stringify({mode:'OWNER_PRIVATE_WORKPLAN_ACTIONS',
    source:'OWNER_AUTHORED_LOCAL',totalActions:source.length,truncated:source.length>100,actions:source.slice(0,100)}));
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
 if(process.argv.length!==3||!['--ack-real-private-local','--ack-private-workplan-local'].includes(process.argv[2]))
  throw Error('Usage: node tools/private-ui/private-local.mjs --ack-real-private-local | --ack-private-workplan-local');
 if(!process.env.BWD_COMPASS_PRIVATE_DIR)throw Error('Set BWD_COMPASS_PRIVATE_DIR to a protected absolute folder outside Git');
 const passphrase=await terminalSecret('Private Snapshot passphrase (not echoed): ');
 let projection;try{projection=loadPrivateProjection(passphrase);}catch{throw Error('Cannot unlock/validate selected private Snapshot');}
 const optIn=process.argv[2]==='--ack-private-workplan-local';
 let workplan=null;
 if(optIn)try{workplan=readPrivateWorkplanFile(projection,passphrase,privateDir());}
 catch{throw Error('Cannot unlock/validate private owner workplan; no server started');}
 const {server,url,pairingCode}=await startOwnerLocalServer({projection,workplan});
 projection=null;workplan=null;
 console.log('PRIVATE LOCAL (no remote hosting) — '+url);
 console.log('One-time browser pairing code (expires in 2 minutes): '+pairingCode);
 console.log('Validated encrypted snapshot'+(process.argv[2]==='--ack-private-workplan-local'?' + owner workplan':'')+'; not live GitHub. Press Ctrl+C to close.');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
})().catch(()=>{console.error('Private local pilot stopped. Check selected files, passphrase and terminal settings.');process.exitCode=1;});
