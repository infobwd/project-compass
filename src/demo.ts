// Synthetic sample portfolio. DO NOT import real private project registry data here.
export type Confidence='VERIFIED'|'REPORTED'|'INFERRED'|'STALE'|'UNKNOWN';
export type Project={
 id:string;title:string;category:string;description:string;phase:string;progress:number;
 development:string;git:string;deployment:string;decision:string;confidence:Confidence;
 next:string;reason:string;owner:'human'|'ai';updated:string;blocker:string;
};
export const PROJECTS:Project[]=[
 {id:'demo-one',title:'Learning Library',category:'คลังบทเรียน',description:'ต้นแบบสมมติสำหรับจัดการความรู้และการค้นหา',phase:'Mobile reading QA',progress:64,development:'TESTING',git:'PR_OPEN',deployment:'NOT_DEPLOYED',decision:'WAITING_USER',confidence:'REPORTED',next:'ตรวจการแสดงผลบนแท็บเล็ตจริง',reason:'จำเป็นต้องมีหลักฐานอุปกรณ์ก่อนรับรอง',owner:'human',updated:'ตัวอย่าง · 08:30',blocker:'รอการตรวจอุปกรณ์จริง'},
 {id:'demo-two',title:'Progress Tracker',category:'ระบบประเมิน',description:'ต้นแบบสมมติสำหรับติดตามพัฒนาการ',phase:'Data contract',progress:42,development:'IMPLEMENTING',git:'PR_OPEN',deployment:'UNKNOWN',decision:'BLOCKED',confidence:'UNKNOWN',next:'ทบทวนสัญญาข้อมูลก่อนพัฒนา',reason:'ยังไม่มีการตรวจรับแหล่งข้อมูล',owner:'human',updated:'ตัวอย่าง · เมื่อวาน',blocker:'ขาดหลักฐานโครงสร้างข้อมูล'},
 {id:'demo-three',title:'Team Workflow',category:'บริหารงาน',description:'ต้นแบบสมมติสำหรับกระบวนการทำงานร่วมกัน',phase:'Design',progress:30,development:'DESIGNING',git:'PUSHED',deployment:'NOT_DEPLOYED',decision:'READY',confidence:'INFERRED',next:'ร่าง Acceptance Criteria',reason:'ช่วยเตรียมงานได้โดยไม่แก้ Production',owner:'ai',updated:'ตัวอย่าง · 2 วันก่อน',blocker:'ไม่มีในชุดข้อมูลสมมติ'},
 {id:'demo-four',title:'Info Portal',category:'สารสนเทศ',description:'ตัวอย่างระบบรายงานข้อมูลสาธารณะ',phase:'Release review',progress:80,development:'REVIEW',git:'MERGED',deployment:'STAGING',decision:'NEEDS_APPROVAL',confidence:'STALE',next:'ตรวจหลักฐานก่อนอนุมัติเผยแพร่',reason:'การ Merge ไม่ถือว่า Host Verified',owner:'human',updated:'ตัวอย่าง · 1 สัปดาห์ก่อน',blocker:'หลักฐานเก่าต้องตรวจใหม่'}
];
export const LABEL:Record<string,string>={
 PLANNED:'วางแผน',DESIGNING:'ออกแบบ',IMPLEMENTING:'กำลังพัฒนา',TESTING:'ทดสอบ',REVIEW:'รอตรวจรับ',ACCEPTED:'ตรวจรับแล้ว',
 LOCAL_ONLY:'เฉพาะในเครื่อง',PUSHED:'Push แล้ว',PR_OPEN:'PR เปิดอยู่',MERGED:'Merge แล้ว',
 NOT_DEPLOYED:'ยังไม่ Deploy',STAGING:'Staging',DEPLOYED:'Deploy แล้ว',HOST_VERIFIED:'ตรวจ Host แล้ว',
 READY:'พร้อมทำ',BLOCKED:'ติดเงื่อนไข',WAITING_USER:'รอผู้ใช้',NEEDS_APPROVAL:'รออนุมัติ',
 VERIFIED:'ยืนยันแล้ว',REPORTED:'มีรายงาน',INFERRED:'ข้อสันนิษฐาน',STALE:'ข้อมูลอาจเก่า',UNKNOWN:'ไม่ทราบ'
};
