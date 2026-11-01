// PC-04K — strictly fictional local review-to-encrypted-action model and GET-only transport tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from '../tools/private-ui/offline-projection.mjs';
import {createEmptyWorkplan} from '../tools/private-plan/workplan-model.mjs';
import {compareSelectedSnapshots} from '../tools/private-sync/snapshot-delta.mjs';
import {selectOwnerDeltaReference,validateCurrentGithubRead,
 prepareOwnerReviewedDeltaAction} from '../tools/private-plan/delta-action-handoff.mjs';
import {parseDeltaActionArgs,readOnlyGithubReference} from '../tools/private-plan/delta-action-cli.mjs';

const OWNER='fictional-owner',NAME=OWNER+'/fictional-review-lab',OLD='2026-11-01T00:00:00.000Z',
 NEW='2026-11-01T01:00:00.000Z',LIVE='2026-11-01T02:00:00.000Z',
 SAVE='2026-11-01T02:00:01.000Z',SHA='a'.repeat(40);
function saved(fresh){
 const prs=fresh?[12,13]:[11,12],issues=fresh?[4,6]:[4,5];
 return {format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:1,matched:1},inspectedRepositories:1,observedAt:fresh?NEW:OLD,
  projects:[{fullName:NAME,defaultBranch:'main',defaultHead:{state:'VERIFIED',sha:SHA},
   openPRs:{state:'VERIFIED',count:prs.length,atLeast:prs.length,items:prs.map(number=>({
    number,draft:false,headSha:SHA,base:'main'}))},
   openIssues:{state:'VERIFIED',count:issues.length,atLeast:issues.length,numbers:issues}}]};
}
function fixture(){
 const before=saved(false),after=saved(true),scope=[NAME];
 const projection=projectOfflineEvidence(after,scope,Date.parse(NEW)+1000);
 const workplan=createEmptyWorkplan(projection,{at:NEW});
 return {delta:compareSelectedSnapshots(before,after,scope),projection,workplan};
}
const sourceRef={projectIndex:0,kind:'PR',change:'NEW_OPEN',number:13};
const ghPR=(number=13,state='open',merged_at=null)=>({
 number,html_url:'https://github.com/'+NAME+'/pull/'+number,state,merged_at,
 draft:false,head:{sha:SHA},base:{repo:{full_name:NAME},ref:'main'}});
const ghIssue=(number=6)=>({number,html_url:'https://github.com/'+NAME+'/issues/'+number,
 state:'open',repository_url:'https://api.github.com/repos/'+NAME});
