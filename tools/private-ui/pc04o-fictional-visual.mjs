#!/usr/bin/env node
// PC-04O O3: fictional-only visual QA of the ACTUAL private-local UI.
// No selected Snapshot, Workplan, passphrase, user registry, GitHub API or Host access.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectOfflineEvidence} from './offline-projection.mjs';

const OWNER='fictional-preview-only';
const NAMES=['alpha-classroom','beta-library','gamma-curriculum','delta-teacher-pilot']
 .map(name=>OWNER+'/'+name);

export function fictionalVisualProjection(at=new Date().toISOString()){
 const saved={
  format:'BWD-COMPASS-REGISTRY-V1',owner:OWNER,observedAt:at,
  coverage:'ALL_SELECTED',selection:{mode:'EXPLICIT',requested:4,matched:4},
  inspectedRepositories:4,
  projects:NAMES.map((fullName,i)=>({
   fullName,defaultBranch:'main',
   defaultHead:{state:i===3?'UNKNOWN':'VERIFIED',sha:i===3?null:'a'.repeat(40)},
   openPRs:{state:'VERIFIED',count:i+1,atLeast:i+1},
   openIssues:{state:'VERIFIED',count:i%2,atLeast:i%2}
  }))
 };
 return projectOfflineEvidence(saved,NAMES,Date.parse(at));
}

export async function startFictionalVisualPreview(){
 // Fail closed: do not launch from a shell configured for real owner-private files.
 if(process.env.BWD_COMPASS_PRIVATE_DIR){
  throw Error('STOP: Use a clean PowerShell session without BWD_COMPASS_PRIVATE_DIR');
 }
 // Only in-memory fictional projection; no owner encrypted disk reads.
 const {startOwnerLocalServer}=await import('./private-local.mjs');
 return startOwnerLocalServer({projection:fictionalVisualProjection()});
}

const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 startFictionalVisualPreview().then(({server,url,pairingCode})=>{
  console.log('PC-04O FICTIONAL-ONLY VISUAL PREVIEW — '+url);
  console.log('Synthetic one-time browser pairing code (expires in 2 minutes): '+pairingCode);
  console.log('No real Registry, Snapshot, Workplan, GitHub or Host. Ctrl+C to close.');
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>server.close(()=>process.exit(0)));
 }).catch(()=>{console.error('Fictional preview not started; check clean local session and loopback binding.');process.exitCode=1;});
}
