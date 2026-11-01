import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence,projectionHealth} from '../tools/private-ui/offline-projection.mjs';

const owner='fictional-owner',names=[owner+'/sample-atlas',owner+'/demo-orchard'];
const sha='a'.repeat(40);
function fixture(){
 return {
  format:'BWD-COMPASS-REGISTRY-V1',owner,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:2,matched:2},
  observedAt:'2026-11-01T00:00:00.000Z',inspectedRepositories:2,
  projects:[
   {fullName:names[0],defaultBranch:'main',defaultHead:{state:'VERIFIED',sha},
    openPRs:{state:'VERIFIED',count:2,atLeast:2},
    openIssues:{state:'VERIFIED',count:1,atLeast:1}},
   {fullName:names[1],defaultBranch:'master',defaultHead:{state:'UNKNOWN',sha:null},
    openPRs:{state:'UNKNOWN',count:null,atLeast:0},
    openIssues:{state:'VERIFIED',count:3,atLeast:3}}
  ]
 };
}
const t=Date.parse('2026-11-01T01:00:00.000Z');
test('offline projection retains scope and synthetic Git counts without host completion inference',()=>{
 const p=projectOfflineEvidence(fixture(),names,t);
 assert.equal(p.boundary,'OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES');
 assert.equal(p.source,'SELECTED_ENCRYPTED_GITHUB_SNAPSHOT');
 assert.equal(p.inspected,2);
 assert.equal(p.selected,2);
 assert.equal(p.aggregate.pullRequests.total,null);
 assert.equal(p.aggregate.pullRequests.knownOpen,2);
 assert.equal(p.aggregate.issues.total,4);
 assert.equal(p.hostDeployment,'NOT_VERIFIED');
 assert.equal(p.acceptance,'NOT_VERIFIED');
 assert.equal(p.projects[0].defaultBranch,'main');
 assert.equal(p.projects[1].defaultBranch,'master');
 assert.equal(p.projects[0].axes.git.state,'OBSERVED_DEFAULT_HEAD');
 assert.equal(p.projects[1].axes.git.state,'UNKNOWN');
});
test('all five axes keep unknown/no-deploy/decision review instead of fabricated DONE',()=>{
 const p=projectOfflineEvidence(fixture(),names,t);
 for(const row of p.projects){
  assert.deepEqual(Object.keys(row.axes),['development','git','deployment','decision','confidence']);
  assert.equal(row.axes.development.state,'UNKNOWN');
  assert.equal(row.axes.deployment.state,'NOT_VERIFIED');
  assert.equal(row.axes.decision.state,'HUMAN_REVIEW_REQUIRED');
  assert.notEqual(row.axes.confidence.state,'COMPLETED');
 }
 assert.doesNotMatch(JSON.stringify(p),/\bDONE\b|DEPLOYED|PRODUCTION_ACCEPTED/);
});
test('aging snapshot forces aging/stale evidence confidence even for verified Git HEAD',()=>{
 const p=projectOfflineEvidence(fixture(),names,t+80*3600000);
 assert.equal(p.freshness.state,'STALE');
 assert.equal(p.projects[0].axes.confidence.state,'EVIDENCE_AGING_OR_STALE');
 assert.equal(p.projects[1].axes.confidence.state,'EVIDENCE_AGING_OR_STALE');
});
test('missing/reordered or partial selected list fails closed',()=>{
 const wrong=fixture();wrong.coverage='PARTIAL';
 assert.throws(()=>projectOfflineEvidence(wrong,names,t),/selected/i);
 assert.throws(()=>projectOfflineEvidence(fixture(),names.slice().reverse(),t),/selected|identity|order/i);
 const missing=fixture();missing.projects.pop();
 assert.throws(()=>projectOfflineEvidence(missing,names,t));
});
test('unverified PR count stays null, never false zero; invalid time rejected',()=>{
 const a=projectOfflineEvidence(fixture(),names,t);
 assert.equal(a.projects[1].github.openPRs,null);
 assert.equal(a.projects[1].github.openIssues,3);
 assert.equal(a.projects[1].axes.confidence.state,'PARTIAL_GIT_EVIDENCE');
 assert.throws(()=>projectOfflineEvidence(fixture(),names,NaN));
});
test('non-identifying health output omits repository identifiers and open counts',()=>{
 const p=projectOfflineEvidence(fixture(),names,t);
 const healthy=projectionHealth(p);
 assert.deepEqual(healthy,{selected:2,inspected:2,freshness:'RECENT',
  hostDeployment:'NOT_VERIFIED',realPrivateBrowserAccess:'NOT_AUTHORIZED'});
 assert.doesNotMatch(JSON.stringify(healthy),/fictional-owner|sample-atlas|demo-orchard/);
});
test('public and synthetic HTTP runtime never import offline private evidence projection',()=>{
 const runtime=readFileSync(fileURLToPath(new URL('../tools/private-ui/auth-synthetic.mjs',import.meta.url)),'utf8');
 const webApp=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const projection=readFileSync(fileURLToPath(new URL('../tools/private-ui/offline-projection.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(runtime,/offline-projection\.mjs|readFileSync|decryptSnapshot|BWD_COMPASS_PRIVATE_DIR/);
 assert.doesNotMatch(webApp,/offline-projection|SELECTED_ENCRYPTED_GITHUB_SNAPSHOT|PRIVATE_LOCAL_PROJECTION/);
 assert.doesNotMatch(projection,/from ['"]node:(?:fs|http|https)|createServer\(|fetch\(|readFileSync\(/);
});