function prepared(f,{reference=sourceRef,observation,manualReviewed=true,at=SAVE}={}){
 const picked=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,reference);
 const live=observation||validateCurrentGithubRead(ghPR(),picked,{at:LIVE});
 return prepareOwnerReviewedDeltaAction({delta:f.delta,projection:f.projection,workplan:f.workplan,
  reference,githubObservation:live,manualReviewed,title:'Review implementation before next integration',
  priority:'P2',owner:'HUMAN',dueDate:null,nextStep:'Check test evidence',reason:'Needs review',
  id:'action-'+'a'.repeat(16),evidenceId:'review-'+'b'.repeat(16),at});
}
test('PC04K selected repo + exact changed PR must exist in fully verified saved delta',()=>{
 const f=fixture();
 const pr=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,sourceRef);
 assert.equal(pr.repository,NAME);assert.equal(pr.number,13);
 assert.equal(pr.evidence,'SAVED_OPEN_LIST_DELTA_NOT_GITHUB_LIVE');
 const older=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,{
  projectIndex:0,kind:'PR',change:'NO_LONGER_OPEN',number:11});
 assert.equal(older.number,11);
 assert.equal(older.mergedInferred,false);
 for(const change of [{number:99},{kind:'ISSUE'}, {change:'NO_LONGER_OPEN'},
   {projectIndex:1}, {number:0}])
  assert.throws(()=>selectOwnerDeltaReference(f.delta,f.projection,f.workplan,
    {...sourceRef,...change}),/PC04K_REFUSED_|PC04J_REVIEW_REFUSED_/);
});
test('PC04K live read validates PR identity and state but not Host/Production',()=>{
 const f=fixture(),reference=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,sourceRef);
 const observed=validateCurrentGithubRead(ghPR(),reference,{at:LIVE});
 assert.equal(observed.status,'OPEN_AT_GITHUB_READ_TIME');
 assert.equal(observed.githubReadOnly,true);assert.equal(observed.hostVerified,false);
 assert.equal(observed.completionVerified,false);
 const merged=validateCurrentGithubRead(ghPR(13,'closed','2026-11-01T01:59:00.000Z'),
  reference,{at:LIVE});
 assert.equal(merged.status,'MERGED_AS_REPORTED_BY_GITHUB_API');
 assert.equal(merged.hostVerified,false);
 const bad=ghPR(13);bad.base.repo.full_name='other-owner/other-repo';
 assert.throws(()=>validateCurrentGithubRead(bad,reference,{at:LIVE}),/PC04K_REFUSED_GITHUB_REPO/);
 assert.throws(()=>validateCurrentGithubRead(ghPR(99),reference,{at:LIVE}),/GITHUB_NUMBER/);
});
test('PC04K issue endpoint rejects a PR issue and fabricated URL',()=>{
 const f=fixture(),reference=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,
  {projectIndex:0,kind:'ISSUE',change:'NEW_OPEN',number:6});
 const result=validateCurrentGithubRead(ghIssue(),reference,{at:LIVE});
 assert.equal(result.status,'OPEN_AT_GITHUB_READ_TIME');
 const prAsIssue={...ghIssue(),pull_request:{url:'https://api.github.com'}};
 assert.throws(()=>validateCurrentGithubRead(prAsIssue,reference,{at:LIVE}),/ISSUE_IS_ACTUALLY_PR/);
 assert.throws(()=>validateCurrentGithubRead({...ghIssue(),html_url:'https://attacker.invalid'},
  reference,{at:LIVE}),/GITHUB_IDENTITY_URL/);
});
test('PC04K no owner acknowledgement => no planned write',()=>{
 const f=fixture(),before=JSON.stringify(f.workplan);
 assert.throws(()=>prepared(f,{manualReviewed:false}),/OWNER_REVIEW_ACK/);
 assert.equal(JSON.stringify(f.workplan),before);
});
test('PC04K manual reviewed task produces strictly private TODO plus OWNER_REVIEW evidence',()=>{
 const f=fixture(),before=JSON.stringify(f.workplan);
 const output=prepared(f);
 const project=output.revised.projects[0];
 assert.equal(project.actions.length,1);assert.equal(project.evidence.length,1);
 assert.equal(project.actions[0].status,'TODO');assert.equal(project.actions[0].priority,'P2');
 assert.equal(project.actions[0].owner,'HUMAN');
 assert.deepEqual(project.actions[0].evidenceIds,[project.evidence[0].id]);
 assert.equal(project.evidence[0].kind,'OWNER_REVIEW');
 assert.equal(project.evidence[0].recordedBy,'OWNER');
 assert.equal(project.evidence[0].ref,'https://github.com/'+NAME+'/pull/13');
 assert.equal(output.preview.saved,false);
 assert.equal(output.preview.encryptedSaveRequiresSeparateConfirm,true);
 assert.equal(output.preview.hostVerified,false);assert.equal(output.preview.mergeAutomaticallyInferred,false);
 assert.equal(JSON.stringify(f.workplan),before);
});
test('PC04K duplicate reference handoff, wrong GitHub observation and malformed P0..P3 fail closed',()=>{
 const f=fixture(),output=prepared(f);
 const duplicate={...f,workplan:output.revised};
 assert.throws(()=>prepared(duplicate,{at:'2026-11-01T02:01:00.000Z'}),/EXISTING_ACTION_FOR_REFERENCE/);
 const wrong={...validateCurrentGithubRead(ghPR(),
  selectOwnerDeltaReference(f.delta,f.projection,f.workplan,sourceRef),{at:LIVE}),number:999};
 assert.throws(()=>prepared(f,{observation:wrong}),/GITHUB_EVIDENCE_MISMATCH/);
 assert.throws(()=>prepareOwnerReviewedDeltaAction({delta:f.delta,projection:f.projection,
  workplan:f.workplan,reference:sourceRef,
  githubObservation:validateCurrentGithubRead(ghPR(),
   selectOwnerDeltaReference(f.delta,f.projection,f.workplan,sourceRef),{at:LIVE}),
  manualReviewed:true,title:'Fake task',priority:'P9',owner:'HUMAN',
  id:'action-'+'a'.repeat(16),evidenceId:'review-'+'b'.repeat(16),at:SAVE}),/PRIORITY_OR_OWNER/);
});
test('PC04K strict CLI args reject unselected/freeform/invalid numbers and allow help',()=>{
 assert.equal(parseDeltaActionArgs(['--help']).help,true);
 const args=['--review-only','--stage-id','c'.repeat(24),'--project-index','1',
  '--kind','PR','--change','NEW_OPEN','--number','13'];
 const valid=parseDeltaActionArgs(args);
 assert.equal(valid.projectIndex,0);assert.equal(valid.number,13);
 for(const invalid of [
  args.slice(0,-1).concat('0'),args.slice(0,-1).concat('-1'),
  args.slice(0,-1).concat('13;rm -rf /'),
  args.slice(0,3).concat(['--project-index','41',...args.slice(5)]),
  args.slice(0,7).concat(['--change','MERGED',...args.slice(9)])
 ])assert.throws(()=>parseDeltaActionArgs(invalid),/PC04K_INVALID_ARGUMENTS/);
});
test('PC04K GitHub transport is GET only and never invokes shell or GitHub write',()=>{
 const f=fixture(),ref=selectOwnerDeltaReference(f.delta,f.projection,f.workplan,sourceRef);
 const calls=[];
 const result=readOnlyGithubReference(ref,{at:LIVE,spawn:(bin,args,opts)=>{
  calls.push({bin,args,opts});return {status:0,stdout:JSON.stringify(ghPR())};
 }});
 assert.equal(result.status,'OPEN_AT_GITHUB_READ_TIME');
 assert.deepEqual(calls[0].args,['api','-X','GET','repos/'+NAME+'/pulls/13']);
 assert.equal(calls[0].bin,'gh');assert.equal(calls[0].opts.windowsHide,true);
 assert.throws(()=>readOnlyGithubReference(ref,{spawn:()=>({status:1,stdout:'PRIVATE!'}),
  at:LIVE}),/PC04K_GITHUB_READ_FAILED/);
});
test('PC04K public App and private browser never import owner-reviewed write flow',()=>{
 const pub=readFileSync(fileURLToPath(new URL('../src/App.tsx',import.meta.url)),'utf8');
 const server=readFileSync(fileURLToPath(new URL('../tools/private-ui/private-local.mjs',import.meta.url)),'utf8');
 const cli=readFileSync(fileURLToPath(new URL('../tools/private-plan/delta-action-cli.mjs',import.meta.url)),'utf8');
 assert.doesNotMatch(pub,/delta-action-cli|delta-action-handoff|PC04K/);
 // UI may DISPLAY a terminal command, but must not import or execute its writer.
 const privateServerImports=server.split('\n').filter(line=>/^\s*import\s/.test(line)).join('\n');
 assert.doesNotMatch(privateServerImports,/delta-action-cli|delta-action-handoff/);
 assert.doesNotMatch(server,/\bimport\s*\(\s*['"][^'"]*(?:delta-action-cli|delta-action-handoff)\.mjs/);
 assert.doesNotMatch(server,/commitOwnerRevision\s*\(/);
 assert.match(server,/delta-action-cli\.mjs --review-only --stage-id \$stageId/);
 assert.match(server,/ต้องการรับงานจริง ให้เจ้าของใช้ --add-action/);
 assert.match(cli,/confirmed:true/);assert.match(cli,/reviewed!=='REVIEWED'/);
 assert.match(cli,/confirm!=='CONFIRM'/);
 assert.match(cli,/'api','-X','GET'/);
});
