#!/usr/bin/env node
// PC-04B: OWNER-ONLY console prompts, no raw/plaintext files or automatic action completion.
// A single raw TTY reader handles both hidden passphrase and visible prompts.
import {randomBytes} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {loadPrivateProjection} from '../private-ui/private-local.mjs';
import {prepareOwnerUpdate,summarizeWorkplan} from './workplan-model.mjs';
import {inspectRevision,commitOwnerRevision} from './workplan-revision.mjs';

export function readTerminalLine(prompt,{secret=false,max=500,input=process.stdin,output=process.stdout}={}){
 if(!input?.isTTY||typeof input.setRawMode!=='function')return Promise.reject(Error('PC04B_TTY_REQUIRED'));
 return new Promise((resolveInput,reject)=>{
  let value='',done=false,escape=false;
  function finish(error){
   if(done)return;done=true;
   input.off('data',onData);input.off('end',onClosed);input.off('close',onClosed);input.off('error',onError);
   try{input.setRawMode(false);}catch{}
   try{input.pause();}catch{}
   output.write('\n');
   error?reject(error):resolveInput(value);
  }
  const onClosed=()=>finish(Error('PC04B_INPUT_CLOSED'));
  const onError=()=>finish(Error('PC04B_INPUT_UNAVAILABLE'));
  function onData(chunk){
   for(const char of String(chunk)){
    if(char==='\r'||char==='\n'){finish();return;}
    if(char==='\u0003'||char==='\u0004'){finish(Error('PC04B_INPUT_CANCELLED'));return;}
    if(char==='\u001b'){escape=true;continue;}
    if(escape){if(/[A-Za-z~]/.test(char))escape=false;continue;}
    if(char==='\b'||char==='\u007f'){
     const parts=Array.from(value);
     if(parts.length){parts.pop();value=parts.join('');if(!secret)output.write('\b \b');}
     continue;
    }
    if(char<' '||char==='\u007f')continue;
    if(value.length+char.length>max)continue;
    value+=char;
    if(!secret)output.write(char);
   }
  }
  try{
   output.write(prompt);
   input.setEncoding?.('utf8');
   input.on('data',onData);input.once('end',onClosed);input.once('close',onClosed);input.once('error',onError);
   input.setRawMode(true);
   input.resume();
  }catch{finish(Error('PC04B_INPUT_UNAVAILABLE'));}
 });
}
async function ownerInput(prompt,max=500){
 return (await readTerminalLine(prompt,{max})).trim();
}
export function validateProjectIndex(value,count){
 if(!/^\d+$/.test(value)||!Number.isInteger(Number(value))||Number(value)<1||Number(value)>count)
  throw Error('PC04B_INVALID_PROJECT_INDEX');
 return Number(value);
}
async function projectIndex(plan){
 process.stdout.write('Enter project index 1..'+plan.projects.length+'; type L to list private names locally.\n');
 let selected=await ownerInput('Project index: ',3);
 if(selected.toUpperCase()==='L'){
  process.stdout.write('PRIVATE LOCAL INDEX — do NOT share screen or terminal output.\n');
  plan.projects.forEach((p,i)=>process.stdout.write((i+1)+'. '+p.repository+'\n'));
  selected=await ownerInput('Project index 1..'+plan.projects.length+': ',3);
 }
 return validateProjectIndex(selected,plan.projects.length);
}
// The input check uses *fictional typed samples* only, never a real passphrase.
// Distinguish empty/incorrect samples from broken TTY safely; do not echo masked contents.
export function validateDiagnosticSample(sample,{masked=false}={}){
 const value=String(sample??'').trim();
 const label=masked?'MASKED':'VISIBLE';
 if(value.length===0)throw Error('PC04B_INPUT_CHECK_'+label+'_EMPTY');
 if(value.toUpperCase()!=='TEST')throw Error('PC04B_INPUT_CHECK_'+label+'_MISMATCH');
 return true;
}
export async function runOwnerActionEntry(args=process.argv.slice(2),env=process.env){
 if(args.length===1&&args[0]==='--input-check'){
  process.stdout.write('SAFE INPUT TEST ONLY — DO NOT ENTER YOUR ACTUAL PASSPHRASE.\\n');
  const visible=await ownerInput('Step 1/3: type TEST (visible) then Enter: ',16);
  validateDiagnosticSample(visible);
  const secret=await readTerminalLine('Step 2/3: type TEST again (hidden) then Enter: ',{secret:true,max:16});
  validateDiagnosticSample(secret,{masked:true});
  const number=await ownerInput('Step 3/3: type 1 (visible) then Enter: ',3);
  if(validateProjectIndex(number,11)!==1)throw Error('PC04B_INPUT_CHECK_INDEX_FAILED');
  return {inputCheck:'PASS',visibleInput:'PASS',maskedInput:'PASS',indexInput:'PASS',
   writes:false,privateDataAccessed:false};
 }
 if(args.length!==1||args[0]!=='--add-action')throw Error('Usage: node tools/private-plan/action-entry.mjs --input-check | --add-action');
 if(!process.stdin.isTTY||!env.BWD_COMPASS_PRIVATE_DIR)throw Error('PC04B_TTY_REQUIRED');
 const dir=privateDir(env);assertOutsideGit(dir);
 const passphrase=await readTerminalLine('Existing private Snapshot/workplan passphrase (not echoed): ',{secret:true,max:500});
 if(passphrase.length<12)throw Error('PC04B_PRIVATE_OPERATION_FAILED');
 const projection=loadPrivateProjection(passphrase,{directory:dir});
 const {plan,digest}=inspectRevision(dir,passphrase,projection);
 process.stdout.write('PRIVATE owner action entry — selected '+plan.projects.length+' projects.\n');
 const index=await projectIndex(plan);
 const title=await ownerInput('Next action title (3..300 characters): ',300);
 if(title.length<3)throw Error('PC04B_INVALID_ACTION_TITLE');
 const priority=(await ownerInput('Priority P0/P1/P2/P3: ',2)).toUpperCase();
 if(!['P0','P1','P2','P3'].includes(priority))throw Error('PC04B_INVALID_PRIORITY');
 const responsible=(await ownerInput('Responsible HUMAN / AI_ASSIST (recommend HUMAN): ',9)).toUpperCase();
 if(!['HUMAN','AI_ASSIST'].includes(responsible))throw Error('PC04B_INVALID_RESPONSIBLE');
 const due=await ownerInput('Due date YYYY-MM-DD (blank if unknown): ',10);
 if(due&&!/^\d{4}-\d{2}-\d{2}$/.test(due))throw Error('PC04B_INVALID_DUE_DATE');
 const next=await ownerInput('Concrete next step (optional): ',500);
 const reason=await ownerInput('Evidence gap or reason (optional): ',500);
 const record=plan.projects[index-1];
 const time=new Date(Math.max(Date.now(),Date.parse(plan.updatedAt)+1)).toISOString();
 const action={id:'action-'+randomBytes(8).toString('hex'),
  title,status:'TODO',priority,owner:responsible,dueDate:due||null,evidenceIds:[],
  nextStep:next||null,reason:reason||null,updatedAt:time};
 const revised=prepareOwnerUpdate(plan,projection,record.repository,
  {actions:[...record.actions,action]},{at:time});
 process.stdout.write('\nPREVIEW — PRIVATE TERMINAL ONLY (not saved):\n');
 process.stdout.write('Selected index: '+index+'; title: '+title+'\n');
 process.stdout.write('Priority: '+priority+'; owner: '+responsible+'; due date: '+(due||'UNKNOWN')+'\n');
 process.stdout.write('Status: TODO (not DONE); next step: '+(next||'not supplied')+'\n');
 process.stdout.write('No GitHub/host verification or project completion is inferred.\n');
 const confirmation=await ownerInput('Type CONFIRM to save encrypted revision with backup; anything else cancels: ',16);
 if(confirmation!=='CONFIRM')return {saved:false,cancelled:true};
 const result=commitOwnerRevision({directory:dir,passphrase,projection,before:plan,
  after:revised,expectedDigest:digest,confirmed:true});
 const summary=summarizeWorkplan(revised,projection);
 return {saved:result.saved,encryptedBackupCreated:result.encryptedBackupCreated,
  selected:summary.repositories,openActions:summary.openActions,
  ownerReviewed:summary.ownerReviewed,publicDataExported:false};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runOwnerActionEntry().then(r=>{
 console.log('PC-04B PRIVATE ACTION: '+(r.saved?'ENCRYPTED_SAVED':r.cancelled?'CANCELLED':'INPUT_CHECK_PASS'));
 for(const [k,v] of Object.entries(r))if(k!=='saved')console.log(k+': '+v);
 console.log('No GitHub write. No public Pages data. No automatic DONE.');
}).catch(error=>{
 const safe=new Set(['PC04B_TTY_REQUIRED','PC04B_INPUT_CLOSED','PC04B_INPUT_UNAVAILABLE',
  'PC04B_INPUT_CANCELLED','PC04B_INVALID_PROJECT_INDEX','PC04B_INVALID_ACTION_TITLE',
  'PC04B_INVALID_PRIORITY','PC04B_INVALID_RESPONSIBLE','PC04B_INVALID_DUE_DATE',
  'PC04B_INPUT_CHECK_VISIBLE_EMPTY','PC04B_INPUT_CHECK_VISIBLE_MISMATCH',
  'PC04B_INPUT_CHECK_MASKED_EMPTY','PC04B_INPUT_CHECK_MASKED_MISMATCH',
  'PC04B_INPUT_CHECK_INDEX_FAILED']);
 const code=safe.has(error?.message)?error.message:'PC04B_PRIVATE_OPERATION_FAILED';
 console.error('PC-04B private action NOT committed. Code: '+code);
 console.error('No private value printed. Check the encrypted plan with --summary.');
 process.exitCode=1;
});
