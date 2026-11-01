// PC-04E — pure candidate list derived only from SAVED, selected, encrypted GitHub metadata.
// Candidate != owner task. PR/Issue open state observed at snapshot time is NOT live truth.
// No filesystem, HTTP, external links, Git writes, task creation or status promotion.
import {validateWorkplan} from './workplan-model.mjs';
const MAX_LIST=500;
const ISSUE=/^[1-9]\d{0,8}$/;
function ok(value,message){if(!value)throw Error('PC04E candidate evidence refused: '+message);}
function knownCollection(state,count,items,{kind}){
 if(state!=='VERIFIED')return {complete:false,items:[],reason:kind+'_COLLECTION_NOT_VERIFIED'};
 if(!Number.isSafeInteger(count)||count<0||count>MAX_LIST)
  return {complete:false,items:[],reason:kind+'_COUNT_INVALID'};
 if(!Array.isArray(items)||items.length!==count||items.length>MAX_LIST)
  return {complete:false,items:[],reason:kind+'_ENUMERATION_INCOMPLETE'};
 const seen=new Set(),normalized=[];
 for(const item of items){
  const number=kind==='PR'?item?.number:item;
  if(!Number.isSafeInteger(number)||number<1||!ISSUE.test(String(number))||seen.has(number))
   return {complete:false,items:[],reason:kind+'_ENUMERATION_INVALID'};
  seen.add(number);
  if(kind==='PR' && (typeof item.draft!=='boolean'||(item.headSha!==null&&item.headSha!==undefined&&!/^[a-f\d]{40}$/i.test(item.headSha))))
   return {complete:false,items:[],reason:'PR_FIELDS_INVALID'};
  normalized.push(kind==='PR'?{number,draft:item.draft}:{number});
 }
 return {complete:true,items:normalized.sort((a,b)=>b.number-a.number),reason:null};
}
export function buildPrivateReviewCandidates(projection,workplan,{perType=2}={}){
 validateWorkplan(workplan,projection);
 ok(Number.isInteger(perType)&&perType>=1&&perType<=5,'perType must be 1..5');
 const items=[],projects=[];let incomplete=0,knownPr=0,knownIssue=0;
 for(let i=0;i<projection.projects.length;i++){
  const p=projection.projects[i],owned=workplan.projects[i];
  ok(p.id===owned.repository,'selected scope mismatch');
  const prs=knownCollection(p.github?.openPRs===null?'UNKNOWN':'VERIFIED',
    p.github?.openPRs,p.github?.prReferences,{kind:'PR'});
  const issues=knownCollection(p.github?.openIssues===null?'UNKNOWN':'VERIFIED',
    p.github?.openIssues,p.github?.issueNumbers,{kind:'ISSUE'});
  const results=[{kind:'PR',value:prs},{kind:'ISSUE',value:issues}];
  for(const {kind,value} of results){
   if(!value.complete){incomplete++;continue;}
   if(kind==='PR')knownPr+=value.items.length;else knownIssue+=value.items.length;
   for(const ref of value.items.slice(0,perType)){
    items.push({
     repository:p.id,
     kind:kind==='PR'?'REVIEW_OPEN_PR_AT_SNAPSHOT':'REVIEW_OPEN_ISSUE_AT_SNAPSHOT',
     number:ref.number,
     draft:kind==='PR'?ref.draft:null,
     source:'SAVED_ENCRYPTED_GITHUB_SNAPSHOT',
     observedAt:projection.observedAt,
     freshness:projection.freshness?.state??'UNKNOWN',
     ownerConfirmed:false,
     ownerTaskCreated:false,
     priority:'NOT_ASSESSED',
     hostVerified:false,
     suggestedReview:kind==='PR'?
       'เปิด PR #'+ref.number+' ตรวจสถานะและหลักฐานล่าสุดด้วยตนเอง ก่อนตัดสินใจเกี่ยวกับงานถัดไป':
       'เปิด Issue #'+ref.number+' ตรวจความคืบหน้าและหลักฐานล่าสุดด้วยตนเอง ก่อนตัดสินใจงานถัดไป'
    });
   }
  }
  projects.push({
   repository:p.id,
   observedPRs:prs.complete?prs.items.length:null,
   observedIssues:issues.complete?issues.items.length:null,
   enumeration:prs.complete&&issues.complete?'SAVED_ENUMERATIONS_COMPLETE':'PARTIAL_OR_UNKNOWN',
   missingSources:[...(prs.complete?[]:[prs.reason]),...(issues.complete?[]:[issues.reason])],
   displayedCandidates:prs.items.slice(0,perType).length+issues.items.slice(0,perType).length,
   omittedReferences:prs.complete?Math.max(0,prs.items.length-perType):null,
   omittedIssueReferences:issues.complete?Math.max(0,issues.items.length-perType):null,
   existingOwnerActions:owned.actions.length
  });
 }
 return {
  mode:'PRIVATE_REVIEW_CANDIDATES_V1',
  source:'SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE',
  observedAt:projection.observedAt,freshness:projection.freshness?.state??'UNKNOWN',
  selected:projection.projects.length,
  completeReferenceCollections:2*projection.projects.length-incomplete,
  incompleteReferenceCollections:incomplete,
  knownPRReferences:knownPr,knownIssueReferences:knownIssue,
  suggestedItems:items,projects,
  ownerTasksAdded:0,priorityInferred:false,hostStatusInferred:false,requiresOwnerReview:true,
  noWrites:true
 };
}
export function summarizePrivateReviewCandidates(record){
 ok(record?.mode==='PRIVATE_REVIEW_CANDIDATES_V1','candidate record');
 return {
  mode:'PRIVATE_REVIEW_CANDIDATES_SUMMARY',
  source:record.source,observedAt:record.observedAt,freshness:record.freshness,
  selected:record.selected,knownPRReferences:record.knownPRReferences,
  knownIssueReferences:record.knownIssueReferences,
  completeReferenceCollections:record.completeReferenceCollections,
  incompleteReferenceCollections:record.incompleteReferenceCollections,
  shownCandidates:record.suggestedItems.length,
  ownerTasksAdded:0,liveGitHubChecked:false,publicDataExported:false,
  requiresOwnerReview:true
 };
}


