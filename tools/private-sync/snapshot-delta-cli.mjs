#!/usr/bin/env node
// PC-04I owner-local offline snapshot delta. No GitHub HTTP, file writes or browser upload.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from './sync.mjs';
import {readTerminalLine} from '../private-plan/action-entry.mjs';
import {readActivatedSnapshotDelta} from './activated-snapshot-delta.mjs';
const ID=/^[a-f0-9]{24}$/;
function args(argv){
 if(argv.length===1&&argv[0]==='--help')return {mode:'HELP'};
 if(argv.length===3&&['--summary','--details'].includes(argv[0])&&
    argv[1]==='--stage-id'&&ID.test(argv[2]))
  return {mode:argv[0].slice(2).toUpperCase(),stageId:argv[2]};
 throw Error('PC04I_INVALID_ARGUMENTS');
}
export async function runSnapshotDeltaCLI(argv=process.argv.slice(2),env=process.env,{
 terminal=readTerminalLine}={}){
 const command=args(argv);
 if(command.mode==='HELP')return {mode:'HELP',usage:'--summary --stage-id ID | --details --stage-id ID'};
 if(!process.stdin.isTTY||typeof env.BWD_COMPASS_PRIVATE_DIR!=='string')
  throw Error('PC04I_TRUSTED_TERMINAL_REQUIRED');
 const folder=privateDir(env);
 assertOutsideGit(folder);
 const passphrase=await terminal('Existing Snapshot/workplan passphrase (hidden): ',{secret:true,max:500});
 if(typeof passphrase!=='string'||passphrase.length<12)throw Error('PC04I_PRIVATE_ACCESS_FAILED');
 const data=readActivatedSnapshotDelta({folder,passphrase,stageId:command.stageId});
 const summary=data.summary;
 console.log('PC-04I PRIVATE LOCAL SAVED DELTA - NOT GitHub Live');
 console.log('Previous observation: '+summary.previousObservedAt);
 console.log('Current observation: '+summary.currentObservedAt);
 console.log('Selected repositories: '+summary.selected);
 console.log('Previously/open now PRs: '+summary.totals.oldOpenPRs+' -> '+summary.totals.newOpenPRs);
 console.log('PRs newly observed OPEN: '+summary.totals.prsNewlyObservedOpen);
 console.log('PRs no longer observed OPEN: '+summary.totals.prsNoLongerObservedOpen);
 console.log('Previously/open now Issues: '+summary.totals.oldOpenIssues+' -> '+summary.totals.newOpenIssues);
 console.log('Issues newly observed OPEN: '+summary.totals.issuesNewlyObservedOpen);
 console.log('Issues no longer observed OPEN: '+summary.totals.issuesNoLongerObservedOpen);
 console.log('Default Git HEAD changed (two verified): '+summary.totals.defaultHeadsChanged);
 console.log('Default Git HEAD not comparable: '+summary.totals.defaultHeadsNotComparable);
 console.log('Shared open PR HEAD changed: '+summary.totals.prHeadChangedWhenBothObservedOpen);
 console.log('Encrypted old backup verified: '+data.backupDigestVerified);
 console.log('Active snapshot matches staged envelope: '+data.activeMatchesActivatedStage);
 console.log('Owner workplan read-valid for both: '+data.ownerWorkplanValidatedBoth);
 console.log('No GitHub queries, writes, task changes, Host/Production/merge/completion proof.');
 if(command.mode==='DETAILS'){
  console.log('WARNING: the next section may show PRIVATE project names and saved PR/Issue numbers locally.');
  console.log('Never screen-share or paste this private detail into a PUBLIC GitHub issue.');
  const confirmed=await terminal('Type DISPLAY exactly to view PRIVATE per-project delta: ',{max:16});
  if(confirmed!=='DISPLAY')return {mode:'PC04I_DETAILS_CANCELLED',writes:false,network:false};
  console.log('--- PRIVATE SELECTED REPOSITORY DELTA (NOT LIVE) ---');
  for(const p of data.diff.projects){
   console.log(p.repository+' | PR '+p.openPRs.previous+' -> '+p.openPRs.current+
    ' | Issue '+p.openIssues.previous+' -> '+p.openIssues.current);
   console.log('PR newly observed OPEN: '+(p.openPRs.nowObservedOpen.join(',')||'-'));
   console.log('PR no longer observed OPEN (NOT merge proof): '+(p.openPRs.noLongerObservedOpen.join(',')||'-'));
   console.log('Issue newly observed OPEN: '+(p.openIssues.nowObservedOpen.join(',')||'-'));
   console.log('Issue no longer observed OPEN (NOT closed proof): '+(p.openIssues.noLongerObservedOpen.join(',')||'-'));
   console.log('Default HEAD changed: '+(p.git.defaultHeadChanged===null?'UNKNOWN':p.git.defaultHeadChanged)+
    '; PR HEAD changes: '+p.git.prHeadChangedWhenBothObservedOpen);
  }
 }
 return {mode:command.mode==='DETAILS'?'PC04I_PRIVATE_DETAILS_DISPLAYED':'PC04I_SUMMARY_ONLY',
  selected:summary.selected,oldBackupVerified:true,ownerTasksAdded:0,
  writes:false,network:false,mergeInferred:false,hostVerified:false};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runSnapshotDeltaCLI().then(r=>{
 if(r.mode==='HELP')console.log('PC-04I usage: '+r.usage);
 else console.log('PC-04I: '+r.mode+' | writes: false | network: false | owner tasks added: 0');
}).catch(error=>{
 const safe=new Set(['PC04I_INVALID_ARGUMENTS','PC04I_TRUSTED_TERMINAL_REQUIRED','PC04I_PRIVATE_ACCESS_FAILED']);
 const cause=/^PC04I_REFUSED_[A-Z0-9_]{1,80}$/.test(error?.message||'')?error.message:
   safe.has(error?.message)?error.message:'PC04I_PRIVATE_DELTA_REFUSED';
 console.error('PC-04I stopped safely: '+cause+'; no report saved, no GitHub/owner writes.');
 process.exitCode=1;
});
