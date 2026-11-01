// PC-04D — PURE private evidence-to-morning-brief model, without I/O or side effects.
// Distinguish observed Git metadata, owner entries, reviewer prompts and unknown host truth.
// No network, GitHub, host probes, filesystem or public Pages import.
import {validateWorkplan} from './workplan-model.mjs';
const VALID_STATUSES=new Set(['TODO','IN_PROGRESS','BLOCKED','DONE_BY_OWNER']);
const RANK={P0:0,P1:1,P2:2,P3:3};
const statusRank={BLOCKED:0,TODO:1,IN_PROGRESS:2};
function assert(ok,msg){if(!ok)throw Error('Invalid private morning brief: '+msg);}
function bangkokDay(time){
 const d=new Date(time);
 assert(Number.isFinite(d.getTime()),'invalid date');
 const parts=new Intl.DateTimeFormat('en-US',{
  timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'
 }).formatToParts(d);
 const get=k=>parts.find(p=>p.type===k)?.value;
 return [get('year'),get('month'),get('day')].join('-');
}
function validCalendarDay(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const d=new Date(value+'T00:00:00.000Z');
 return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
export function buildPrivateMorningBrief(projection,workplan,{now=new Date().toISOString()}={}){
 validateWorkplan(workplan,projection);
 assert(typeof now==='string'&&Number.isFinite(Date.parse(now)),'invalid reporting clock');
 const day=bangkokDay(now);
 const freshness=projection.freshness?.state??'UNKNOWN';
 const tasks=[],review=[],blocked=[],invalidDue=[];
 let verifiedGitHeads=0,unknownGitHeads=0,hostReview=0,ownerReviewed=0,waitingDecision=0,acceptedDevelopment=0;
 let actualEntries=0,openActions=0,finishedActionsByOwner=0;
 for(const [index,p] of workplan.projects.entries()){
  const git=projection.projects[index];
  assert(git?.id===p.repository,'private scope mismatch');
  if(git.axes?.git?.state==='OBSERVED_DEFAULT_HEAD')verifiedGitHeads++;else unknownGitHeads++;
  if(p.deployment.state==='HOST_REVIEWED_BY_OWNER')hostReview++;
  if(p.development.state==='ACCEPTED_BY_OWNER')acceptedDevelopment++;
  if(p.lastReviewedAt!==null)ownerReviewed++;
  if(p.decision.state==='NEEDS_REVIEW')waitingDecision++;
  const missing=[];
  if(p.lastReviewedAt===null)missing.push('OWNER_REVIEW_NOT_RECORDED');
  if(p.development.state!=='ACCEPTED_BY_OWNER')missing.push('DEVELOPMENT_NOT_OWNER_ACCEPTED');
  if(p.deployment.state!=='HOST_REVIEWED_BY_OWNER')missing.push('HOST_NOT_OWNER_REVIEWED');
  if(p.decision.state==='NEEDS_REVIEW')missing.push('OWNER_DECISION_PENDING');
  if(p.actions.length===0)missing.push('NO_ACTION_RECORDED');
  if(missing.length)review.push({repository:p.repository,kind:'REVIEW_PROMPT_NOT_VERIFIED',missing,
   suggestedNextStep:'ตรวจหลักฐานของโครงการและบันทึกขั้นตอนถัดไปโดยเจ้าของ ไม่ถือว่าเสร็จแล้ว'});
  if(p.blockers.length)blocked.push({repository:p.repository,kind:'OWNER_RECORDED_BLOCKER',items:[...p.blockers]});
  for(const a of p.actions){
   assert(VALID_STATUSES.has(a.status),'unexpected task status');
   actualEntries++;
   if(a.status==='DONE_BY_OWNER'){finishedActionsByOwner++;continue;}
   openActions++;
   const invalidDate=a.dueDate!==null&&!validCalendarDay(a.dueDate);
   if(invalidDate)invalidDue.push({repository:p.repository,actionId:a.id,kind:'INVALID_DATE_REQUIRES_OWNER_REVIEW'});
   tasks.push({repository:p.repository,id:a.id,title:a.title,priority:a.priority,status:a.status,
    owner:a.owner,dueDate:a.dueDate,overdue:!invalidDate&&a.dueDate!==null&&a.dueDate<day,
    dateConfidence:invalidDate?'INVALID_DATE_REQUIRES_OWNER_REVIEW':a.dueDate===null?'DUE_DATE_NOT_SET':'OWNER_RECORDED_DATE',
    nextStep:a.nextStep,reason:a.reason,updatedAt:a.updatedAt,
    source:'OWNER_RECORDED_PRIVATE_PLAN',completionInferred:false});
  }
 }
 tasks.sort((a,b)=>(RANK[a.priority]??9)-(RANK[b.priority]??9)||
  Number(b.overdue)-Number(a.overdue)||
  (statusRank[a.status]??9)-(statusRank[b.status]??9)||
  (a.dueDate??'9999-12-31').localeCompare(b.dueDate??'9999-12-31')||
  a.repository.localeCompare(b.repository)||a.id.localeCompare(b.id));
 return {
  format:'PC04D_PRIVATE_MORNING_BRIEF_V1',scope:'OWNER_LOCAL_READ_ONLY',
  generatedAt:now,dayBangkok:day,
  github:{source:'ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE',observedAt:projection.observedAt,
   freshness,verifiedDefaultHeads:verifiedGitHeads,unknownDefaultHeads:unknownGitHeads,
   defaultBranchProvesDeployment:false,liveGitHubChecked:false},
  ownerPlan:{source:'OWNER_RECORDED_ENCRYPTED_LOCAL',lastEditedAt:workplan.updatedAt,
   projectCount:workplan.projects.length,ownerReviewed,waitingDecision,
   hostReviewedByOwner:hostReview,developmentAcceptedByOwner:acceptedDevelopment,
   totalRecordedTasks:actualEntries,openActions,ownerRecordedDone:finishedActionsByOwner,
   overdueActions:tasks.filter(t=>t.overdue).length,
   recordedBlockerProjects:blocked.length,invalidDateCount:invalidDue.length},
  actualOpenActions:tasks,ownerRecordedBlockers:blocked,reviewPrompts:review,invalidDueDates:invalidDue,
  warnings:[
   'GITHUB_SNAPSHOT_NOT_LIVE',
   ...(freshness==='RECENT'?[]:['SNAPSHOT_AGING_OR_UNKNOWN']),
   'ZERO_RECORDED_ACTIONS_IS_NOT_ZERO_REAL_BACKLOG',
   'HOST_ACCEPTANCE_NOT_INFERRED_FROM_DEFAULT_HEAD',
   'OWNER_REVIEW_IS_NOT_INDEPENDENT_HOST_ACCEPTANCE'
  ],noGitWrite:true,noPublicExport:true,noStateMutation:true
 };
}
export function summarizePrivateBrief(brief){
 assert(brief?.format==='PC04D_PRIVATE_MORNING_BRIEF_V1','wrong brief');
 const s=brief.ownerPlan;
 return Object.freeze({
  mode:'PRIVATE_MORNING_SUMMARY',dayBangkok:brief.dayBangkok,
  githubSnapshotObservedAt:brief.github.observedAt,githubSnapshotFreshness:brief.github.freshness,
  liveGitHubChecked:false,selected:s.projectCount,
  ownerReviewed:s.ownerReviewed,waitingDecision:s.waitingDecision,
  totalRecordedTasks:s.totalRecordedTasks,openActions:s.openActions,
  overdueActions:s.overdueActions,ownerRecordedDone:s.ownerRecordedDone,
  hostReviewedByOwner:s.hostReviewedByOwner,reviewPrompts:brief.reviewPrompts.length,
  invalidDueDateCount:s.invalidDateCount,
  noStateMutation:true,hasRealProjectIdentifiers:false
 });
}