// PC-04H — paginated owner-private review of the COMPLETE saved PR/Issue enumeration.
// This does not refresh GitHub, assign priority, or create any owner action.
export function buildPrivateCandidatePage(projection,workplan,{projectIndex,kind,page,pageSize=10}={}){
 validateWorkplan(workplan,projection);
 ok(Number.isInteger(projectIndex)&&projectIndex>=0&&projectIndex<projection.projects.length,
   'project index out of selected scope');
 ok(kind==='PR'||kind==='ISSUE','kind must be PR or ISSUE');
 ok(Number.isInteger(page)&&page>=0&&page<=49,'page out of range');
 ok(Number.isInteger(pageSize)&&pageSize>=1&&pageSize<=20,'page size out of range');
 const project=projection.projects[projectIndex],owner=workplan.projects[projectIndex];
 ok(project.id===owner.repository,'selected project mismatch');
 const state=kind==='PR'?project.github?.openPRs:project.github?.openIssues;
 const refs=kind==='PR'?project.github?.prReferences:project.github?.issueNumbers;
 const verified=knownCollection(state===null?'UNKNOWN':'VERIFIED',state,refs,{kind});
 if(!verified.complete)return {
  mode:'PRIVATE_REVIEW_CANDIDATE_PAGE',repository:project.id,
  projectIndex,kind,page:0,pageSize,total:null,pages:null,items:[],
  enumeration:'PARTIAL_OR_UNKNOWN',missingSource:verified.reason,
  observedAt:projection.observedAt,source:'SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE',
  requiresOwnerReview:true,ownerTasksAdded:0,noWrites:true
 };
 const total=verified.items.length,pages=Math.ceil(total/pageSize);
 ok(page<Math.max(1,pages),'page beyond available reference list');
 const items=verified.items.slice(page*pageSize,(page+1)*pageSize).map(ref=>({
  number:ref.number,draft:kind==='PR'?ref.draft:null,
  priority:'NOT_ASSESSED',ownerConfirmed:false,ownerTaskCreated:false
 }));
 return {
  mode:'PRIVATE_REVIEW_CANDIDATE_PAGE',repository:project.id,
  projectIndex,kind,page,pageSize,total,pages,items,
  enumeration:'SAVED_ENUMERATION_COMPLETE',missingSource:null,
  observedAt:projection.observedAt,source:'SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE',
  requiresOwnerReview:true,ownerTasksAdded:0,noWrites:true
 };
}
