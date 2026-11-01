// PC-04K: Selected saved Delta -> explicitly owner-reviewed encrypted TODO model.
// The current GitHub REST status is distinct from old/new Snapshot observations;
// no Git HEAD or PR status proves production, readiness, or project completion.
import {prepareOwnerUpdate,validateWorkplan} from './workplan-model.mjs';
import {buildPrivateDeltaReviewPage} from './delta-review-queue.mjs';

const NAME=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const PRIORITIES=new Set(['P0','P1','P2','P3']);
const OWNERS=new Set(['HUMAN','AI_ASSIST']);
const SHA=/^[a-f\d]{40}$/i;
function stop(ok,reason){if(!ok)throw Error('PC04K_REFUSED_'+reason);}
function safeText(value,max){return typeof value==='string'&&value.length<=max&&
 !/[\x00-\x1f\x7f]/.test(value);}
export function selectOwnerDeltaReference(delta,projection,workplan,{projectIndex,kind,change,number}){
 stop(Number.isInteger(number)&&number>0&&number<=999999999,'REFERENCE_NUMBER');
 validateWorkplan(workplan,projection);
 const wanted=kind==='PR'?'PR':'ISSUE';
 stop(kind===wanted,'KIND');
 let found=null;
 for(let page=0;page<=49;page++){
  const record=buildPrivateDeltaReviewPage(delta,projection,workplan,{
   projectIndex,kind,change,page
  });
  if(record.items.some(x=>x.number===number)){
   found=record;break;
  }
  if(page+1>=record.pages)break;
 }
 stop(found!==null,'REFERENCE_NOT_IN_VERIFIED_SAVED_DELTA');
 const repository=found.repository;
 stop(NAME.test(repository),'REPOSITORY');
 return {projectIndex,repository,kind,change,number,
  savedBefore:found.previousObservedAt,savedAfter:found.currentObservedAt,
  url:'https://github.com/'+repository+(kind==='PR'?'/pull/':'/issues/')+number,
  evidence:'SAVED_OPEN_LIST_DELTA_NOT_GITHUB_LIVE',
  hostVerified:false,mergedInferred:false,ownerActionCreated:false};
}
export function validateCurrentGithubRead(raw,reference,{at=new Date().toISOString()}={}){
 stop(Number.isFinite(Date.parse(at)),'OBSERVED_TIME');
 stop(raw!==null&&typeof raw==='object'&&!Array.isArray(raw),'GITHUB_RESPONSE');
 stop(raw.number===reference.number,'GITHUB_NUMBER');
 const expected='https://github.com/'+reference.repository+
  (reference.kind==='PR'?'/pull/':'/issues/')+reference.number;
 stop(raw.html_url===expected,'GITHUB_IDENTITY_URL');
 stop(raw.state==='open'||raw.state==='closed','GITHUB_STATE');
 let status;
 if(reference.kind==='PR'){
  stop(raw.base?.repo?.full_name?.toLowerCase()===reference.repository.toLowerCase(),'GITHUB_REPO');
  stop(typeof raw.draft==='boolean','GITHUB_DRAFT');
  stop(raw.head&&typeof raw.head.sha==='string'&&SHA.test(raw.head.sha),'GITHUB_HEAD');
  stop(raw.merged_at===null||typeof raw.merged_at==='string'&&
   Number.isFinite(Date.parse(raw.merged_at)),'GITHUB_MERGED_AT');
  stop(!(raw.state==='open'&&raw.merged_at!==null),'GITHUB_CONTRADICTORY_MERGE');
  status=raw.merged_at!==null?'MERGED_AS_REPORTED_BY_GITHUB_API':raw.state==='open'?
   'OPEN_AT_GITHUB_READ_TIME':'CLOSED_NOT_MERGED_AT_GITHUB_READ_TIME';
 }else{
  stop(!Object.hasOwn(raw,'pull_request'),'ISSUE_IS_ACTUALLY_PR');
  stop(typeof raw.repository_url==='string'&&
    raw.repository_url.endsWith('/repos/'+reference.repository),'GITHUB_REPO');
  status=raw.state==='open'?'OPEN_AT_GITHUB_READ_TIME':'CLOSED_AT_GITHUB_READ_TIME';
 }
 return {mode:'PC04K_GITHUB_READ_ONLY_EVIDENCE',repository:reference.repository,
  kind:reference.kind,number:reference.number,url:expected,
  status,observedAt:at,githubReadOnly:true,
  snapshotNotLive:true,hostVerified:false,completionVerified:false,
  mergeReadOnlyObserved:status==='MERGED_AS_REPORTED_BY_GITHUB_API',
  noWrites:true};
}
export function prepareOwnerReviewedDeltaAction({
 delta,projection,workplan,reference,githubObservation,manualReviewed=false,
 title,priority,owner,dueDate=null,nextStep=null,reason=null,
 id,evidenceId,at=new Date().toISOString()
}){
 stop(manualReviewed===true,'OWNER_REVIEW_ACK');
 const selected=selectOwnerDeltaReference(delta,projection,workplan,reference);
 stop(githubObservation?.mode==='PC04K_GITHUB_READ_ONLY_EVIDENCE'&&
  githubObservation.repository===selected.repository&&
  githubObservation.kind===selected.kind&&githubObservation.number===selected.number&&
  githubObservation.url===selected.url,'GITHUB_EVIDENCE_MISMATCH');
 stop(Number.isFinite(Date.parse(at))&&Date.parse(at)>Date.parse(workplan.updatedAt),
  'OWNER_UPDATE_TIME');
 stop(Number.isFinite(Date.parse(githubObservation.observedAt))&&
  Date.parse(githubObservation.observedAt)<=Date.parse(at),'GITHUB_READ_TIME');
 stop(safeText(title,300)&&title.trim().length>=3,'TITLE');
 stop(PRIORITIES.has(priority)&&OWNERS.has(owner),'PRIORITY_OR_OWNER');
 stop(dueDate===null||typeof dueDate==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(dueDate),
  'DUE_DATE');
 stop(reason===null||safeText(reason,300),'REASON');
 stop(nextStep===null||safeText(nextStep,500),'NEXT_STEP');
 stop(typeof id==='string'&&/^action-[a-f\d]{16}$/i.test(id),'ACTION_ID');
 stop(typeof evidenceId==='string'&&/^review-[a-f\d]{16}$/i.test(evidenceId),'EVIDENCE_ID');
 const project=workplan.projects[selected.projectIndex];
 const marker='PC04K:'+selected.kind+'#'+selected.number+':'+selected.change+':';
 stop(!project.actions.some(a=>typeof a.reason==='string'&&a.reason.startsWith(marker)),
  'EXISTING_ACTION_FOR_REFERENCE');
 stop(!project.evidence.some(e=>e.id===evidenceId),'EVIDENCE_ID_EXISTS');
 const note='Owner manually reviewed the current GitHub page and read-only API status. '+
  'Saved open-list delta only; Host/Production not verified.';
 const evidence={id:evidenceId,kind:'OWNER_REVIEW',ref:selected.url,
  observedAt:at,recordedBy:'OWNER',note};
 const action={id,title:title.trim(),status:'TODO',priority,owner,dueDate,
  evidenceIds:[evidenceId],nextStep,reason:marker+
   (reason?.trim()||'Owner-confirmed follow-up; no Host/Production inference'),
  updatedAt:at};
 stop(action.reason.length<=500,'REASON_TOO_LONG');
 const revised=prepareOwnerUpdate(workplan,projection,selected.repository,{
  evidence:[...project.evidence,evidence],
  actions:[...project.actions,action]
 },{at});
 return {revised,preview:{mode:'PC04K_OWNER_ENCRYPTED_ACTION_PREVIEW',
  repository:selected.repository,kind:selected.kind,number:selected.number,
  savedDeltaChange:selected.change,githubReadStatus:githubObservation.status,
  title:action.title,priority:action.priority,owner:action.owner,
  dueDate:action.dueDate,ownerReviewEvidenceAdded:true,taskStatus:'TODO',
  currentGitHubReadAt:githubObservation.observedAt,
  encryptedSaveRequiresSeparateConfirm:true,
  hostVerified:false,productionVerified:false,mergeAutomaticallyInferred:false,
  saved:false}};
}
