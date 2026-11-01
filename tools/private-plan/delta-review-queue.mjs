// PC-04J — owner-private, strictly read-only review paging of verified two-Snapshot delta.
// A change in an OPEN-list is a review prompt, NEVER an automatic TODO or Merge/Close claim.
import {validateWorkplan} from './workplan-model.mjs';

const NAME=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const MAX_PAGE=49;
function requireGate(ok,reason){if(!ok)throw Error('PC04J_REVIEW_REFUSED_'+reason);}
function verifyNumbers(list){
 requireGate(Array.isArray(list)&&list.length<=500,'REFERENCE_LIST');
 const ids=new Set();
 for(const n of list){
  requireGate(Number.isSafeInteger(n)&&n>0&&n<=999999999&&!ids.has(n),'REFERENCE_ID');
  ids.add(n);
 }
 return list;
}
export function buildPrivateDeltaReviewPage(delta,projection,workplan,{
 projectIndex,kind,change,page,pageSize=10
}={}){
 validateWorkplan(workplan,projection);
 requireGate(delta?.mode==='PC04I_SAVED_SNAPSHOT_DELTA'&&delta.noWrites===true&&
  delta.ownerTasksAdded===0&&delta.mergeInferred===false&&delta.closureInferred===false,
  'SOURCE_IS_NOT_VERIFIED_DELTA');
 requireGate(delta.selected===projection.selected&&delta.currentObservedAt===projection.observedAt&&
  Array.isArray(delta.projects)&&delta.projects.length===projection.projects.length,
  'SOURCE_SCOPE');
 requireGate(Number.isInteger(projectIndex)&&projectIndex>=0&&projectIndex<projection.projects.length,'PROJECT_INDEX');
 requireGate(kind==='PR'||kind==='ISSUE','KIND');
 requireGate(change==='NEW_OPEN'||change==='NO_LONGER_OPEN','CHANGE');
 requireGate(Number.isInteger(page)&&page>=0&&page<=MAX_PAGE,'PAGE');
 requireGate(Number.isInteger(pageSize)&&pageSize>=1&&pageSize<=20,'PAGE_SIZE');
 const p=projection.projects[projectIndex],o=workplan.projects[projectIndex],d=delta.projects[projectIndex];
 requireGate(p.id===o.repository&&p.id===d.repository&&NAME.test(p.id),'PROJECT_SCOPE');
 const info=kind==='PR'?d.openPRs:d.openIssues;
 requireGate(info&&Number.isSafeInteger(info.previous)&&info.previous>=0&&info.previous<=500&&
  Number.isSafeInteger(info.current)&&info.current>=0&&info.current<=500,'COUNTS');
 const added=verifyNumbers(info.nowObservedOpen),absent=verifyNumbers(info.noLongerObservedOpen);
 requireGate(info.previous+added.length-absent.length===info.current,'COUNT_RECONCILIATION');
 const overlap=new Set(added);
 requireGate(absent.every(id=>!overlap.has(id)),'CONFLICTING_REFERENCE');
 const selected=change==='NEW_OPEN'?added:absent;
 const total=selected.length,pages=Math.ceil(total/pageSize);
 requireGate(page<Math.max(1,pages),'PAGE_OUT_OF_RANGE');
 const items=selected.slice(page*pageSize,(page+1)*pageSize).map(number=>({
  number,kind,change,priority:'NOT_ASSESSED',
  ownerConfirmed:false,ownerTaskCreated:false,
  status:'REVIEW_SAVED_OPEN_LIST_CHANGE_NOT_LIVE'
 }));
 return {mode:'PC04J_PRIVATE_DELTA_REVIEW_PAGE',repository:p.id,
  projectIndex,kind,change,page,pageSize,total,pages,items,
  previousObservedAt:delta.previousObservedAt,currentObservedAt:delta.currentObservedAt,
  source:'TWO_SAVED_ENCRYPTED_GITHUB_OPEN_LISTS_NOT_LIVE',
  priorityInferred:false,ownerTasksAdded:0,mergeInferred:false,
  closeInferred:false,deployInferred:false,hostVerified:false,
  requiresOwnerReview:true,noWrites:true};
}
