#!/usr/bin/env node
// PC-03C: Local-only private snapshot reader. No network, HTTP listener, file exports, or Git writes.
import { existsSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { privateDir, assertOutsideGit, decryptSnapshot } from './sync.mjs';
import { parseSelection } from './selection.mjs';
import { buildEvidenceSummary, formatEvidenceSummary } from './summary.mjs';

const MAX_FILE=8*1024*1024;
function readPrivateText(path) {
  assertOutsideGit(path);
  if(!existsSync(path))throw new Error('Missing private input (check private folder and PC-03B collection)');
  const st=statSync(path);
  if(!st.isFile()||st.size>MAX_FILE||st.size===0)
    throw new Error('Invalid or oversized private input file');
  return readFileSync(path,'utf8');
}
function hiddenInput(message) {
  if(!process.stdin.isTTY||typeof process.stdin.setRawMode!=='function')
    throw new Error('Interactive terminal required; do not redirect passphrases');
  return new Promise((resolve,reject)=>{
    let value='';
    const cleanup=(err)=>{
      process.stdin.off('data',onData);process.stdin.setRawMode(false);
      process.stdin.pause();process.stdout.write('\n');
      err?reject(err):resolve(value);
    };
    const onData=(chunk)=>{
      for(const ch of chunk){
        if(ch==='\r'||ch==='\n'){cleanup();return;}
        if(ch==='\u0003'){cleanup(new Error('Cancelled'));return;}
        if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);continue;}
        if(ch>=' ')value+=ch;
      }
    };
    process.stdout.write(message);
    process.stdin.setRawMode(true);process.stdin.setEncoding('utf8');
    process.stdin.resume();process.stdin.on('data',onData);
  });
}
async function main(){
  const args=process.argv.slice(2);
  if(args.length===1 && args[0]==='--help'){
    console.log('Usage: node tools/private-sync/read.mjs --summary | --details --ack-private-terminal');
    console.log('Reads selected.snapshot.enc.json locally. No output file, network or web preview.');
    return;
  }
  const summary=args.length===1&&args[0]==='--summary';
  const details=args.length===2&&args[0]==='--details'&&args[1]==='--ack-private-terminal';
  if(!summary&&!details)throw new Error('Use --summary or --details --ack-private-terminal');
  const directory=privateDir();
  assertOutsideGit(directory);
  const selectedConfig=JSON.parse(readPrivateText(join(directory,'projects.selection.json')).replace(/^\uFEFF/,''));
  // Validate via the existing strict selection parser, not merely JSON parse.
  const selected=parseSelection(JSON.stringify(selectedConfig),selectedConfig?.owner);
  const envelope=JSON.parse(readPrivateText(join(directory,'selected.snapshot.enc.json')));
  const passphrase=await hiddenInput('Snapshot passphrase (not echoed): ');
  let snapshot;
  try{snapshot=decryptSnapshot(envelope,passphrase);}
  catch{throw new Error('Could not decrypt selected snapshot (check passphrase / file integrity)');}
  const evidence=buildEvidenceSummary(snapshot,selected);
  if(snapshot.owner!==selectedConfig.owner)throw new Error('Snapshot owner mismatch');
  console.log(formatEvidenceSummary(evidence,{details}));
}
const isMain=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1].replace(/\\/g,'/');
if(isMain)main().catch(err=>{console.error('PC-03C stopped safely: '+err.message);process.exitCode=1;});
