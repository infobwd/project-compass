// PC-04D1 — fictional-only compact owner briefing tests. No private Snapshot.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';
import {buildPrivateMorningBrief} from '../tools/private-plan/morning-brief.mjs';
import {formatPrivateCompactBrief} from '../tools/private-plan/morning-brief-compact.mjs';
const OWNER='fictional-owner',NAMES=Array.from({length:11},(_,i)=>OWNER+'/sample-'+String(i+1).padStart(2,'0'));
const AT='2026-11-01T00:00:00.000Z', EDIT='2026-11-01T01:00:00.000Z';
function fixture(){
 const projection=projectOfflineEvidence({
  format:'BWD-COMPASS-REGISTRY-V1',observedAt:AT,owner:OWNER,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:11,matched:11},inspectedRepositories:11,
  projects:NAMES.map(fullName=>({fullName,defaultBranch:'main',
    defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
    openPRs:{state:'VERIFIED',count:1,atLeast:1},openIssues:{state:'VERIFIED',count:0,atLeast:0}}))
 },NAMES,Date.parse(AT)+3600000);
 return {projection,plan:createEmptyWorkplan(projection,{at:AT})};
}
function task(id,options={}){
 return {id,title:'Task '+id,status:'TODO',priority:'P1',
 owner:'HUMAN',dueDate:null,evidenceIds:[],nextStep:'Check evidence',
 reason:null,updatedAt:EDIT,...options};
}
test('PC04D1 zero-entry concise output has 11 reviews but never implies finished work',()=>{
 const {projection,plan}=fixture();
 const brief=buildPrivateMorningBrief(projection,plan,{now:'2026-11-01T08:00:00.000Z'});
 const text=formatPrivateCompactBrief(brief);
 assert.match(text,/งานที่เจ้าของบันทึกไว้: เปิดอยู่ 0/);
 assert.match(text,/ไม่ได้หมายความว่าโครงการจริงไม่มีงานค้าง/);
 assert.match(text,/เรื่องที่ควรตรวจทาน \(เป็นข้อเสนอ ยังไม่ใช่ TODO\)/);
 assert.match(text,/11\. fictional-owner\/sample-11 — รอตัดสินใจ/);
 assert.match(text,/ไม่ใช่ GitHub Live/);
 assert.doesNotMatch(text,/OWNER_REVIEW_NOT_RECORDED|DEVELOPMENT_NOT_OWNER_ACCEPTED|HOST_NOT_OWNER_REVIEWED|NO_ACTION_RECORDED/);
 assert.equal(text.split('\n').filter(s=>/^\d+\. fictional-owner\//.test(s)).length,11);
 assert.ok(text.length<2400,'avoid huge repetitive English technical output');
});
test('PC04D1 owner-recorded priority P0 and overdue are shown, never fabricated',()=>{
 const {projection,plan}=fixture();
 const updated=prepareOwnerUpdate(plan,projection,NAMES[0],{actions:[
  task('later',{priority:'P2',dueDate:'2026-11-10'}),
  task('urgent',{title:'Synthetic urgent action',priority:'P0',dueDate:'2026-10-30',
   nextStep:'Verify fictional unit test'})
 ]},{at:EDIT});
 const b=buildPrivateMorningBrief(projection,updated,{now:'2026-11-01T08:00:00.000Z'});
 const lines=formatPrivateCompactBrief(b);
 assert.match(lines,/เปิดอยู่ 2 \| เกินกำหนด 1/);
 const urgent=lines.indexOf('Synthetic urgent action'),later=lines.indexOf('Task later');
 assert.ok(urgent>0&&later>urgent);
 assert.match(lines,/\[P0 \/ เกินกำหนด\]/);
 assert.match(lines,/ทำต่อ: Verify fictional unit test/);
 assert.doesNotMatch(lines,/Host VERIFIED|Production PASS|งานเสร็จทั้งหมด/);
});
test('PC04D1 compact limits task list explicitly and does not omit task-count warning',()=>{
 const {projection,plan}=fixture();
 const updated=prepareOwnerUpdate(plan,projection,NAMES[0],{
  actions:[task('one'),task('two'),task('three')]
 },{at:EDIT});
 const b=buildPrivateMorningBrief(projection,updated,{now:'2026-11-01T08:00:00.000Z'});
 const out=formatPrivateCompactBrief(b,{maxActions:2});
 assert.match(out,/ยังมี TODO อีก 1 รายการ/);
 assert.doesNotMatch(out,/Task three/);
 assert.throws(()=>formatPrivateCompactBrief(b,{maxActions:0}),/INVALID_LIMIT/);
 assert.throws(()=>formatPrivateCompactBrief({format:'other'}),/INVALID_BRIEF/);
});
test('PC04D1 PRIVATE compact report is gated behind DISPLAY; --summary reveals nothing',()=>{
 const cli=readFileSync(fileURLToPath(new URL('../tools/private-plan/morning-brief-cli.mjs',import.meta.url)),'utf8');
 const fmt=readFileSync(fileURLToPath(new URL('../tools/private-plan/morning-brief-compact.mjs',import.meta.url)),'utf8');
 const publicSource=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.match(cli,/--compact/);
 assert.ok(cli.indexOf("confirmation.trim()!=='DISPLAY'")<cli.indexOf('formatPrivateCompactBrief(brief)'));
 assert.match(cli,/if\(args\[0\]==='--summary'\)return summary/);
 assert.doesNotMatch(fmt,/node:fs|node:http|fetch\(|createServer|writeFileSync|localStorage|sessionStorage/);
 assert.doesNotMatch(publicSource,/morning-brief|morning-brief-compact|owner-workplan/);
});
