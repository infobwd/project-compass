#!/usr/bin/env node
// PC-04D: Explicit owner-only local morning brief, never an unattended network collector.
// --summary emits no repository identifiers or task titles. --details requires typed DISPLAY.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {loadPrivateProjection} from '../private-ui/private-local.mjs';
import {readPrivateWorkplanFile} from './encrypted-workplan.mjs';
import {readTerminalLine} from './action-entry.mjs';
import {buildPrivateMorningBrief,summarizePrivateBrief} from './morning-brief.mjs';
import {formatPrivateCompactBrief} from './morning-brief-compact.mjs';

export async function runLocalMorningBrief(args=process.argv.slice(2),env=process.env){
 if(args.length===1&&args[0]==='--help')return {usage:'--summary | --compact | --details',network:false,writes:false};
 if(args.length!==1||!['--summary','--compact','--details'].includes(args[0]))
  throw Error('PC04D_INVALID_MODE');
 if(!env.BWD_COMPASS_PRIVATE_DIR||!process.stdin.isTTY)
  throw Error('PC04D_PRIVATE_TTY_AND_FOLDER_REQUIRED');
 const dir=privateDir(env);assertOutsideGit(dir);
 const password=await readTerminalLine('Private Snapshot/Workplan passphrase (not echoed): ',{secret:true,max:500});
 if(password.length<12)throw Error('PC04D_PRIVATE_OPERATION_FAILED');
 const projection=loadPrivateProjection(password,{directory:dir});
 const workplan=readPrivateWorkplanFile(projection,password,dir);
 const brief=buildPrivateMorningBrief(projection,workplan);
 const summary=summarizePrivateBrief(brief);
 if(args[0]==='--summary')return summary;
 process.stdout.write('WARNING: --details displays PRIVATE project names and task text in this local terminal.\n');
 process.stdout.write('Do not screen-share, redirect output to public files or paste into public GitHub.\n');
 const confirmation=await readTerminalLine('Type DISPLAY to view PRIVATE local details (anything else cancels): ',{max:16});
 if(confirmation.trim()!=='DISPLAY')return {mode:'DETAILS_CANCELLED',writes:false,privateDetailsShown:false};
 if(args[0]==='--compact'){
  process.stdout.write('\n'+formatPrivateCompactBrief(brief));
  return {mode:'DETAILS_DISPLAYED',writes:false,privateDetailsShown:true,compact:true};
 }
 // Details stay on owner's terminal only. No plaintext report file or web endpoint.
 process.stdout.write('\nPRIVATE LOCAL MORNING BRIEF — '+brief.dayBangkok+' (Asia/Bangkok)\n');
 process.stdout.write('Git Snapshot observed '+brief.github.observedAt+
   ' — '+brief.github.freshness+' / NOT LIVE / host status NOT INFERRED.\n');
 process.stdout.write('Owner TODO: '+brief.ownerPlan.openActions+
   '; overdue by Bangkok date: '+brief.ownerPlan.overdueActions+
   '; pending owner decisions: '+brief.ownerPlan.waitingDecision+'\n');
 if(brief.actualOpenActions.length===0)
  process.stdout.write('No owner-entered TODO yet; this DOES NOT mean all real projects are complete.\n');
 else for(const a of brief.actualOpenActions){
  process.stdout.write('\n['+a.priority+' / '+a.status+(a.overdue?' / OVERDUE':'')+'] '+a.repository+'\n');
  process.stdout.write('  Task: '+a.title+'\n');
  process.stdout.write('  Owner: '+a.owner+'; Due: '+(a.dueDate||'NOT_SET')+
   '; Due confidence: '+a.dateConfidence+'\n');
  if(a.nextStep)process.stdout.write('  Next: '+a.nextStep+'\n');
  if(a.reason)process.stdout.write('  Reason: '+a.reason+'\n');
 }
 process.stdout.write('\nOWNER REVIEW PROMPTS — not verified project work or fabricated tasks:\n');
 for(const r of brief.reviewPrompts)process.stdout.write('  '+r.repository+': '+r.missing.join(', ')+'\n');
 for(const b of brief.ownerRecordedBlockers)process.stdout.write('  OWNER BLOCKER '+b.repository+': '+b.items.join('; ')+'\n');
 if(brief.invalidDueDates.length)process.stdout.write('WARNING: some owner-entered dates are invalid. Correct locally before using overdue counts.\n');
 process.stdout.write('END — no writes / no live GitHub query / no public Pages export.\n');
 return {mode:'DETAILS_DISPLAYED',writes:false,privateDetailsShown:true,selected:brief.ownerPlan.projectCount};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runLocalMorningBrief().then(r=>{
 if(r.mode==='PRIVATE_MORNING_SUMMARY'){
  console.log('PC-04D PRIVATE LOCAL SUMMARY — NOT LIVE GITHUB');
  for(const [k,v] of Object.entries(r))if(k!=='mode')console.log(k+': '+v);
 }else if(r.mode!=='DETAILS_DISPLAYED'){
  console.log('PC-04D: '+r.mode+'; no private data persisted or exported.');
 }
}).catch(error=>{
 const safe=new Set(['PC04D_INVALID_MODE','PC04D_PRIVATE_TTY_AND_FOLDER_REQUIRED',
  'PC04B_TTY_REQUIRED','PC04B_INPUT_CANCELLED','PC04B_INPUT_CLOSED','PC04B_INPUT_UNAVAILABLE']);
 const code=safe.has(error?.message)?error.message:'PC04D_PRIVATE_OPERATION_FAILED';
 console.error('PC-04D stopped safely. Code: '+code+'; no report saved, GitHub write or Pages export.');
 process.exitCode=1;
});
