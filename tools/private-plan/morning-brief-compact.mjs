// PC-04D1: pure formatter. PRIVATE output only after terminal DISPLAY consent.
// No filesystem, network, browser or GitHub. Never import this from public Pages.
const reviewLabels={
 OWNER_REVIEW_NOT_RECORDED:'ยังไม่มีบันทึกการตรวจโดยเจ้าของ',
 DEVELOPMENT_NOT_OWNER_ACCEPTED:'ยังไม่รับรองผลการพัฒนา',
 HOST_NOT_OWNER_REVIEWED:'ยังไม่มีผลตรวจ Host ที่เจ้าของบันทึก',
 OWNER_DECISION_PENDING:'รอการตัดสินใจของเจ้าของ',
 NO_ACTION_RECORDED:'ยังไม่มีงานถัดไปในทะเบียน'
};
function safeLine(value,max=250){
 return String(value??'').replace(/[\u0000-\u001f\u007f-\u009f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
}
export function formatPrivateCompactBrief(brief,{maxActions=8}={}){
 if(!brief||brief.format!=='PC04D_PRIVATE_MORNING_BRIEF_V1'||brief.scope!=='OWNER_LOCAL_READ_ONLY')
  throw Error('PC04D1_INVALID_BRIEF');
 if(!Number.isInteger(maxActions)||maxActions<1||maxActions>30)throw Error('PC04D1_INVALID_LIMIT');
 const out=[
  'สรุปโครงการส่วนตัว • '+safeLine(brief.dayBangkok,10)+' (เวลาไทย)',
  'แหล่งข้อมูล: Snapshot ที่บันทึกไว้ ไม่ใช่ GitHub Live',
  'บันทึกหลักฐาน Git: '+safeLine(brief.github.observedAt,40)+' • '+safeLine(brief.github.freshness,30),
  'ยังไม่ได้ยืนยัน Host/Production จาก Git HEAD',
  '',
  'งานที่เจ้าของบันทึกไว้: เปิดอยู่ '+brief.ownerPlan.openActions+
    ' | เกินกำหนด '+brief.ownerPlan.overdueActions+
    ' | บันทึกว่าทำเสร็จ '+brief.ownerPlan.ownerRecordedDone,
  'โครงการรอตัดสินใจ '+brief.ownerPlan.waitingDecision+
    ' | เจ้าของบันทึกตรวจแล้ว '+brief.ownerPlan.ownerReviewed+
    ' | มีบันทึกตรวจ Host '+brief.ownerPlan.hostReviewedByOwner,
  ''
 ];
 const tasks=brief.actualOpenActions||[];
 out.push('งานถัดไปที่บันทึกจริง');
 if(!tasks.length)out.push('• ยังไม่มี TODO ที่บันทึก — ไม่ได้หมายความว่าโครงการจริงไม่มีงานค้าง');
 else{
  for(const task of tasks.slice(0,maxActions)){
   out.push('• ['+safeLine(task.priority,2)+
    (task.overdue?' / เกินกำหนด':'')+'] '+
    safeLine(task.repository,150)+' — '+safeLine(task.title,180));
   if(task.nextStep)out.push('  ทำต่อ: '+safeLine(task.nextStep,200));
   if(task.dueDate)out.push('  กำหนด: '+safeLine(task.dueDate,10)+
    (task.dateConfidence==='INVALID_DATE_REQUIRES_OWNER_REVIEW'?' (วันไม่ถูกต้อง โปรดตรวจ)':''));
  }
  if(tasks.length>maxActions)out.push('• ยังมี TODO อีก '+(tasks.length-maxActions)+' รายการ ดู --details สำหรับรายการครบ');
 }
 out.push('','เรื่องที่ควรตรวจทาน (เป็นข้อเสนอ ยังไม่ใช่ TODO)');
 const reviews=brief.reviewPrompts||[];
 if(!reviews.length)out.push('• ไม่มีรายการตรวจทานที่โมเดลสร้างไว้ (ไม่ได้ยืนยันว่าโครงการเสร็จ)');
 else for(const [index,r] of reviews.entries()){
  const missing=(r.missing||[]);
  const priority=missing.includes('OWNER_DECISION_PENDING')?'รอตัดสินใจ':
    missing.includes('NO_ACTION_RECORDED')?'ควรกำหนดงานถัดไป':'ตรวจหลักฐาน';
  out.push(String(index+1)+'. '+safeLine(r.repository,150)+' — '+priority);
 }
 out.push('','เหตุผลสถานะและหลักฐานรายข้อ: ใช้ --details (ต้องยืนยัน DISPLAY)');
 out.push('ไม่มีการเขียนไฟล์ / ไม่เรียก GitHub Live / ไม่เผยแพร่ GitHub Pages');
 return out.join('\n')+'\n';
}


// ASCII-only fallback for Windows terminals that cannot display Thai glyphs correctly.
// The input is already validated by the pure morning-brief model. This never guesses status.
function ascii(value,max=250){
 return String(value??'').replace(/[^\x20-\x7e]/g,'?').replace(/\s+/g,' ').trim().slice(0,max);
}
export function formatPrivateAsciiBrief(brief,{maxActions=8}={}){
 if(!brief||brief.format!=='PC04D_PRIVATE_MORNING_BRIEF_V1'||brief.scope!=='OWNER_LOCAL_READ_ONLY')
  throw Error('PC04D1_INVALID_BRIEF');
 if(!Number.isInteger(maxActions)||maxActions<1||maxActions>30)throw Error('PC04D1_INVALID_LIMIT');
 const s=brief.ownerPlan,tasks=brief.actualOpenActions||[],review=brief.reviewPrompts||[];
 const lines=[
  'PRIVATE PROJECT MORNING BRIEF | '+ascii(brief.dayBangkok,10)+' | Asia/Bangkok',
  'SOURCE: saved encrypted Git snapshot; NOT LIVE GitHub',
  'Git observed: '+ascii(brief.github.observedAt,40)+' | '+ascii(brief.github.freshness,30),
  'Git default HEAD is NOT proof of host deployment or production acceptance',
  '',
  'OWNER-RECORDED TASKS: open '+s.openActions+' | overdue '+s.overdueActions+' | owner-done '+s.ownerRecordedDone,
  'Owner decisions pending '+s.waitingDecision+' | recorded owner reviews '+s.ownerReviewed+' | recorded host reviews '+s.hostReviewedByOwner,
  '',
  'ACTUAL OWNER-RECORDED NEXT ACTIONS'
 ];
 if(!tasks.length)lines.push('* No TODO has been recorded; this DOES NOT mean the real projects are finished.');
 else{
  for(const task of tasks.slice(0,maxActions)){
   lines.push('* ['+ascii(task.priority,2)+(task.overdue?' / OVERDUE':'')+'] '+ascii(task.repository,150)+' - '+ascii(task.title,180));
   if(task.nextStep)lines.push('  Next: '+ascii(task.nextStep,220));
   if(task.dueDate)lines.push('  Due: '+ascii(task.dueDate,10)+(task.dateConfidence==='INVALID_DATE_REQUIRES_OWNER_REVIEW'?' [INVALID DATE]':''));
  }
  if(tasks.length>maxActions)lines.push('* '+(tasks.length-maxActions)+' more owner-recorded tasks; use --details.');
 }
 lines.push('','REVIEW PROMPTS (NOT verified tasks; no automatic action created)');
 if(!review.length)lines.push('* No generated review prompts; completion remains unverified.');
 else for(const [i,r] of review.entries()){
  const missing=r.missing||[];
  const flag=missing.includes('OWNER_DECISION_PENDING')?'OWNER_DECISION_PENDING':
   missing.includes('NO_ACTION_RECORDED')?'NO_ACTION_RECORDED':'EVIDENCE_REVIEW_NEEDED';
  lines.push((i+1)+'. '+ascii(r.repository,150)+' - '+flag);
 }
 lines.push('','For full audit flags use --details (requires DISPLAY).');
 lines.push('NO writes | NO live GitHub query | NO private Pages upload');
 return lines.join('\n')+'\n';
}
