// PC-04I: Pure saved Snapshot delta. All "added/absent" labels refer only to OPEN lists
// observed at two times. Absence is NOT proof of Merge/Close/Done/Deploy.
import {verifySelectedSnapshot} from './summary.mjs';

const SHA=/^[a-f0-9]{40}$/i;
function gate(pass,reason){if(!pass)throw Error('PC04I_REFUSED_'+reason);}
function numericEntries(records,kind){
 const container=kind==='PR'?records.openPRs:records.openIssues;
 gate(container?.state==='VERIFIED','UNVERIFIED_'+kind);
 gate(Number.isSafeInteger(container.count)&&container.count>=0&&container.count<=500,'COUNT_'+kind);
 const items=kind==='PR'?container.items:container.numbers;
 gate(Array.isArray(items)&&items.length===container.count,'INCOMPLETE_'+kind);
 const byId=new Map();
 for(const item of items){
  const n=kind==='PR'?item?.number:item;
  gate(Number.isSafeInteger(n)&&n>0&&n<=999999999&&!byId.has(n),'INVALID_ID_'+kind);
  if(kind==='PR')gate(typeof item?.draft==='boolean'&&
    (item.headSha==null||(typeof item.headSha==='string'&&SHA.test(item.headSha))),'INVALID_PR_META');
  byId.set(n,kind==='PR'?{draft:item.draft,headSha:item.headSha??null}:null);
 }
 return byId;
}
const descending=values=>values.sort((a,b)=>b-a);
function diffIds(before,after){
 return {
  nowObservedOpen:descending([...after.keys()].filter(n=>!before.has(n))),
  noLongerObservedOpen:descending([...before.keys()].filter(n=>!after.has(n)))
 };
}
export function compareSelectedSnapshots(before,after,selectedNames){
 verifySelectedSnapshot(before,selectedNames);
 verifySelectedSnapshot(after,selectedNames);
 gate(before.owner===after.owner,'OWNER_MISMATCH');
 gate(Date.parse(after.observedAt)>Date.parse(before.observedAt),'NOT_NEWER');
 const totals={oldOpenPRs:0,newOpenPRs:0,oldOpenIssues:0,newOpenIssues:0,
  prsNewlyObservedOpen:0,prsNoLongerObservedOpen:0,
  issuesNewlyObservedOpen:0,issuesNoLongerObservedOpen:0,
  defaultHeadsChanged:0,defaultHeadsNotComparable:0,
  prHeadChangedWhenBothObservedOpen:0,prDraftChangedWhenBothObservedOpen:0};
 const projects=before.projects.map((old,i)=>{
  const fresh=after.projects[i];
  gate(old.fullName.toLowerCase()===fresh.fullName.toLowerCase(),'PROJECT_ORDER');
  const oldPR=numericEntries(old,'PR'),newPR=numericEntries(fresh,'PR');
  const oldIssue=numericEntries(old,'ISSUE'),newIssue=numericEntries(fresh,'ISSUE');
  const prs=diffIds(oldPR,newPR),issues=diffIds(oldIssue,newIssue);
  const comparable=old.defaultHead.state==='VERIFIED'&&fresh.defaultHead.state==='VERIFIED';
  const headChanged=comparable?old.defaultHead.sha!==fresh.defaultHead.sha:null;
  const branchChanged=old.defaultBranch!==fresh.defaultBranch;
  let prHeadChanged=0,prDraftChanged=0;
  for(const [id,a] of oldPR){
   const b=newPR.get(id);
   if(!b)continue;
   if(a.headSha!==null&&b.headSha!==null&&a.headSha!==b.headSha)prHeadChanged++;
   if(a.draft!==b.draft)prDraftChanged++;
  }
  totals.oldOpenPRs+=oldPR.size;totals.newOpenPRs+=newPR.size;
  totals.oldOpenIssues+=oldIssue.size;totals.newOpenIssues+=newIssue.size;
  totals.prsNewlyObservedOpen+=prs.nowObservedOpen.length;
  totals.prsNoLongerObservedOpen+=prs.noLongerObservedOpen.length;
  totals.issuesNewlyObservedOpen+=issues.nowObservedOpen.length;
  totals.issuesNoLongerObservedOpen+=issues.noLongerObservedOpen.length;
  totals.defaultHeadsChanged+=Number(headChanged===true);
  totals.defaultHeadsNotComparable+=Number(headChanged===null);
  totals.prHeadChangedWhenBothObservedOpen+=prHeadChanged;
  totals.prDraftChangedWhenBothObservedOpen+=prDraftChanged;
  return {repository:old.fullName,
    openPRs:{previous:oldPR.size,current:newPR.size,...prs},
    openIssues:{previous:oldIssue.size,current:newIssue.size,...issues},
    git:{defaultBranchChanged:branchChanged,
      defaultHeadChanged:headChanged,headComparison:comparable?'BOTH_VERIFIED':'NOT_COMPARABLE',
      prHeadChangedWhenBothObservedOpen:prHeadChanged,
      prDraftChangedWhenBothObservedOpen:prDraftChanged},
    ownerTaskAdded:false,hostVerified:false,mergeOrClosureInferred:false};
 });
 gate(totals.oldOpenPRs+totals.prsNewlyObservedOpen-totals.prsNoLongerObservedOpen===totals.newOpenPRs,'PR_TOTAL');
 gate(totals.oldOpenIssues+totals.issuesNewlyObservedOpen-totals.issuesNoLongerObservedOpen===totals.newOpenIssues,'ISSUE_TOTAL');
 return {mode:'PC04I_SAVED_SNAPSHOT_DELTA',source:'TWO_ENCRYPTED_SAVED_GITHUB_SNAPSHOTS_NOT_LIVE',
  previousObservedAt:before.observedAt,currentObservedAt:after.observedAt,
  selected:selectedNames.length,totals,projects,
  ownerTasksAdded:0,hostVerified:false,mergeInferred:false,closureInferred:false,
  deployInferred:false,noWrites:true,requiresOwnerReview:true};
}
export function summarizeSnapshotDelta(delta){
 gate(delta?.mode==='PC04I_SAVED_SNAPSHOT_DELTA','BAD_DELTA');
 return {mode:'PC04I_SAVED_SNAPSHOT_DELTA_SUMMARY',
  previousObservedAt:delta.previousObservedAt,currentObservedAt:delta.currentObservedAt,
  selected:delta.selected,totals:{...delta.totals},source:delta.source,
  privateProjectNamesIncluded:false,ownerTasksAdded:0,noWrites:true,
  hostVerified:false,mergeInferred:false,closureInferred:false,deployInferred:false};
}
