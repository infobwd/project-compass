// PC-03C — offline private evidence summary. Never bundled into the public UI.
const SHA=/^[a-f\d]{40}$/i;
const NAME=/^[a-z\d_.-]+\/[a-z\d_.-]+$/i;
const BRANCH=/^[a-z\d_.\/-]+$/i;
const VALID=new Set(['VERIFIED','UNKNOWN','INCOMPLETE']);
const CURRENT='NOT_VERIFIED'; // Git snapshots are not live host or deployment evidence.

function requireValid(ok, message='Invalid private snapshot structure') {
  if(!ok)throw new Error(message);
}
function validField(item) {
  return item && typeof item==='object' && VALID.has(item.state) &&
    ((item.state==='VERIFIED' && Number.isSafeInteger(item.count) && item.count>=0) ||
     (item.state!=='VERIFIED' && item.count===null)) &&
    Number.isSafeInteger(item.atLeast) && item.atLeast>=0 &&
    (item.state!=='VERIFIED' || item.count===item.atLeast);
}
export function verifySelectedSnapshot(snapshot, requestedNames) {
  requireValid(snapshot && typeof snapshot==='object' && !Array.isArray(snapshot));
  requireValid(snapshot.format==='BWD-COMPASS-REGISTRY-V1' &&
    snapshot.coverage==='ALL_SELECTED' && snapshot.selection?.mode==='EXPLICIT',
    'Not an explicitly selected private snapshot');
  requireValid(Array.isArray(requestedNames) && requestedNames.length>0 &&
    requestedNames.length<=40);
  requireValid(snapshot.selection.requested===requestedNames.length &&
    snapshot.selection.matched===requestedNames.length &&
    snapshot.inspectedRepositories===requestedNames.length &&
    Array.isArray(snapshot.projects) && snapshot.projects.length===requestedNames.length,
    'Selected repository count mismatch');
  requireValid(typeof snapshot.observedAt==='string' &&
    Number.isFinite(Date.parse(snapshot.observedAt)) &&
    /^\d{4}-\d{2}-\d{2}T/.test(snapshot.observedAt),
    'Invalid observation timestamp');
  const seen=new Set();
  for(let i=0;i<snapshot.projects.length;i++){
    const p=snapshot.projects[i], expected=requestedNames[i];
    requireValid(p && typeof p==='object' && typeof p.fullName==='string' &&
      NAME.test(p.fullName) && p.fullName.toLowerCase()===expected.toLowerCase(),
      'Selected repository identity/order mismatch');
    requireValid(!seen.has(p.fullName.toLowerCase()),'Duplicate repository entry');
    seen.add(p.fullName.toLowerCase());
    requireValid(typeof p.defaultBranch==='string' && p.defaultBranch.length<=128 &&
      BRANCH.test(p.defaultBranch),'Invalid branch name');
    requireValid(p.defaultHead && ['VERIFIED','UNKNOWN'].includes(p.defaultHead.state) &&
      (p.defaultHead.state==='VERIFIED'?SHA.test(p.defaultHead.sha||''):p.defaultHead.sha===null),
      'Invalid default branch evidence');
    requireValid(validField(p.openPRs) && validField(p.openIssues),'Invalid GitHub evidence counts');
  }
  return snapshot;
}
export function observedFreshness(observedAt, now=Date.now()){
  const age=now-Date.parse(observedAt);
  if(!Number.isFinite(age) || age< -5*60*1000)return {state:'CLOCK_SKEW',ageHours:null};
  const hours=Math.max(0,age/3600000);
  return {state:hours<=24?'RECENT':hours<=72?'AGING':'STALE',
    ageHours:Math.round(hours*10)/10};
}
export function buildEvidenceSummary(snapshot, requestedNames, now=Date.now()){
  verifySelectedSnapshot(snapshot,requestedNames);
  const freshness=observedFreshness(snapshot.observedAt,now);
  const projects=snapshot.projects;
  const headVerified=projects.filter(p=>p.defaultHead.state==='VERIFIED').length;
  const prVerified=projects.filter(p=>p.openPRs.state==='VERIFIED');
  const issueVerified=projects.filter(p=>p.openIssues.state==='VERIFIED');
  const sum=items=>items.reduce((t,p)=>t+p.count,0);
  return {count:projects.length,selected:requestedNames.length,
    observedAt:snapshot.observedAt,freshness,
    gitHead:{verified:headVerified,unknown:projects.length-headVerified},
    pullRequests:{verifiedProjects:prVerified.length,
      unknownProjects:projects.length-prVerified.length,
      knownOpen:sum(prVerified),total:prVerified.length===projects.length?sum(prVerified):null},
    issues:{verifiedProjects:issueVerified.length,
      unknownProjects:projects.length-issueVerified.length,
      knownOpen:sum(issueVerified),total:issueVerified.length===projects.length?sum(issueVerified):null},
    deployment:CURRENT,acceptance:CURRENT,
    projects:projects.map(p=>({name:p.fullName,defaultBranch:p.defaultBranch,
      gitHead:p.defaultHead.state,openPRs:p.openPRs.state==='VERIFIED'?p.openPRs.count:null,
      openIssues:p.openIssues.state==='VERIFIED'?p.openIssues.count:null,
      deployment:CURRENT,acceptance:CURRENT}))};
}
export function formatEvidenceSummary(s,{details=false}={}){
  const fmt=x=>x===null?'UNKNOWN':String(x);
  const out=[
    'BWD Project Compass — Private LOCAL evidence (not live)',
    'Scope: '+s.count+'/'+s.selected+' explicitly selected repositories',
    'Observed at: '+s.observedAt,
    'Snapshot freshness: '+s.freshness.state+
      (s.freshness.ageHours===null?'':(' ('+s.freshness.ageHours+'h old)')),
    'Git default HEAD: '+s.gitHead.verified+' verified; '+s.gitHead.unknown+' unknown',
    'Open PRs: '+fmt(s.pullRequests.total)+' total; '+s.pullRequests.knownOpen+
      ' from '+s.pullRequests.verifiedProjects+' verified repositories; '+
      s.pullRequests.unknownProjects+' unknown',
    'Open Issues: '+fmt(s.issues.total)+' total; '+s.issues.knownOpen+
      ' from '+s.issues.verifiedProjects+' verified repositories; '+
      s.issues.unknownProjects+' unknown',
    'Host deployment: NOT VERIFIED (all projects)',
    'Project acceptance: NOT VERIFIED (all projects)',
    'Default branch is NOT proof of production branch or deployed revision.',
    'No current GitHub queries performed. No plaintext files written.'
  ];
  if(details){
    out.push('--- PRIVATE DETAIL: display locally, do NOT paste into public channels ---');
    for(const p of s.projects)
      out.push(p.name+' | default '+p.defaultBranch+' | head '+p.gitHead+
        ' | open PR '+fmt(p.openPRs)+' | open issue '+fmt(p.openIssues)+
        ' | host '+p.deployment+' | accepted '+p.acceptance);
  }
  return out.join('\n');
}
