// Fictional Thai/UTF-8 diagnostics and private terminal ASCII fallback.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';
import {buildPrivateMorningBrief} from '../tools/private-plan/morning-brief.mjs';
import {formatPrivateAsciiBrief} from '../tools/private-plan/morning-brief-compact.mjs';
import {runLocalMorningBrief} from '../tools/private-plan/morning-brief-cli.mjs';

const OWNER='fictional-owner',NAME=OWNER+'/sample-01',AT='2026-11-01T00:00:00.000Z';
function fixture(){
 const q=projectOfflineEvidence({format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,coverage:'ALL_SELECTED',
 selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,observedAt:AT,
 projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
 openPRs:{state:'VERIFIED',count:1,atLeast:1},openIssues:{state:'VERIFIED',count:1,atLeast:1}}]
 },[NAME],Date.parse(AT)+3600000);
 return {projection:q,plan:createEmptyWorkplan(q,{at:AT})};
}
test('PC04D1 Thai-check outputs only fixed fictional text, without private folder/passphrase',async()=>{
 const printed=[],write=process.stdout.write;
 process.stdout.write=function(chunk){printed.push(String(chunk));return true;};
 try{
  const result=await runLocalMorningBrief(['--thai-check'],{});
  assert.equal(result.mode,'THAI_CHECK');
  assert.equal(result.writes,false);
  assert.equal(result.privateDataAccessed,false);
  assert.equal(result.network,false);
  assert.match(printed.join(''),/ทดสอบภาษาไทย: กำลังเรียนรู้ วันนี้ พรุ่งนี้ 123/);
  assert.doesNotMatch(printed.join(''),/fictional-owner|Private Snapshot\/Workplan passphrase/);
 }finally{process.stdout.write=write;}
});
test('PC04D1 ASCII fallback is fully 7-bit even when owner task contains Thai',()=>{
 const {projection,plan}=fixture();
 const p=prepareOwnerUpdate(plan,projection,NAME,{actions:[{
  id:'next-01',title:'ตรวจสอบภาษาไทย',status:'TODO',priority:'P0',owner:'HUMAN',
  dueDate:null,evidenceIds:[],nextStep:'ตรวจเอกสาร',reason:null,updatedAt:'2026-11-01T01:00:00.000Z'
 }]},{at:'2026-11-01T01:00:00.000Z'});
 const b=buildPrivateMorningBrief(projection,p,{now:'2026-11-01T08:00:00.000Z'});
 const out=formatPrivateAsciiBrief(b);
 assert.match(out,/OWNER-RECORDED TASKS: open 1/);
 assert.match(out,/ACTUAL OWNER-RECORDED NEXT ACTIONS/);
 assert.match(out,/REVIEW PROMPTS \(NOT verified tasks/);
 assert.match(out,/fictional-owner\/sample-01/);
 assert.match(out,/\[P0\]/);
 assert.equal([...out].every(c=>c.charCodeAt(0)<=127),true,'output must use ASCII only');
 assert.doesNotMatch(out,/ตรวจสอบภาษาไทย|ตรวจเอกสาร/);
});
test('PC04D1 ASCII empty state does not assert real-project completion',()=>{
 const {projection,plan}=fixture(),b=buildPrivateMorningBrief(projection,plan,{now:'2026-11-01T08:00:00.000Z'});
 const out=formatPrivateAsciiBrief(b);
 assert.match(out,/No TODO has been recorded; this DOES NOT mean the real projects are finished/);
 assert.match(out,/OWNER_DECISION_PENDING/);
 assert.match(out,/NOT LIVE GitHub/);
 assert.throws(()=>formatPrivateAsciiBrief(b,{maxActions:0}),/PC04D1_INVALID_LIMIT/);
});
test('PC04D1 preflight glyph diagnostic before private access, ASCII report after DISPLAY',()=>{
 const cli=readFileSync(fileURLToPath(new URL('../tools/private-plan/morning-brief-cli.mjs',import.meta.url)),'utf8');
 const publicUi=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.ok(cli.indexOf("args[0]==='--thai-check'")<cli.indexOf("const dir=privateDir(env)"));
 assert.ok(cli.indexOf("confirmation.trim()!=='DISPLAY'")<cli.indexOf("const format=args[0]==='--compact'"));
 assert.match(cli,/--compact-ascii/);
 assert.doesNotMatch(publicUi,/morning-brief-cli|morning-brief-compact|private-plan\//);
});
