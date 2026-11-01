// PC-03D3B: pure, process-memory-only evidence projection.
// This file intentionally DOES NOT import filesystem, HTTP, browser or GitHub tools.
// It is NOT imported by the synthetic HTTP server or public React UI.
// Projection contains private repository names, so never serialize it into GitHub Pages.
import { buildEvidenceSummary } from '../private-sync/summary.mjs';

const UNKNOWN='UNKNOWN', NOT_VERIFIED='NOT_VERIFIED';
function assert(ok,reason){if(!ok)throw new Error(reason);}
function axis(state,source=null){return {state,source};}
export function projectOfflineEvidence(snapshot,selectedNames,now=Date.now()){
  assert(Number.isFinite(now),'Invalid observation comparison clock');
  const summary=buildEvidenceSummary(snapshot,selectedNames,now);
  assert(snapshot.owner && typeof snapshot.owner==='string','Owner missing');
  assert(summary.count===selectedNames.length,'Selected repository scope mismatch');
  const projects=summary.projects.map(p=>{
    // This is ONLY GitHub metadata from the encrypted snapshot, not current host truth.
    const gitKnown=p.gitHead==='VERIFIED';
    const countKnown=p.openPRs!==null && p.openIssues!==null;
    const stale=!['RECENT'].includes(summary.freshness.state);
    const confidence=stale?'EVIDENCE_AGING_OR_STALE':(!gitKnown||!countKnown?'PARTIAL_GIT_EVIDENCE':'OBSERVED_GIT_ONLY');
    return {
      id:p.name,               // PRIVATE; never send to public app
      defaultBranch:p.defaultBranch, // May be legacy, NOT asserted as deployed branch
      observedAt:summary.observedAt,
      github:{defaultHead:p.gitHead,openPRs:p.openPRs,openIssues:p.openIssues,
        // PC-04E: source-specific numeric references from the already decrypted SAVED snapshot.
        // These are NOT live GitHub requests and are never sent to public Pages.
        // Invalid/incomplete enumerations fail closed in the candidate model.
        prReferences:Array.isArray(snapshot.projects.find(s=>s.fullName===p.name)?.openPRs?.items)?
         structuredClone(snapshot.projects.find(s=>s.fullName===p.name).openPRs.items):null,
        issueNumbers:Array.isArray(snapshot.projects.find(s=>s.fullName===p.name)?.openIssues?.numbers)?
         [...snapshot.projects.find(s=>s.fullName===p.name).openIssues.numbers]:null},
      axes:{
        development:axis(UNKNOWN),
        git:axis(gitKnown?'OBSERVED_DEFAULT_HEAD':UNKNOWN,
          gitKnown?'ENCRYPTED_GITHUB_SNAPSHOT':null),
        deployment:axis(NOT_VERIFIED),
        decision:axis('HUMAN_REVIEW_REQUIRED'),
        confidence:axis(confidence, 'SNAPSHOT_FRESHNESS_AND_GIT_COVERAGE')
      }
    };
  });
  return {
    kind:'PRIVATE_LOCAL_PROJECTION',
    boundary:'OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES',
    source:'SELECTED_ENCRYPTED_GITHUB_SNAPSHOT',
    observedAt:summary.observedAt,
    freshness:summary.freshness,
    selected:summary.selected,inspected:summary.count,
    aggregate:{
      gitHead:summary.gitHead,
      pullRequests:summary.pullRequests,
      issues:summary.issues
    },
    hostDeployment:NOT_VERIFIED,
    acceptance:NOT_VERIFIED,
    projects
  };
}
// Only non-identifying metadata suitable for a local QA report. Still not for auto-publication.
export function projectionHealth(projection){
 assert(projection && projection.kind==='PRIVATE_LOCAL_PROJECTION' &&
   projection.boundary==='OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES',
   'Invalid projection boundary');
 return {
  selected:projection.selected,
  inspected:projection.inspected,
  freshness:projection.freshness.state,
  hostDeployment:NOT_VERIFIED,
  realPrivateBrowserAccess:'NOT_AUTHORIZED'
 };
}
