#!/usr/bin/env node
// PC-04A PRIVATE-ONLY create/read CLI. No GitHub writes, no browser, no stdout repo names.
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {loadPrivateProjection} from '../private-ui/private-local.mjs';
import {createEmptyWorkplan,summarizeWorkplan} from './workplan-model.mjs';
import {WORKPLAN_FILE,createPrivateWorkplanFile,readPrivateWorkplanFile} from './encrypted-workplan.mjs';
async function hiddenInput(message){
 if(!process.stdin.isTTY||!process.stdin.setRawMode)throw Error('Interactive PowerShell terminal required');
 return new Promise((yes,no)=>{
  let value='';
  const done=(error)=>{process.stdin.off('data',listener);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');error?no(error):yes(value);};
  const listener=(chunk)=>{for(const c of chunk){
   if(c==='\r'||c==='\n'){done();return;}
   if(c==='\u0003'){done(Error('Cancelled'));return;}
   if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);continue;}
   if(c>=' ')value+=c;
  }};
  process.stdout.write(message);process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');process.stdin.resume();process.stdin.on('data',listener);
 });
}
export async function runPrivateWorkplanCLI(args=process.argv.slice(2),env=process.env){
 const valid=['--check','--init','--summary'];
 if(args.length!==1||!valid.includes(args[0]))throw Error('Usage: node tools/private-plan/workplan-cli.mjs --check | --init | --summary');
 if(!env.BWD_COMPASS_PRIVATE_DIR)throw Error('Set BWD_COMPASS_PRIVATE_DIR to a private absolute directory outside Git');
 const folder=privateDir(env);assertOutsideGit(folder);
 if(args[0]==='--check'){
  return {mode:'CHECK',privateDirSet:true,workplanExists:existsSync(join(folder,WORKPLAN_FILE)),
   writes:false,privateBrowserDataExported:false};
 }
 if(!process.stdin.isTTY)throw Error('Explicit terminal authorization required');
 const pass=await hiddenInput('Existing encrypted Snapshot passphrase (not echoed): ');
 if(pass.length<12)throw Error('Passphrase too short');
 const projection=loadPrivateProjection(pass,{directory:folder});
 if(args[0]==='--init'){
  // This initializes all project statuses to UNKNOWN/NOT_VERIFIED; no invented tasks or approvals.
  const plan=createEmptyWorkplan(projection);
  createPrivateWorkplanFile(plan,projection,pass,folder); 
  return {mode:'INIT',selected:plan.projects.length,created:true,
   states:'UNKNOWN / NOT_VERIFIED',nextActionsConfirmed:0,overwrite:false,
   privateBrowserDataExported:false};
 }
 const plan=readPrivateWorkplanFile(projection,pass,folder);
 const sum=summarizeWorkplan(plan,projection);
 return {mode:'SUMMARY',selected:sum.repositories,ownerReviewed:sum.ownerReviewed,
  openActions:sum.openActions,overdueActions:sum.overdueActions,
  decisionsPending:sum.waitingDecision,
  hostReviewedByOwner:sum.hostReviewedByOwner,
  snapshotFreshness:sum.githubSnapshotFreshness,
  privateBrowserDataExported:false};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runPrivateWorkplanCLI().then(result=>{
 console.log('PC-04A PRIVATE-LOCAL: '+result.mode);
 for(const [k,v] of Object.entries(result))if(k!=='mode')console.log(k+': '+v);
 console.log('No live GitHub data, deployment claim or public upload.');
}).catch(()=>{console.error('PC-04A private workplan operation failed. Check folder, passphrase, existing file and scope.');process.exitCode=1;});
