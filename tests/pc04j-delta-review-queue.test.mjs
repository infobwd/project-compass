// PC-04J synthetic-only model tests: no real repository names or filesystem changes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {compareSelectedSnapshots} from '../tools/private-sync/snapshot-delta.mjs';
import {buildPrivateDeltaReviewPage} from '../tools/private-plan/delta-review-queue.mjs';

const NAME='fictional-owner/review-lab',SHA='a'.repeat(40),OLDER='2026-11-01T00:00:00.000Z',
 NEWER='2026-11-01T01:00:00.000Z';
function snapshot(fresh){
 const prs=fresh?Array.from({length:26},(_,i)=>i+20):Array.from({length:25},(_,i)=>i+1);
 const issues=fresh?[12,13]:[11,12];
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:'fictional-owner',
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:1,matched:1},
  inspectedRepositories:1,observedAt:fresh?NEWER:OLDER,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:prs.length,atLeast:prs.length,
    items:prs.map(number=>({number,draft:number%2===0,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:issues.length,atLeast:issues.length,numbers:issues}}]};
}
function fx(){
 const old=snapshot(false),fresh=snapshot(true);
 const projection=projectOfflineEvidence(fresh,[NAME],Date.parse(NEWER)+30000);
 const plan=createEmptyWorkplan(projection,{at:NEWER});
 return {delta:compareSelectedSnapshots(old,fresh,[NAME]),projection,plan};
}
function page(f,o){return buildPrivateDeltaReviewPage(f.delta,f.projection,f.plan,o)}
test('PC04J 20 newly open PRs span exactly two 10-item pages without lost numbers',()=>{
 const f=fx(),opts={projectIndex:0,kind:'PR',change:'NEW_OPEN'};
 const first=page(f,{...opts,page:0}),second=page(f,{...opts,page:1});
 assert.equal(first.total,20);assert.equal(first.pages,2);
 assert.deepEqual([first.items.length,second.items.length],[10,10]);
 assert.deepEqual([...first.items,...second.items].map(x=>x.number),
  Array.from({length:20},(_,i)=>45-i));
 assert.equal(first.source,'TWO_SAVED_ENCRYPTED_GITHUB_OPEN_LISTS_NOT_LIVE');
 assert.ok(first.items.every(x=>x.priority==='NOT_ASSESSED'&&x.ownerTaskCreated===false));
 assert.equal(f.plan.projects[0].actions.length,0);
});
test('PC04J no longer open is NOT merged, closed or completed; IDs remain distinct',()=>{
 const f=fx(),opts={projectIndex:0,kind:'PR',change:'NO_LONGER_OPEN'};
 const first=page(f,{...opts,page:0}),second=page(f,{...opts,page:1});
 assert.equal(first.total,19);
 assert.deepEqual([first.items.length,second.items.length],[10,9]);
 assert.deepEqual([...first.items,...second.items].map(x=>x.number),
  Array.from({length:19},(_,i)=>19-i));
 assert.equal(first.mergeInferred,false);assert.equal(first.closeInferred,false);
 assert.equal(first.deployInferred,false);assert.equal(first.ownerTasksAdded,0);
});
test('PC04J issues maintain their own change categories',()=>{
 const f=fx(),base={projectIndex:0,kind:'ISSUE',page:0};
 const added=page(f,{...base,change:'NEW_OPEN'});
 const lost=page(f,{...base,change:'NO_LONGER_OPEN'});
 assert.deepEqual(added.items.map(x=>x.number),[13]);
 assert.deepEqual(lost.items.map(x=>x.number),[11]);
 assert.ok(added.items.every(x=>x.kind==='ISSUE'));
 assert.equal(lost.ownerTasksAdded,0);
});
test('PC04J invalid scope, kind, direction and page fail closed',()=>{
 const f=fx(),valid={projectIndex:0,kind:'PR',change:'NEW_OPEN',page:0};
 for(const wrong of [
  {projectIndex:1},{projectIndex:-1},{kind:'TASK'},{change:'MERGED'},
  {page:-1},{page:2},{page:50},{pageSize:21}
 ])assert.throws(()=>page(f,{...valid,...wrong}),/PC04J_REVIEW_REFUSED_/);
});
test('PC04J selection mismatch and fabricated/colliding deltas are refused',()=>{
 const f=fx(),valid={projectIndex:0,kind:'PR',change:'NEW_OPEN',page:0};
 const mutations=[
  d=>{d.selected=2;},d=>{d.projects[0].repository='fictional-owner/not-selected';},
  d=>{d.projects[0].openPRs.nowObservedOpen[1]=d.projects[0].openPRs.nowObservedOpen[0];},
  d=>{d.projects[0].openPRs.noLongerObservedOpen[0]=d.projects[0].openPRs.nowObservedOpen[0];},
  d=>{d.projects[0].openPRs.current+=1;},d=>{d.mergeInferred=true;}
 ];
 for(const mutate of mutations){
  const x=structuredClone(f.delta);mutate(x);
  assert.throws(()=>buildPrivateDeltaReviewPage(x,f.projection,f.plan,valid),/PC04J_REVIEW_REFUSED_/);
 }
});
test('PC04J does not write, rank or mutate real owner workplan when paginating',()=>{
 const f=fx(),before=JSON.stringify(f.plan),delta=JSON.stringify(f.delta);
 for(let index=0;index<2;index++)
  page(f,{projectIndex:0,kind:'PR',change:'NEW_OPEN',page:index});
 assert.equal(JSON.stringify(f.plan),before);
 assert.equal(JSON.stringify(f.delta),delta);
});
