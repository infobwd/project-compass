#!/usr/bin/env node
// PC-04G — Owner-only staged refresh CLI. Never runs in public web/CI/browser.
// Read-only GitHub API -> encrypted Stage -> separate explicit preview -> encrypted backup + activate.
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit,collectSnapshot} from './sync.mjs';
import {parseSelection} from './selection.mjs';
import {readTerminalLine} from '../private-plan/action-entry.mjs';
import {preflightEncryptedRefresh,stageEncryptedRefresh,
 inspectEncryptedRefresh,activateEncryptedRefresh} from './staged-refresh.mjs';

const ID=/^[a-f0-9]{24}$/;
function no(condition,msg){if(!condition)throw Error(msg);}
function githubGET(url){
 const response=spawnSync('gh',['api','-X','GET',url],{
  encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,timeout:25000
 });
 no(!response.error&&response.status===0,'PC04G_GITHUB_READ_FAILED');
 try{return JSON.parse(response.stdout);}catch{throw Error('PC04G_GITHUB_READ_FAILED');}
}
function safeArgs(args){
 if(args.length===1&&args[0]==='--help')return {operation:'help'};
 if(args.length===1&&args[0]==='--stage')return {operation:'stage'};
 if(args.length===1&&args[0]==='--diagnose')return {operation:'diagnose'};
 if(args.length===3&&['--inspect','--activate'].includes(args[0])&&
   args[1]==='--stage-id'&&ID.test(args[2]))
  return {operation:args[0].slice(2),stageId:args[2]};
 throw Error('PC04G_INVALID_ARGUMENTS');
}
function printPreview(info){
 console.log('PC-04G PRIVATE ENCRYPTED PREVIEW — NOT LIVE HOST');
 console.log('Selected repositories: '+info.selected);
 console.log('Saved Snapshot: '+info.previousObservedAt+' -> staged '+info.newObservedAt);
 console.log('Open PR counts (old -> staged): '+info.previousPRs+' -> '+info.newPRs);
 console.log('Open Issue counts (old -> staged): '+info.previousIssues+' -> '+info.newIssues);
 console.log('Default Git HEAD verified in staged record: '+info.newVerifiedHeads);
 console.log('Workplan unchanged; Host/Production/Completion NOT VERIFIED. No PUBLIC upload.');
}
// Public-safe cause codes: NEVER print underlying Node error messages, local paths, repo names or passphrases.
export function safeRefreshErrorCode(error){
 const raw=String(error?.message??'');
 const known=raw.match(/^PC04G_REFUSED_([A-Z0-9_]{1,72})$/);
 if(known)return 'REFUSED_'+known[1];
 if(raw.startsWith('Invalid private workplan: selection scope')||
    raw.startsWith('Invalid private workplan: selected registry order mismatch'))
   return 'OWNER_WORKPLAN_SELECTION_MISMATCH';
 if(raw.startsWith('Invalid private workplan:'))return 'OWNER_WORKPLAN_VALIDATION_FAILED';
 if(raw.startsWith('Not an explicitly selected private snapshot')||
    raw.startsWith('Selected repository count mismatch')||
    raw.startsWith('Selected repository identity/order mismatch'))
   return 'SELECTED_SNAPSHOT_SCOPE_INVALID';
 if(raw.startsWith('Invalid GitHub evidence counts')||
    raw.startsWith('Invalid default branch evidence')||
    raw.startsWith('Invalid observation timestamp'))
   return 'SAVED_SNAPSHOT_STRUCTURE_INVALID';
 if(raw.startsWith('Unsupported snapshot')||raw.startsWith('Invalid encryption parameters')||
    raw.startsWith('Could not decrypt')||raw.includes('authenticate data'))
   return 'ENCRYPTED_SNAPSHOT_DECRYPT_OR_INTEGRITY_FAILED';
 if(raw.startsWith('Unsupported encrypted workplan')||
    raw.startsWith('Invalid ciphertext size'))
   return 'ENCRYPTED_WORKPLAN_DECRYPT_OR_INTEGRITY_FAILED';
 if(raw.startsWith('Cannot access all selected repositories'))return 'GITHUB_SELECTED_SCOPE_UNAVAILABLE';
 if(raw.startsWith('Repository list incomplete'))return 'GITHUB_REPOSITORY_LIST_INCOMPLETE';
 if(raw.startsWith('Unexpected GitHub API collection'))return 'GITHUB_COLLECTION_FORMAT_INVALID';
 if(error?.code==='ENOENT')return 'PRIVATE_REQUIRED_FILE_MISSING';
 if(['EACCES','EPERM','EROFS'].includes(error?.code))return 'LOCAL_FILESYSTEM_ACCESS_DENIED';
 if(error?.code==='EEXIST')return 'STAGE_OR_LOCK_ALREADY_EXISTS';
 return 'UNCLASSIFIED_STOP';
}
async function phase(phaseName,callback){
 try{return await callback();}
 catch(error){throw Error('PC04G_PHASE_'+phaseName+'_'+safeRefreshErrorCode(error));}
}
export async function runRefreshCLI(args=process.argv.slice(2),env=process.env,{
 clock=Date.now(),github=githubGET,terminal=readTerminalLine}={}){
 const command=safeArgs(args);
 if(command.operation==='help')return {mode:'HELP',usage:'--diagnose | --stage | --inspect --stage-id ID | --activate --stage-id ID'};
 no(process.stdin.isTTY&&typeof env.BWD_COMPASS_PRIVATE_DIR==='string',
   'PC04G_TRUSTED_TERMINAL_AND_PRIVATE_DIR_REQUIRED');
 const folder=privateDir(env);assertOutsideGit(folder);
 const passphrase=await terminal('Existing Snapshot/workplan passphrase (not echoed): ',{secret:true,max:500});
 no(typeof passphrase==='string'&&passphrase.length>=12,'PC04G_PRIVATE_ACCESS_FAILED');
 if(command.operation==='diagnose'||command.operation==='stage'){
  // No GitHub API and no file writes during --diagnose. No selected repo names printed.
  const scope=await phase('PRIVATE_PREFLIGHT',()=>preflightEncryptedRefresh({folder,passphrase}));
  if(command.operation==='diagnose')
   return {mode:'PRIVATE_PREFLIGHT_PASS',selected:scope.selected,writes:false,network:false};
  // Preflight validates old encrypted Snapshot AND the existing encrypted workplan.
  const auth=spawnSync('gh',['auth','status'],{encoding:'utf8',windowsHide:true,timeout:15000});
  no(!auth.error&&auth.status===0,'PC04G_GITHUB_AUTH_REQUIRED');
  console.log('PC-04G private preflight PASS. Read-only GitHub collection for '+scope.selected+' selected projects.');
  const candidate=await phase('GITHUB_COLLECTION',()=>collectSnapshot(github,{owner:scope.owner,
    selectedRepositories:scope.selectedRepositories,now:()=>new Date(clock).toISOString()}));
  console.log('PC-04G GitHub read-only collection completed. Validating encrypted staging inputs.');
  return await phase('ENCRYPTED_STAGING',()=>stageEncryptedRefresh({folder,passphrase,candidate,clock}));
 }
 const inspection=inspectEncryptedRefresh({folder,passphrase,id:command.stageId,clock});
 printPreview(inspection);
 if(command.operation==='inspect')return {mode:'INSPECT_ONLY',stageId:command.stageId,
  selected:inspection.selected,writes:false};
 console.log('IMPORTANT: activation replaces the current encrypted selected Snapshot after creating an encrypted backup.');
 console.log('The separately encrypted owner workplan will NOT change. Close the local private server first.');
 const typed=await terminal('Type ACTIVATE exactly (anything else cancels): ',{max:16});
 if(typed!=='ACTIVATE')return {mode:'CANCELLED',writes:false,backupCreated:false};
 return activateEncryptedRefresh({folder,passphrase,id:command.stageId,
  expectedStageDigest:inspection.stageDigest,confirmed:true,clock});
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)runRefreshCLI().then(result=>{
 if(result.mode==='HELP')console.log('PC-04G local encrypted refresh usage: '+result.usage);
 else {
  console.log('PC-04G PRIVATE-LOCAL: '+result.mode);
  for(const [key,value] of Object.entries(result)){
   if(['mode'].includes(key))continue;
   console.log(key+': '+value);
  }
  console.log('No GitHub writes, owner TODO writes, Host acceptance, Merge or Public Pages upload.');
 }
}).catch(error=>{
 const allow=new Set(['PC04G_INVALID_ARGUMENTS','PC04G_TRUSTED_TERMINAL_AND_PRIVATE_DIR_REQUIRED',
  'PC04G_PRIVATE_ACCESS_FAILED','PC04G_GITHUB_AUTH_REQUIRED','PC04G_GITHUB_READ_FAILED']);
 const phaseCode=/^PC04G_PHASE_(?:PRIVATE_PREFLIGHT|GITHUB_COLLECTION|ENCRYPTED_STAGING)_[A-Z0-9_]{1,110}$/.test(error?.message||'');
 console.error('PC-04G refused safely: '+(allow.has(error?.message)||phaseCode?error.message:'PC04G_PRIVATE_REFRESH_REFUSED')+
   '. Existing active encrypted Snapshot/workplan not intentionally modified.');
 process.exitCode=1;
});
