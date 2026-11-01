// PC-04A: pure OWNER-ONLY workplan model, not imported by public src/ or any HTTP server.
// No disk, network, environment, browser storage or GitHub. Real IDs enter only at runtime in PRIVATE memory.
const FORMAT='BWD-COMPASS-PRIVATE-WORKPLAN-V1';
const DEV=new Set(['UNKNOWN','PLANNED','IN_PROGRESS','REVIEW','ACCEPTED_BY_OWNER']);
const DEPLOY=new Set(['NOT_VERIFIED','REPORTED_ONLY','HOST_REVIEWED_BY_OWNER']);
const DECISION=new Set(['NEEDS_REVIEW','APPROVED_BY_OWNER','BLOCKED_BY_OWNER']);
const EVIDENCE=new Set(['GITHUB_PR','GITHUB_COMMIT','LOCAL_TEST','HOST_CHECK','OWNER_REVIEW','SOURCE_DOC']);
const ACTION=new Set(['TODO','IN_PROGRESS','BLOCKED','DONE_BY_OWNER']);
const PRIORITY=new Set(['P0','P1','P2','P3']);
const NAME=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const ISO=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function ensure(ok,why){if(!ok)throw new Error('Invalid private workplan: '+why);}
function obj(o){return o!==null&&typeof o==='object'&&!Array.isArray(o);}
function string(s,min=0,max=1000){return typeof s==='string'&&s.length>=min&&s.length<=max&&!/[\u0000-\u001f\u007f]/.test(s);}
function optional(s,max=1000){return s===null||string(s,1,max);}
function timestamp(s){return typeof s==='string'&&ISO.test(s)&&Number.isFinite(Date.parse(s));}
function keys(o,allowed){ensure(obj(o),'object required');ensure(Object.keys(o).every(k=>allowed.includes(k)),'unexpected property');}
function ids(projection){
 ensure(obj(projection)&&projection.kind==='PRIVATE_LOCAL_PROJECTION'&&
 projection.boundary==='OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES'&&
 Array.isArray(projection.projects),'validated offline projection required');
 const result=projection.projects.map(p=>p.id);
 ensure(result.length>0&&result.length<=40&&result.every(s=>string(s,3,150)&&NAME.test(s)),'repository identity');
 ensure(new Set(result.map(s=>s.toLowerCase())).size===result.length,'duplicate scope');
 ensure(result.length===projection.selected,'selected scope mismatch');
 return result;
}
function evidence(value){
 ensure(Array.isArray(value)&&value.length<=60,'evidence array');
 const seen=new Set();
 for(const item of value){
  keys(item,['id','kind','ref','observedAt','recordedBy','note']);
  ensure(string(item.id,1,64)&&/^[a-z0-9_-]+$/i.test(item.id),'evidence id');
  ensure(!seen.has(item.id),'duplicate evidence id');seen.add(item.id);
  ensure(EVIDENCE.has(item.kind),'evidence type');
  ensure(string(item.ref,4,800),'evidence ref');
  ensure(timestamp(item.observedAt),'evidence time');
  ensure(item.recordedBy==='OWNER','evidence attribution');
  ensure(optional(item.note,500),'evidence note');
 }
 return seen;
}
function checkProject(project,expected){
 keys(project,['repository','development','deployment','decision','evidence','actions','blockers','localWorktree','hostUrl','lastReviewedAt','note']);
 ensure(project.repository===expected,'selected registry order mismatch');
 ensure(obj(project.development)&&DEV.has(project.development.state),'development state');
 ensure(obj(project.deployment)&&DEPLOY.has(project.deployment.state),'deployment state');
 ensure(obj(project.decision)&&DECISION.has(project.decision.state),'decision state');
 const ids=evidence(project.evidence);
 for(const part of ['development','deployment','decision']){
  const rec=project[part];
  keys(rec,['state','evidenceIds']);
  ensure(Array.isArray(rec.evidenceIds)&&rec.evidenceIds.length<=20&&
    rec.evidenceIds.every(id=>ids.has(id)),'unknown state evidence references');
 }
 const find=(part,kind)=>part.evidenceIds.some(id=>project.evidence.find(e=>e.id===id)?.kind===kind);
 if(project.development.state==='ACCEPTED_BY_OWNER')ensure(find(project.development,'OWNER_REVIEW'),'accepted needs owner-reviewed evidence');
 if(project.deployment.state==='HOST_REVIEWED_BY_OWNER')ensure(find(project.deployment,'HOST_CHECK'),'host reviewed needs actual host evidence');
 if(project.decision.state!=='NEEDS_REVIEW')ensure(find(project.decision,'OWNER_REVIEW'),'owner decision requires owner-review evidence');
 ensure(Array.isArray(project.actions)&&project.actions.length<=60,'actions');
 const actionIds=new Set();
 for(const a of project.actions){
  keys(a,['id','title','status','priority','owner','dueDate','evidenceIds','nextStep','reason','updatedAt']);
  ensure(string(a.id,1,64)&&/^[a-z0-9_-]+$/i.test(a.id)&&!actionIds.has(a.id),'action id');
  actionIds.add(a.id);
  ensure(string(a.title,3,300),'action title');
  ensure(ACTION.has(a.status)&&PRIORITY.has(a.priority),'action state/priority');
  ensure(a.owner==='HUMAN'||a.owner==='AI_ASSIST','task owner');
  ensure(a.dueDate===null||/^\d{4}-\d{2}-\d{2}$/.test(a.dueDate),'due date');
  ensure(Array.isArray(a.evidenceIds)&&a.evidenceIds.every(id=>ids.has(id)),'action evidence');
  ensure(optional(a.nextStep,500)&&optional(a.reason,500),'action notes');
  ensure(timestamp(a.updatedAt),'action updated time');
  if(a.status==='DONE_BY_OWNER')ensure(a.evidenceIds.some(id=>project.evidence.find(e=>e.id===id)?.kind==='OWNER_REVIEW'),'completed task needs owner evidence');
 }
 ensure(Array.isArray(project.blockers)&&project.blockers.length<=20&&project.blockers.every(v=>string(v,1,300)),'blockers');
 ensure(optional(project.localWorktree,500)&&optional(project.hostUrl,500)&&optional(project.note,1500),'private notes/paths');
 ensure(project.lastReviewedAt===null||timestamp(project.lastReviewedAt),'owner review time');
}
export function createEmptyWorkplan(projection,{at=new Date().toISOString()}={}){
 const names=ids(projection);
 ensure(timestamp(at),'init time');
 return {format:FORMAT,source:'OWNER_MANAGED_PRIVATE_LOCAL',createdAt:at,updatedAt:at,
  scope:{mode:'EXPLICIT',repositories:names},
  projects:names.map(repository=>({
   repository,
   development:{state:'UNKNOWN',evidenceIds:[]},
   deployment:{state:'NOT_VERIFIED',evidenceIds:[]},
   decision:{state:'NEEDS_REVIEW',evidenceIds:[]},
   evidence:[],actions:[],blockers:[],
   localWorktree:null,hostUrl:null,lastReviewedAt:null,note:null
  }))};
}
export function validateWorkplan(plan,projection){
 const selected=ids(projection);
 keys(plan,['format','source','createdAt','updatedAt','scope','projects']);
 ensure(plan.format===FORMAT&&plan.source==='OWNER_MANAGED_PRIVATE_LOCAL','format/source');
 ensure(timestamp(plan.createdAt)&&timestamp(plan.updatedAt)&&
  Date.parse(plan.updatedAt)>=Date.parse(plan.createdAt),'plan timestamps');
 keys(plan.scope,['mode','repositories']);
 ensure(plan.scope.mode==='EXPLICIT'&&Array.isArray(plan.scope.repositories)&&
  plan.scope.repositories.length===selected.length&&
  plan.scope.repositories.every((n,i)=>n===selected[i]),'selection scope');
 ensure(Array.isArray(plan.projects)&&plan.projects.length===selected.length,'projects length');
 plan.projects.forEach((p,i)=>checkProject(p,selected[i]));
 return plan;
}
export function summarizeWorkplan(plan,projection,{now=new Date().toISOString()}={}){
 validateWorkplan(plan,projection);
 ensure(timestamp(now),'summary time');
 const actions=plan.projects.flatMap(p=>p.actions.map(a=>({repository:p.repository,...a})));
 return {
  mode:'PRIVATE_LOCAL_WORKPLAN',source:plan.source,observedAt:projection.observedAt,
  lastOwnerUpdate:plan.updatedAt,
  repositories:plan.projects.length,
  ownerReviewed:plan.projects.filter(p=>p.lastReviewedAt!==null).length,
  developmentAcceptedByOwner:plan.projects.filter(p=>p.development.state==='ACCEPTED_BY_OWNER').length,
  hostReviewedByOwner:plan.projects.filter(p=>p.deployment.state==='HOST_REVIEWED_BY_OWNER').length,
  waitingDecision:plan.projects.filter(p=>p.decision.state==='NEEDS_REVIEW').length,
  openActions:actions.filter(a=>a.status!=='DONE_BY_OWNER').length,
  overdueActions:actions.filter(a=>a.status!=='DONE_BY_OWNER'&&a.dueDate!==null&&a.dueDate<now.slice(0,10)).length,
  // Suggestions are explicitly NOT part of owner-confirmed action evidence.
  suggestedOwnerReview:plan.projects.filter(p=>p.actions.length===0||p.lastReviewedAt===null).map(p=>({repository:p.repository,
    text:'ตรวจสถานะงานจริงและบันทึกขั้นตอนถัดไป',kind:'SUGGESTION_NOT_VERIFIED'})),
  // A verified GitHub default HEAD never changes any owner-reviewed development/host status.
  githubSnapshotFreshness:projection.freshness.state,
  hostDeploymentInferredFromGit:false
 };
}
export function prepareOwnerUpdate(plan,projection,repository,changes,{at=new Date().toISOString()}={}){
 validateWorkplan(plan,projection);
 ensure(timestamp(at),'update time');
 const found=plan.projects.findIndex(p=>p.repository===repository);
 ensure(found>=0,'nonselected repository');
 ensure(obj(changes),'changes object');
 const supported=['development','deployment','decision','evidence','actions','blockers','localWorktree','hostUrl','lastReviewedAt','note'];
 ensure(Object.keys(changes).length>0&&Object.keys(changes).every(k=>supported.includes(k)),'approved owner fields only');
 const newPlan=structuredClone(plan);
 const project=newPlan.projects[found];
 for(const [key,value] of Object.entries(changes))project[key]=structuredClone(value);
 newPlan.updatedAt=at;
 validateWorkplan(newPlan,projection);
 return newPlan;
}
