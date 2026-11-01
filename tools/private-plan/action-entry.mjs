#!/usr/bin/env node
// PC-04B — local, owner-driven action entry. Does not write until CONFIRM.
import {createInterface} from 'node:readline/promises';
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {loadPrivateProjection} from '../private-ui/private-local.mjs';
import {prepareOwnerUpdate,summarizeWorkplan} from './workplan-model.mjs';
import {inspectRevision,commitOwnerRevision} from './workplan-revision.mjs';

function hiddenInput(message){
 if(!process.stdin.isTTY||typeof process.stdin.setRawMode!=='function')throw Error('Interactive terminal required');
 return new Promise((yes,no)=>{
  let value='';
  const stop=err=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);
   process.stdin.pause();process.stdout.write('\n');err?no(err):yes(value);};
  const onData=s=>{for(const c of s){
   if(c==='\r'||c==='\n'){stop();return;}
   if(c==='\u0003'){stop(Error('Cancelled'));return;}
   if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);continue;}
   if(c>=' ')value+=c;
  }};
  process.stdout.write(message);process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');
  process.stdin.resume();process.stdin.on('data',onData);
 });
}
async function input(ask,prompt,max=500){
 const value=(await ask.question(prompt)).trim();
 if(value.length>max||/[\u0000-\u001f\u007f]/.test(value))throw Error('Invalid input');
 return value;
}
export async function runOwnerActionEntry(args=process.argv.slice(2),env=process.env){
 if(args.length!==1||args[0]!=='--add-action')throw Error('Usage: node tools/private-plan/action-entry.mjs --add-action');
 if(!process.stdin.isTTY||!env.BWD_COMPASS_PRIVATE_DIR)throw Error('Owner terminal and private directory required');
 const dir=privateDir(env);assertOutsideGit(dir);
 const passphrase=await hiddenInput('Existing private Snapshot/workplan passphrase (not echoed): ');
 if(passphrase.length<12)throw Error('Passphrase too short');
 const projection=loadPrivateProjection(passphrase,{directory:dir});
 const {plan,digest}=inspectRevision(dir,passphrase,projection);
 const ask=createInterface({input:process.stdin,output:process.stdout,terminal:true});
 try{
  process.stdout.write('PRIVATE owner action entry — selected '+plan.projects.length+' projects.\n');
  process.stdout.write('Use the project INDEX (1..'+plan.projects.length+') from your local selected registry. No names displayed here.\n');
  const indexText=await input(ask,'Project index: ',3);
  const index=Number(indexText);
  if(!/^\d+$/.test(indexText)||!Number.isInteger(index)||index<1||index>plan.projects.length)throw Error('Invalid project index');
  const title=await input(ask,'Next action title (3..300 characters): ',300);
  if(title.length<3)throw Error('Action title required');
  const p=(await input(ask,'Priority P0/P1/P2/P3: ',2)).toUpperCase();
  if(!['P0','P1','P2','P3'].includes(p))throw Error('Invalid priority');
  const responsible=(await input(ask,'Responsible HUMAN / AI_ASSIST (recommend HUMAN): ',9)).toUpperCase();
  if(!['HUMAN','AI_ASSIST'].includes(responsible))throw Error('Invalid owner');
  const due=await input(ask,'Due date YYYY-MM-DD (blank if unknown): ',10);
  if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw Error('Invalid date');
  const next=await input(ask,'Concrete next step (optional): ',500);
  const reason=await input(ask,'Evidence gap or reason (optional): ',500);
  const record=plan.projects[index-1];
  const time=new Date(Math.max(Date.now(),Date.parse(plan.updatedAt)+1)).toISOString();
  const action={id:'action-'+randomBytes(8).toString('hex'),
   title,status:'TODO',priority:p,owner:responsible,dueDate:due||null,evidenceIds:[],
   nextStep:next||null,reason:reason||null,updatedAt:time};
  const revised=prepareOwnerUpdate(plan,projection,record.repository,
   {actions:[...record.actions,action]},{at:time});
  process.stdout.write('\nPREVIEW — PRIVATE TERMINAL ONLY (not saved):\n');
  process.stdout.write('Selected index: '+index+'; title: '+title+'\n');
  process.stdout.write('Priority: '+p+'; owner: '+responsible+'; due date: '+(due||'UNKNOWN')+'\n');
  process.stdout.write('Status: TODO (not DONE); next step: '+(next||'not supplied')+'\n');
  process.stdout.write('No GitHub/host verification or project completion is inferred.\n');
  const confirmation=await input(ask,'Type CONFIRM to save encrypted revision with backup; anything else cancels: ',16);
  if(confirmation!=='CONFIRM')return {saved:false,cancelled:true};
  const result=commitOwnerRevision({directory:dir,passphrase,projection,before:plan,
   after:revised,expectedDigest:digest,confirmed:true});
  const summary=summarizeWorkplan(revised,projection);
  return {saved:result.saved,encryptedBackupCreated:result.encryptedBackupCreated,
   selected:summary.repositories,openActions:summary.openActions,
   ownerReviewed:summary.ownerReviewed,publicDataExported:false};
 }finally{ask.close();}
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runOwnerActionEntry().then(r=>{
 console.log('PC-04B PRIVATE ACTION: '+(r.saved?'ENCRYPTED_SAVED':'CANCELLED'));
 for(const [k,v] of Object.entries(r))if(k!=='saved')console.log(k+': '+v);
 console.log('No GitHub write. No public Pages data. No automatic DONE.');
}).catch(()=>{console.error('PC-04B private action not committed. Verify owner inputs, passphrase, scope, private file and lock.');process.exitCode=1;});
