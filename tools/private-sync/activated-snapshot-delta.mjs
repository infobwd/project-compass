// PC-04I: Read-only verification of the activated Snapshot against its exact
// old encrypted backup and already existing Stage. Never plaintext-export.
import {createHash} from 'node:crypto';
import {realpathSync,lstatSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {assertOutsideGit,decryptSnapshot} from './sync.mjs';
import {parseSelection} from './selection.mjs';
import {verifySelectedSnapshot} from './summary.mjs';
import {projectOfflineEvidence} from '../private-ui/offline-projection.mjs';
import {readPrivateWorkplanFile} from '../private-plan/encrypted-workplan.mjs';
import {compareSelectedSnapshots,summarizeSnapshotDelta} from './snapshot-delta.mjs';

const STAGE='BWD-COMPASS-SNAPSHOT-REFRESH-STAGE-V1';
const ID=/^[a-f0-9]{24}$/;
const HASH=/^[a-f0-9]{64}$/;
const MAX=8*1024*1024;
function guard(p,reason){if(!p)throw Error('PC04I_REFUSED_'+reason);}
function digest(bytes){return createHash('sha256').update(bytes).digest('hex');}
function folderReal(folder){
 guard(typeof folder==='string'&&folder.length>0,'PRIVATE_FOLDER');
 const real=realpathSync(resolve(folder));
 assertOutsideGit(real);
 guard(lstatSync(real).isDirectory()&&!lstatSync(real).isSymbolicLink(),'PRIVATE_FOLDER_TYPE');
 return real;
}
function safeRead(folder,name){
 guard(typeof name==='string'&&name.length>0&&!name.includes('/')&&!name.includes('\\'),'FILE_NAME');
 const path=join(folder,name);assertOutsideGit(path);
 const stat=lstatSync(path);
 guard(stat.isFile()&&!stat.isSymbolicLink()&&stat.size>0&&stat.size<=MAX,'FILE_TYPE_OR_SIZE');
 return readFileSync(path);
}
function parseJSON(bytes){return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));}
function validatedPlan(snapshot,names,passphrase,directory){
 const projection=projectOfflineEvidence(snapshot,names);
 readPrivateWorkplanFile(projection,passphrase,directory);
}
export function readActivatedSnapshotDelta({folder,passphrase,stageId}){
 guard(ID.test(stageId||''),'STAGE_ID');
 guard(typeof passphrase==='string'&&passphrase.length>=12,'PASSPHRASE');
 const dir=folderReal(folder),selectionBytes=safeRead(dir,'projects.selection.json');
 const config=parseJSON(selectionBytes);
 const names=parseSelection(selectionBytes.toString('utf8'),config.owner);
 const stage=parseJSON(safeRead(dir,'snapshot-refresh-stage-'+stageId+'.enc.json'));
 guard(stage?.format===STAGE&&stage.id===stageId&&HASH.test(stage.oldDigest||'')&&
  HASH.test(stage.selectionDigest||'')&&stage.encryptedSnapshot?.format==='BWD-COMPASS-PRIVATE-SNAPSHOT-V1',
  'STAGE_STRUCTURE');
 guard(stage.selectionDigest===digest(selectionBytes),'SELECTION_CHANGED');
 const active=parseJSON(safeRead(dir,'selected.snapshot.enc.json'));
 guard(active?.format==='BWD-COMPASS-PRIVATE-SNAPSHOT-V1','ACTIVE_STRUCTURE');
 // Exact encrypted envelope match. A different activation has occurred if this differs.
 guard(JSON.stringify(active)===JSON.stringify(stage.encryptedSnapshot),'ACTIVE_NOT_MATCHING_STAGE');
 const entries=readdirSync(dir).filter(n=>/^selected\.snapshot\.backup-[0-9TZ-]+-[a-f0-9]{10}\.enc\.json$/.test(n));
 let matching=null;
 for(const entry of entries){
  const bytes=safeRead(dir,entry);
  if(digest(bytes)===stage.oldDigest){matching=bytes;break;}
 }
 guard(matching!==null,'PREVIOUS_ENCRYPTED_BACKUP_MISSING');
 const old=decryptSnapshot(parseJSON(matching),passphrase);
 const newer=decryptSnapshot(active,passphrase);
 guard(old.owner===config.owner&&newer.owner===config.owner,'OWNER_SELECTION_MISMATCH');
 verifySelectedSnapshot(old,names);verifySelectedSnapshot(newer,names);
 validatedPlan(old,names,passphrase,dir);
 validatedPlan(newer,names,passphrase,dir);
 const diff=compareSelectedSnapshots(old,newer,names);
 return {diff,summary:summarizeSnapshotDelta(diff),backupDigestVerified:true,
  activeMatchesActivatedStage:true,ownerWorkplanValidatedBoth:true,
  noWrites:true,githubNetwork:false};
}
