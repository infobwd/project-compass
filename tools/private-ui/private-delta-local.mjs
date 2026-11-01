#!/usr/bin/env node
// PC-04I explicit owner-local private browser using two verified encrypted saved Snapshots.
// No public deployment, network GitHub query, owner TODO writes or auto-refresh.
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {privateDir,assertOutsideGit} from '../private-sync/sync.mjs';
import {readTerminalLine} from '../private-plan/action-entry.mjs';
import {loadPrivateProjection,startOwnerLocalServer} from './private-local.mjs';
import {readPrivateWorkplanFile} from '../private-plan/encrypted-workplan.mjs';
import {readActivatedSnapshotDelta} from '../private-sync/activated-snapshot-delta.mjs';

const ID=/^[a-f0-9]{24}$/;
export async function startOwnerPrivateDeltaBrowser(args=process.argv.slice(2),env=process.env,{
 terminal=readTerminalLine}={}){
 if(args.length!==3||args[0]!=='--ack-private-workplan-local'||
  args[1]!=='--delta-stage-id'||!ID.test(args[2]))
  throw Error('PC04I_LOCAL_BROWSER_ARGS');
 if(!process.stdin.isTTY||typeof env.BWD_COMPASS_PRIVATE_DIR!=='string')
  throw Error('PC04I_TRUSTED_LOCAL_TERMINAL_REQUIRED');
 const folder=privateDir(env);assertOutsideGit(folder);
 const passphrase=await terminal('Existing encrypted Snapshot/Workplan passphrase (hidden): ',{secret:true,max:500});
 if(typeof passphrase!=='string'||passphrase.length<12)throw Error('PC04I_LOCAL_ACCESS_FAILED');
 const projection=loadPrivateProjection(passphrase,{directory:folder});
 const plan=readPrivateWorkplanFile(projection,passphrase,folder);
 const snapshotDelta=readActivatedSnapshotDelta({folder,passphrase,stageId:args[2]});
 const app=await startOwnerLocalServer({projection,workplan:plan,snapshotDelta});
 return {...app,mode:'PC04I_PRIVATE_DELTA_LOCAL',readonly:true,networkGitHub:false};
}
const main=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main)startOwnerPrivateDeltaBrowser().then(app=>{
 console.log('PC-04I PRIVATE DELTA LOCAL (not live) — '+app.url);
 console.log('One-time browser pairing code: '+app.pairingCode);
 console.log('Close with Ctrl+C. Private Snapshot, previous encrypted backup and workplan were validated.');
 console.log('No GitHub queries, no task changes, no Merge, Deploy or Public Pages upload.');
 for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.server.close(()=>process.exit(0)));
}).catch(()=>{
 console.error('PC-04I local browser refused safely. No private server opened or files written.');
 process.exitCode=1;
});
