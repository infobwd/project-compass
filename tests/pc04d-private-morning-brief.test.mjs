// PC-04D: fictional-only, deterministic Bangkok-local date and owner evidence tests.
// No real Registry, workplan, GitHub, local URLs, private worktree paths or credentials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';
import {buildPrivateMorningBrief,summarizePrivateBrief} from '../tools/private-plan/morning-brief.mjs';

const OWNER='fictional-owner',NAME=OWNER+'/sample-one';
const CREATED='2026-11-01T00:00:00.000Z',EDITED='2026-11-01T00:01:00.000Z';
function projection(){
 return projectOfflineEvidence({
  format:'BWD-COMPASS-REGISTRY-V1',observedAt:CREATED,owner:OWNER,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:3,atLeast:3},openIssues:{state:'VERIFIED',count:2,atLeast:2}}]
 },[NAME],Date.parse(CREATED)+3600000);
}
function create(){const p=projection();return {p,w:createEmptyWorkplan(p,{at:CREATED})};}
const action=(id,overrides={})=>({id,title:'Review fictional source '+id,status:'TODO',priority:'P1',owner:'HUMAN',
 dueDate:null,evidenceIds:[],nextStep:'Owner must review source',reason:null,updatedAt:EDITED,...overrides});
test('PC04D no recorded tasks is NOT a claim that project has no actual backlog',()=>{
 const {p,w}=create(),brief=buildPrivateMorningBrief(p,w,{now:'2026-11-01T08:00:00Z'});
 assert.equal(brief.github.liveGitHubChecked,false);
 assert.equal(brief.github.defaultBranchProvesDeployment,false);
 assert.equal(brief.ownerPlan.projectCount,1);
 assert.equal(brief.ownerPlan.totalRecordedTasks,0);
 assert.equal(brief.ownerPlan.openActions,0);
 assert.equal(brief.ownerPlan.waitingDecision,1);
 assert.equal(brief.actualOpenActions.length,0);
 assert.equal(brief.reviewPrompts.length,1);
 assert.equal(brief.reviewPrompts[0].kind,'REVIEW_PROMPT_NOT_VERIFIED');
 assert.ok(brief.reviewPrompts[0].missing.includes('NO_ACTION_RECORDED'));
 assert.ok(brief.warnings.includes('ZERO_RECORDED_ACTIONS_IS_NOT_ZERO_REAL_BACKLOG'));
});
test('PC04D Bangkok date boundary determines overdue; UTC date must not be used',()=>{
 const {p,w}=create(),next=prepareOwnerUpdate(w,p,NAME,{
  actions:[action('due-today',{dueDate:'2026-11-02'}),action('past',{dueDate:'2026-11-01'})]
 },{at:EDITED});
 // 2026-11-01T18:00Z => 2026-11-02 01:00 Asia/Bangkok
 const b=buildPrivateMorningBrief(p,next,{now:'2026-11-01T18:00:00Z'});
 assert.equal(b.dayBangkok,'2026-11-02');
 assert.equal(b.ownerPlan.overdueActions,1);
 assert.equal(b.actualOpenActions.find(x=>x.id==='past').overdue,true);
 assert.equal(b.actualOpenActions.find(x=>x.id==='due-today').overdue,false);
});
test('PC04D prioritizes owner-entered P0 and blocked action, never invented next actions',()=>{
 const {p,w}=create(),next=prepareOwnerUpdate(w,p,NAME,{actions:[
  action('normal',{priority:'P2'}),action('critical',{priority:'P0',status:'BLOCKED'}),
  action('high',{priority:'P1'})
 ]},{at:EDITED});
 const b=buildPrivateMorningBrief(p,next,{now:'2026-11-01T08:00:00Z'});
 assert.deepEqual(b.actualOpenActions.map(x=>x.id),['critical','high','normal']);
 assert.equal(b.ownerPlan.openActions,3);
 assert.ok(b.actualOpenActions.every(x=>x.source==='OWNER_RECORDED_PRIVATE_PLAN'));
 assert.ok(b.actualOpenActions.every(x=>x.completionInferred===false));
});
test('PC04D completed status cannot be created without owner review evidence',()=>{
 const {p,w}=create();
 assert.throws(()=>prepareOwnerUpdate(w,p,NAME,{actions:[
  action('fake-done',{status:'DONE_BY_OWNER'})
 ]},{at:EDITED}),/completed task needs owner evidence/);
});
test('PC04D owner-reviewed DONE is counted but never reported as an open TODO',()=>{
 const {p,w}=create(),ev={id:'owner-review-1',kind:'OWNER_REVIEW',
  ref:'local://fictional-review',observedAt:EDITED,recordedBy:'OWNER',note:null};
 const next=prepareOwnerUpdate(w,p,NAME,{evidence:[ev],actions:[
  action('finished',{status:'DONE_BY_OWNER',evidenceIds:[ev.id]}),
  action('open')
 ]},{at:EDITED});
 const b=buildPrivateMorningBrief(p,next,{now:'2026-11-01T08:00:00Z'});
 assert.equal(b.ownerPlan.totalRecordedTasks,2);
 assert.equal(b.ownerPlan.openActions,1);
 assert.equal(b.ownerPlan.ownerRecordedDone,1);
 assert.deepEqual(b.actualOpenActions.map(x=>x.id),['open']);
});
test('PC04D invalid due dates trigger owner review instead of false overdue',()=>{
 const {p,w}=create(),next=prepareOwnerUpdate(w,p,NAME,{
  actions:[action('bad-date',{dueDate:'2026-02-31'})]
 },{at:EDITED});
 const b=buildPrivateMorningBrief(p,next,{now:'2026-11-01T08:00:00Z'});
 assert.equal(b.ownerPlan.invalidDateCount,1);
 assert.equal(b.ownerPlan.overdueActions,0);
 assert.equal(b.actualOpenActions[0].overdue,false);
 assert.equal(b.actualOpenActions[0].dateConfidence,'INVALID_DATE_REQUIRES_OWNER_REVIEW');
});
test('PC04D exact selection mismatch and nonexistent clock fail closed',()=>{
 const {p,w}=create(),other=structuredClone(p);
 other.projects[0].id='different-owner/project';
 assert.throws(()=>buildPrivateMorningBrief(other,w),/selection scope|registry order/);
 assert.throws(()=>buildPrivateMorningBrief(p,w,{now:'not-a-date'}),/invalid reporting clock/);
});
test('PC04D summary returns no repo names or titles even with owner task',()=>{
 const {p,w}=create(),next=prepareOwnerUpdate(w,p,NAME,{actions:[
  action('private-title',{title:'Fictional private owner action'})
 ]},{at:EDITED});
 const b=buildPrivateMorningBrief(p,next,{now:'2026-11-01T08:00:00Z'});
 const summary=summarizePrivateBrief(b);
 assert.equal(summary.openActions,1);
 assert.equal(summary.hasRealProjectIdentifiers,false);
 assert.doesNotMatch(JSON.stringify(summary),/fictional-owner|Fictional private owner action|sample-one/);
 assert.equal(summary.liveGitHubChecked,false);
 assert.equal(summary.noStateMutation,true);
 assert.equal(b.noPublicExport,true);
});
test('PC04D pure model and terminal CLI never import remote collectors or public frontend',()=>{
 const m=readFileSync(fileURLToPath(new URL('../tools/private-plan/morning-brief.mjs',import.meta.url)),'utf8');
 const c=readFileSync(fileURLToPath(new URL('../tools/private-plan/morning-brief-cli.mjs',import.meta.url)),'utf8');
 const publicUi=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(m,/node:fs|node:http|fetch\(|createServer|writeFileSync|node:child_process/);
 assert.doesNotMatch(c,/fetch\(|writeFileSync|createServer|execSync|writeFile/);
 assert.doesNotMatch(publicUi,/morning-brief|owner-workplan|private-plan/);
 assert.match(c,/Type DISPLAY/);
 assert.match(c,/--summary/);
 assert.match(c,/--details/);
});
