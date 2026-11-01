// PC-04G — staged encrypted refresh with explicit owner activation, immutable encrypted backup.
// PRIVATE Node only. Never imported by browser or PUBLIC Pages.
import {createHash,randomBytes} from 'node:crypto';
import {
 existsSync,realpathSync,lstatSync,readFileSync,writeFileSync,copyFileSync,
 renameSync,unlinkSync,openSync,closeSync,constants
} from 'node:fs';
import {join,resolve} from 'node:path';
import {assertOutsideGit,decryptSnapshot,encryptSnapshot} from './sync.mjs';
import {parseSelection} from './selection.mjs';
import {verifySelectedSnapshot,buildEvidenceSummary} from './summary.mjs';
import {projectOfflineEvidence} from '../private-ui/offline-projection.mjs';
import {readPrivateWorkplanFile} from '../private-plan/encrypted-workplan.mjs';
import {validateWorkplan} from '../private-plan/workplan-model.mjs';

const FORMAT='BWD-COMPASS-SNAPSHOT-REFRESH-STAGE-V1';
const ACTIVE='selected.snapshot.enc.json',SELECTION='projects.selection.json';
const LOCK='selected.snapshot.refresh.lock',SIZE=8*1024*1024;
const ID=/^[a-f0-9]{24}$/;
function fail(ok,reason){if(!ok)throw Error('PC04G_REFUSED_'+reason);}
function hash(input){return createHash('sha256').update(input).digest('hex');}
function safeDirectory(folder){
 fail(typeof folder==='string'&&folder.length>0,'FOLDER');
 const real=realpathSync(resolve(folder));assertOutsideGit(real);
 fail(lstatSync(real).isDirectory()&&!lstatSync(real).isSymbolicLink(),'FOLDER_TYPE');
 return real;
}
function filepath(folder,name){
 const path=join(folder,name);
 assertOutsideGit(path);
 return path;
}
function readSafe(folder,name){
 const path=filepath(folder,name);
 const st=lstatSync(path);
 fail(st.isFile()&&!st.isSymbolicLink()&&st.size>0&&st.size<=SIZE,'FILE_INVALID');
 return readFileSync(path);
}
function selected(folder){
 const b=readSafe(folder,SELECTION);
 const obj=JSON.parse(b.toString('utf8').replace(/^\uFEFF/,''));
 const names=parseSelection(b.toString('utf8'),obj.owner);
 return {owner:obj.owner,names,digest:hash(b)};
}
function activeSnapshot(folder,password,names){
 const raw=readSafe(folder,ACTIVE);
 const value=verifySelectedSnapshot(decryptSnapshot(JSON.parse(raw.toString('utf8')),password),names);
 return {raw,digest:hash(raw),value};
}
function stageName(id){fail(ID.test(id),'STAGE_ID');return 'snapshot-refresh-stage-'+id+'.enc.json';}
function guardNewSnapshot(snapshot,selectedNames,owner,current,clock){
 fail(snapshot?.owner===owner,'OWNER_SCOPE');
 verifySelectedSnapshot(snapshot,selectedNames);
 const older=Date.parse(current.observedAt),newer=Date.parse(snapshot.observedAt);
 fail(Number.isFinite(newer)&&newer>older,'NOT_NEWER');
 fail(newer<=clock+5*60000,'CLOCK_SKEW');
 for(const p of snapshot.projects){
  for(const [kind,rows] of [['PR',p.openPRs],['ISSUE',p.openIssues]]){
   fail(rows.state==='VERIFIED','COLLECTION_INCOMPLETE_'+kind);
   const arr=kind==='PR'?rows.items:rows.numbers;
   fail(Array.isArray(arr)&&arr.length===rows.count&&arr.length<=500,'ENUMERATION_INCOMPLETE_'+kind);
   const seen=new Set();
   for(const item of arr){
    const number=kind==='PR'?item?.number:item;
    fail(Number.isSafeInteger(number)&&number>0&&number<=999999999&&!seen.has(number),'INVALID_REFERENCE_'+kind);
    seen.add(number);
    if(kind==='PR'){
     fail(typeof item.draft==='boolean','PR_DRAFT_TYPE');
     fail((item.headSha===null||item.headSha===undefined||
       (typeof item.headSha==='string'&&/^[a-f\d]{40}$/i.test(item.headSha))),'PR_HEAD_SHA');
    }
   }
  }
 }
 return snapshot;
}
function validateOwnerPlan(snapshot,folder,password,names){
 const projection=projectOfflineEvidence(snapshot,names);
 const workplan=readPrivateWorkplanFile(projection,password,folder);
 validateWorkplan(workplan,projection);
 return true;
}
function stageRead(folder,id){
 const bytes=readSafe(folder,stageName(id));
 const obj=JSON.parse(bytes.toString('utf8'));
 fail(obj&&obj.format===FORMAT&&obj.id===id&&typeof obj.oldDigest==='string'&&
   /^[a-f\d]{64}$/.test(obj.oldDigest)&&typeof obj.selectionDigest==='string'&&
   /^[a-f\d]{64}$/.test(obj.selectionDigest)&&obj.encryptedSnapshot?.format==='BWD-COMPASS-PRIVATE-SNAPSHOT-V1',
  'STAGE_FORMAT');
 const keys=Object.keys(obj).sort();
 fail(JSON.stringify(keys)===JSON.stringify(['createdAt','encryptedSnapshot','format','id','oldDigest','selectionDigest'].sort()),'STAGE_FIELDS');
 return {bytes,record:obj,digest:hash(bytes)};
}
export function preflightEncryptedRefresh({folder,passphrase}){
 const directory=safeDirectory(folder),sel=selected(directory);
 const old=activeSnapshot(directory,passphrase,sel.names);
 validateOwnerPlan(old.value,directory,passphrase,sel.names);
 return {owner:sel.owner,selectedRepositories:[...sel.names],selected:sel.names.length,
  mode:'PC04G_PREFLIGHT_NO_WRITES',oldPreserved:true};
}
export function stageEncryptedRefresh({folder,passphrase,candidate,clock=Date.now(),id=randomBytes(12).toString('hex')}){
 const directory=safeDirectory(folder),sel=selected(directory),old=activeSnapshot(directory,passphrase,sel.names);
 // Ensure already encrypted private plan can be read with old AND new selected snapshot.
 validateOwnerPlan(old.value,directory,passphrase,sel.names);
 guardNewSnapshot(candidate,sel.names,sel.owner,old.value,clock);
 validateOwnerPlan(candidate,directory,passphrase,sel.names);
 const stage={format:FORMAT,id,oldDigest:old.digest,selectionDigest:sel.digest,
  createdAt:new Date(clock).toISOString(),encryptedSnapshot:encryptSnapshot(candidate,passphrase)};
 const name=stageName(id),filename=filepath(directory,name);
 const payload=JSON.stringify(stage)+'\n';
 fail(Buffer.byteLength(payload,'utf8')<=SIZE,'STAGE_TOO_BIG');
 writeFileSync(filename,payload,{encoding:'utf8',flag:'wx',mode:0o600});
 return {mode:'PC04G_STAGED_ENCRYPTED_ONLY',stageId:id,oldPreserved:true,
  ownerPlanUnmodified:true,scope:sel.names.length,backupCreated:false,writesOnlyStage:true};
}
export function inspectEncryptedRefresh({folder,passphrase,id,clock=Date.now()}){
 const directory=safeDirectory(folder),sel=selected(directory);
 const old=activeSnapshot(directory,passphrase,sel.names);
 const s=stageRead(directory,id);
 fail(s.record.oldDigest===old.digest&&s.record.selectionDigest===sel.digest,'STALE_BASE_OR_SELECTION');
 const candidate=decryptSnapshot(s.record.encryptedSnapshot,passphrase);
 guardNewSnapshot(candidate,sel.names,sel.owner,old.value,clock);
 validateOwnerPlan(old.value,directory,passphrase,sel.names);
 validateOwnerPlan(candidate,directory,passphrase,sel.names);
 const before=buildEvidenceSummary(old.value,sel.names,clock);
 const after=buildEvidenceSummary(candidate,sel.names,clock);
 return {mode:'PC04G_PREVIEW_ONLY',stageId:id,stageDigest:s.digest,
  newObservedAt:after.observedAt,previousObservedAt:before.observedAt,selected:sel.names.length,
  previousPRs:before.pullRequests.total,newPRs:after.pullRequests.total,
  previousIssues:before.issues.total,newIssues:after.issues.total,
  newVerifiedHeads:after.gitHead.verified,oldPreserved:true,ownerPlanUnmodified:true,
  hostNotVerified:true,notLiveUntilRefreshed:true};
}
export function activateEncryptedRefresh({folder,passphrase,id,expectedStageDigest,confirmed=false,clock=Date.now()}){
 fail(confirmed===true,'OWNER_CONFIRMATION');
 fail(typeof expectedStageDigest==='string'&&/^[a-f\d]{64}$/.test(expectedStageDigest),'EXPECTED_DIGEST');
 const directory=safeDirectory(folder),lock=filepath(directory,LOCK);
 let fd,temporary;
 try{
  fd=openSync(lock,'wx',0o600);
  // Re-read under exclusive lock, reject any file or plan changed after preview.
  const preview=inspectEncryptedRefresh({folder:directory,passphrase,id,clock});
  fail(preview.stageDigest===expectedStageDigest,'STAGE_CHANGED_SINCE_PREVIEW');
  const raw=readSafe(directory,ACTIVE);
  const stage=stageRead(directory,id).record;
  const suffix=new Date(clock).toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(5).toString('hex');
  const backup=filepath(directory,'selected.snapshot.backup-'+suffix+'.enc.json');
  temporary=filepath(directory,'.selected.snapshot-'+suffix+'.tmp');
  copyFileSync(filepath(directory,ACTIVE),backup,constants.COPYFILE_EXCL);
  // Stage envelope is already encrypted; extract its encrypted snapshot, write no plaintext.
  const proposed=JSON.stringify(stage.encryptedSnapshot)+'\n';
  fail(Buffer.byteLength(proposed,'utf8')<=SIZE,'TOO_LARGE');
  writeFileSync(temporary,proposed,{encoding:'utf8',flag:'wx',mode:0o600});
  renameSync(temporary,filepath(directory,ACTIVE));temporary=undefined;
  return {mode:'PC04G_ACTIVATED_ENCRYPTED',stageId:id,selected:preview.selected,
   backupCreated:true,backupEncrypted:true,oldDigest:hash(raw),newObservedAt:preview.newObservedAt,
   ownerPlanUnmodified:true,publicExport:false};
 }finally{
  if(temporary){try{unlinkSync(temporary);}catch{}}
  if(fd!==undefined){closeSync(fd);try{unlinkSync(lock);}catch{}}
 }
}
