#!/usr/bin/env node
// PC-04K: explicit owner-private reviewed Delta -> encrypted TODO, never browser POST.
// Only GET GitHub on this owner-controlled Windows machine. No GitHub writes/merge/deploy.
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {loadPrivateProjection} from '../private-ui/private-local.mjs';
import {inspectRevision,commitOwnerRevision} from './workplan-revision.mjs';
import {summarizeWorkplan} from './workplan-model.mjs';
import {readTerminalLine} from './action-entry.mjs';
import {readActivatedSnapshotDelta} from '../private-sync/activated-snapshot-delta.mjs';
import {selectOwnerDeltaReference,validateCurrentGithubRead,
 prepareOwnerReviewedDeltaAction} from './delta-action-handoff.mjs';

const ID=/^[a-f\d]{24}$/i,INDEX=/^(?:[1-9]|[1-3][0-9]|40)$/,NUM=/^[1-9]\d{0,8}$/;
function stop(ok,why){if(!ok)throw Error(why);}
export function parseDeltaActionArgs(argv){
 if(argv.length===1&&argv[0]==='--help')return {help:true};
 if(argv.length!==11||!['--review-only','--add-action'].includes(argv[0])||
  argv[1]!=='--stage-id'||!ID.test(argv[2])||
  argv[3]!=='--project-index'||!INDEX.test(argv[4])||
  argv[5]!=='--kind'||!['PR','ISSUE'].includes(argv[6])||
  argv[7]!=='--change'||!['NEW_OPEN','NO_LONGER_OPEN'].includes(argv[8])||
  argv[9]!=='--number'||!NUM.test(argv[10]))
  throw Error('PC04K_INVALID_ARGUMENTS');
 return {operation:argv[0],stageId:argv[2],projectIndex:Number(argv[4])-1,
  kind:argv[6],change:argv[8],number:Number(argv[10])};
}
export function readOnlyGithubReference(reference,{spawn=spawnSync,at=new Date().toISOString()}={}){
 const endpoint='repos/'+reference.repository+'/'+
  (reference.kind==='PR'?'pulls/':'issues/')+reference.number;
 const result=spawn('gh',['api','-X','GET',endpoint],{
  encoding:'utf8',windowsHide:true,timeout:25000,maxBuffer:1024*1024*2
 });
 stop(!result.error&&result.status===0,'PC04K_GITHUB_READ_FAILED');
 let parsed;
 try{parsed=JSON.parse(result.stdout);}catch{throw Error('PC04K_GITHUB_RESPONSE_INVALID');}
 return validateCurrentGithubRead(parsed,reference,{at});
}
async function visible(prompt,max=500,terminal=readTerminalLine){
 return (await terminal(prompt,{max})).trim();
}
function printObservation(reference,observed){
 console.log('PC-04K LOCAL REVIEW — SAVED DELTA + READ-ONLY LIVE GITHUB');
 console.log('Selected registry index: '+(reference.projectIndex+1));
 console.log('Reference: '+reference.kind+' #'+reference.number+' / '+reference.change);
 console.log('Saved time window: '+reference.savedBefore+' -> '+reference.savedAfter);
 console.log('Current GitHub API result: '+observed.status+' at '+observed.observedAt);
 console.log('This GitHub read does NOT verify Host, deployment, tests, or project completion.');
 console.log('NO owner TODO will be saved without REVIEWED and a separate CONFIRM.');
}
export async function runPrivateDeltaActionCLI(argv=process.argv.slice(2),env=process.env,{
 terminal=readTerminalLine,githubGET=readOnlyGithubReference,
 clock=()=>new Date().toISOString()
}={}){
 const args=parseDeltaActionArgs(argv);
 if(args.help)return {mode:'HELP',usage:
  '--review-only|--add-action --stage-id ID --project-index N --kind PR|ISSUE --change NEW_OPEN|NO_LONGER_OPEN --number N'};
 stop(process.stdin.isTTY&&typeof env.BWD_COMPASS_PRIVATE_DIR==='string','PC04K_TRUSTED_TERMINAL_REQUIRED');
 const dir=privateDir(env);assertOutsideGit(dir);
 const passphrase=await terminal('Existing encrypted Snapshot/workplan passphrase (hidden): ',{secret:true,max:500});
 stop(typeof passphrase==='string'&&passphrase.length>=12,'PC04K_PRIVATE_ACCESS_FAILED');
 const projection=loadPrivateProjection(passphrase,{directory:dir});
 const {plan,digest}=inspectRevision(dir,passphrase,projection);
 const verifiedDelta=readActivatedSnapshotDelta({folder:dir,passphrase,stageId:args.stageId});
 const reference=selectOwnerDeltaReference(verifiedDelta.diff,projection,plan,args);
 const observed=githubGET(reference,{at:clock()});
 printObservation(reference,observed);
 if(args.operation==='--review-only')
  return {mode:'PC04K_READ_ONLY_REVIEW',writes:false,githubWrite:false,ownerTasksAdded:0};
 console.log('Open the PR/Issue on GitHub yourself and confirm its current state, dependencies and tests.');
 console.log('If you cannot personally verify it, type anything other than REVIEWED to cancel.');
 const reviewed=await visible('Type REVIEWED if you checked the current GitHub PR/Issue yourself: ',16,terminal);
 if(reviewed!=='REVIEWED')return {mode:'PC04K_CANCELLED_NOT_REVIEWED',writes:false};
 const title=await visible('Next action title (3..300 characters): ',300,terminal);
 const priority=(await visible('Your priority P0/P1/P2/P3: ',2,terminal)).toUpperCase();
 const owner=(await visible('Responsible HUMAN / AI_ASSIST: ',9,terminal)).toUpperCase();
 const due=await visible('Due date YYYY-MM-DD (blank if unknown): ',10,terminal);
 const nextStep=await visible('Concrete next step (optional): ',500,terminal);
 const reason=await visible('Reason / evidence gap (optional): ',300,terminal);
 const at=new Date(Math.max(Date.parse(clock()),Date.parse(plan.updatedAt)+1,
  Date.parse(observed.observedAt)+1)).toISOString();
 const prepared=prepareOwnerReviewedDeltaAction({
  delta:verifiedDelta.diff,projection,workplan:plan,reference:args,
  githubObservation:observed,manualReviewed:true,
  title,priority,owner,dueDate:due||null,
  nextStep:nextStep||null,reason:reason||null,
  id:'action-'+randomBytes(8).toString('hex'),
  evidenceId:'review-'+randomBytes(8).toString('hex'),at
 });
 const p=prepared.preview;
 console.log('PRIVATE OWNER PREVIEW (NOT SAVED):');
 console.log('Selected index '+(args.projectIndex+1)+', '+p.kind+' #'+p.number+
  ', saved event '+p.savedDeltaChange);
 console.log('Current GitHub observation: '+p.githubReadStatus+'; Host/Production NOT VERIFIED.');
 console.log('Title: '+p.title+'; priority: '+p.priority+'; owner: '+p.owner);
 console.log('Due date: '+(p.dueDate||'UNKNOWN')+'; task status: TODO');
 console.log('A separate owner-review evidence entry is linked to this TODO, not Host evidence.');
 const confirm=await visible('Type CONFIRM exactly to save an ENCRYPTED backup and workplan revision: ',16,terminal);
 if(confirm!=='CONFIRM')return {mode:'PC04K_CANCELLED_UNSAVED',writes:false};
 const committed=commitOwnerRevision({directory:dir,passphrase,projection,
  before:plan,after:prepared.revised,expectedDigest:digest,confirmed:true});
 const updated=summarizeWorkplan(prepared.revised,projection);
 return {mode:'PC04K_OWNER_REVIEWED_ENCRYPTED_TODO_SAVED',
  saved:committed.saved,encryptedBackupCreated:committed.encryptedBackupCreated,
  selected:updated.repositories,ownerTasksAdded:1,
  githubWrite:false,hostVerified:false,projectDone:false};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runPrivateDeltaActionCLI().then(result=>{
 if(result.mode==='HELP')console.log('PC-04K private handoff: '+result.usage);
 else{
  console.log('PC-04K PRIVATE LOCAL: '+result.mode);
  for(const [key,val] of Object.entries(result))if(key!=='mode')console.log(key+': '+val);
  console.log('No Github write, Public Pages upload, Merge, Deploy or automatic DONE.');
 }
}).catch(error=>{
 const allow=new Set(['PC04K_INVALID_ARGUMENTS','PC04K_TRUSTED_TERMINAL_REQUIRED',
  'PC04K_PRIVATE_ACCESS_FAILED','PC04K_GITHUB_READ_FAILED','PC04K_GITHUB_RESPONSE_INVALID']);
 const reason=typeof error?.message==='string'&&
  /^PC04K_REFUSED_[A-Z0-9_]{1,72}$/.test(error.message)?error.message:
  allow.has(error?.message)?error.message:'PC04K_PRIVATE_ACTION_REFUSED';
 console.error('PC-04K refused safely: '+reason+'. No GitHub write or automatic TODO.');
 process.exitCode=1;
});
