// PC-04E fictional-only saved Git snapshot proposal queue. NO live GitHub, owner writes or real identities.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan,prepareOwnerUpdate} from '../tools/private-plan/workplan-model.mjs';
import {buildPrivateReviewCandidates,summarizePrivateReviewCandidates} from '../tools/private-plan/review-candidates.mjs';
const NAME='fictional-owner/project-mock',AT='2026-11-01T00:00:00.000Z';
function fixture({prs=[{number:11,draft:true,headSha:'a'.repeat(40),base:'main'},
                           {number:12,draft:false,headSha:'b'.repeat(40),base:'main'}],
 issues=[4,9],prState='VERIFIED',issueState='VERIFIED',preserve=true}={}){
 const record={format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',observedAt:AT,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,
  projects:[{fullName:NAME,defaultBranch:'main',
   defaultHead:{state:'VERIFIED',sha:'c'.repeat(40)},
   openPRs:{state:prState,count:prState==='VERIFIED'?2:null,atLeast:2,items:prs},
   openIssues:{state:issueState,count:issueState==='VERIFIED'?2:null,atLeast:2,numbers:issues}}]};
 if(!preserve){record.projects[0].openPRs.items=undefined;record.projects[0].openIssues.numbers=undefined;}
 const p=projectOfflineEvidence(record,[NAME],Date.parse(AT)+3600000);
 return {p,w:createEmptyWorkplan(p,{at:AT})};
}
test('PC04E complete selected collections generate numbered proposals, never tasks or claimed priorities',()=>{
 const {p,w}=fixture(),record=buildPrivateReviewCandidates(p,w),summary=summarizePrivateReviewCandidates(record);
 assert.equal(record.selected,1);assert.equal(record.knownPRReferences,2);assert.equal(record.knownIssueReferences,2);
 assert.equal(record.suggestedItems.length,4);
 assert.deepEqual(record.suggestedItems.map(x=>[x.kind,x.number]),[
  ['REVIEW_OPEN_PR_AT_SNAPSHOT',12],['REVIEW_OPEN_PR_AT_SNAPSHOT',11],
  ['REVIEW_OPEN_ISSUE_AT_SNAPSHOT',9],['REVIEW_OPEN_ISSUE_AT_SNAPSHOT',4]]);
 assert.ok(record.suggestedItems.every(x=>x.ownerTaskCreated===false&&x.priority==='NOT_ASSESSED'&&x.hostVerified===false));
 assert.equal(w.projects[0].actions.length,0);
 assert.equal(summary.ownerTasksAdded,0);
 assert.equal(summary.liveGitHubChecked,false);
 assert.doesNotMatch(JSON.stringify(summary),/fictional-owner|project-mock/);
});
test('PC04E incomplete or forged enumeration FAIL CLOSED, even if counts appear verified',()=>{
 for(const [prs,issues] of [
  [[{number:11,draft:true,headSha:null,base:'main'}],[4,9]],
  [[{number:11,draft:true},{number:11,draft:false}],[4,9]],
  [[{number:11,draft:true},{number:12,draft:'yes'}],[4,9]],
  [[{number:11,draft:true},{number:12,draft:false}],[4,4]]
 ]){
  const {p,w}=fixture({prs,issues}),r=buildPrivateReviewCandidates(p,w);
  assert.ok(r.incompleteReferenceCollections>0);
  assert.ok(r.suggestedItems.every(x=>x.kind!=='REVIEW_OPEN_PR_AT_SNAPSHOT')||
    r.suggestedItems.every(x=>x.kind!=='REVIEW_OPEN_ISSUE_AT_SNAPSHOT'));
 }
});
test('PC04E missing enumeration never invents PR/Issue numbers from the aggregate count',()=>{
 const {p,w}=fixture({preserve:false}),r=buildPrivateReviewCandidates(p,w);
 assert.equal(r.suggestedItems.length,0);
 assert.equal(r.incompleteReferenceCollections,2);
 assert.equal(r.knownPRReferences,0);
 assert.equal(r.projects[0].enumeration,'PARTIAL_OR_UNKNOWN');
});
test('PC04E limit is per category, and old saved observedAt remains explicit',()=>{
 const {p,w}=fixture(),r=buildPrivateReviewCandidates(p,w,{perType:1});
 assert.equal(r.suggestedItems.length,2);
 assert.equal(r.projects[0].omittedReferences,1);
 assert.equal(r.projects[0].omittedIssueReferences,1);
 assert.equal(r.observedAt,AT);
 assert.equal(r.source,'SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE');
 assert.throws(()=>buildPrivateReviewCandidates(p,w,{perType:0}),/perType/);
});
test('PC04E owner TODO already recorded is not overwritten, duplicated or falsely assigned to a PR',()=>{
 const {p,w}=fixture(),record=prepareOwnerUpdate(w,p,NAME,{actions:[{
  id:'owner-real-review',title:'Owner review',status:'TODO',priority:'P2',owner:'HUMAN',
  dueDate:null,evidenceIds:[],nextStep:null,reason:null,updatedAt:'2026-11-01T00:01:00.000Z'
 }]},{at:'2026-11-01T00:01:00.000Z'});
 const before=JSON.stringify(record),r=buildPrivateReviewCandidates(p,record);
 assert.equal(record.projects[0].actions.length,1);
 assert.equal(r.projects[0].existingOwnerActions,1);
 assert.equal(r.ownerTasksAdded,0);
 assert.equal(JSON.stringify(record),before);
});
test('PC04E selected scope mismatch refuses proposals',()=>{
 const {p,w}=fixture(),bad=structuredClone(p);bad.projects[0].id='fictional-owner/other';
 assert.throws(()=>buildPrivateReviewCandidates(bad,w),/selected registry order mismatch/);
});
test('PC04E offline candidates never import network or public app and do not require live URLs',()=>{
 const model=readFileSync(fileURLToPath(new URL('../tools/private-plan/review-candidates.mjs',import.meta.url)),'utf8');
 const proj=readFileSync(fileURLToPath(new URL('../tools/private-ui/offline-projection.mjs',import.meta.url)),'utf8');
 const pub=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 assert.doesNotMatch(model,/node:http|node:fs|fetch\(|createServer\(|writeFileSync|commitOwnerRevision/);
 assert.doesNotMatch(proj,/fetch\(|createServer\(|writeFileSync/);
 assert.doesNotMatch(pub,/review-candidates|prReferences|issueNumbers/);
 assert.match(model,/ownerTasksAdded:0/);
});
