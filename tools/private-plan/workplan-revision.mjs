// PC-04B — explicit owner-triggered encrypted revision with backup and race protection.
// NEVER import from the public Pages app or from the read-only private HTTP server.
import {createHash,randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,openSync,closeSync,unlinkSync,copyFileSync,renameSync,lstatSync,realpathSync,constants} from 'node:fs';
import {join,resolve} from 'node:path';
import {assertOutsideGit} from '../private-sync/sync.mjs';
import {validateWorkplan} from './workplan-model.mjs';
import {encryptWorkplan,decryptWorkplan,WORKPLAN_FILE} from './encrypted-workplan.mjs';

const MAX_FILE=8*1024*1024;
function ensure(ok,reason){if(!ok)throw Error('Private revision refused: '+reason);}
function paths(directory){
 ensure(typeof directory==='string'&&directory.length>0,'folder required');
 const dir=realpathSync(resolve(directory));assertOutsideGit(dir);
 ensure(!lstatSync(dir).isSymbolicLink(),'symlink folder');
 const file=join(dir,WORKPLAN_FILE),lock=join(dir,'owner-workplan.enc.lock');
 assertOutsideGit(file);assertOutsideGit(lock);
 return {dir,file,lock};
}
function readEnvelope(file){
 ensure(!lstatSync(file).isSymbolicLink(),'symlink workplan');
 const bytes=readFileSync(file);
 ensure(bytes.length>0&&bytes.length<=MAX_FILE,'file size');
 const raw=bytes.toString('utf8');
 return {raw,digest:createHash('sha256').update(bytes).digest('hex')};
}
export function inspectRevision(directory,passphrase,projection){
 const {file}=paths(directory);
 const {raw,digest}=readEnvelope(file);
 const plan=validateWorkplan(decryptWorkplan(JSON.parse(raw),passphrase),projection);
 return {plan,digest}; // PRIVATE: never serialize this object into HTTP or public logs
}
export function commitOwnerRevision({directory,passphrase,projection,before,after,expectedDigest,confirmed=false}){
 ensure(confirmed===true,'owner confirmation required');
 ensure(typeof expectedDigest==='string'&&/^[a-f0-9]{64}$/.test(expectedDigest),'expected SHA-256 required');
 validateWorkplan(before,projection);
 validateWorkplan(after,projection);
 ensure(after.createdAt===before.createdAt,'createdAt cannot change');
 ensure(Date.parse(after.updatedAt)>Date.parse(before.updatedAt),'updatedAt must advance');
 ensure(after.projects.length===before.projects.length,'scope cannot change');
 const {dir,file,lock}=paths(directory);
 let handle,temporary=null;
 try{
  // Exclusive lock held during re-read, backup, and replacement.
  handle=openSync(lock,'wx',0o600);
  const existing=readEnvelope(file);
  ensure(existing.digest===expectedDigest,'stale read: file changed since preview');
  const current=validateWorkplan(decryptWorkplan(JSON.parse(existing.raw),passphrase),projection);
  ensure(JSON.stringify(current)===JSON.stringify(before),'current plan differs from reviewed plan');
  const envelope=encryptWorkplan(after,passphrase);
  const proposed=JSON.stringify(envelope)+'\n';
  ensure(Buffer.byteLength(proposed,'utf8')<=MAX_FILE,'new encrypted plan too large');
  const suffix=new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(5).toString('hex');
  const backup=join(dir,'owner-workplan.enc.backup-'+suffix+'.json');
  temporary=join(dir,'.owner-workplan-'+suffix+'.tmp');
  assertOutsideGit(backup);assertOutsideGit(temporary);
  // All backup bytes are ENCRYPTED; COPYFILE_EXCL refuses overwrite.
  copyFileSync(file,backup,constants.COPYFILE_EXCL);
  writeFileSync(temporary,proposed,{encoding:'utf8',mode:0o600,flag:'wx'});
  // Replace only under the exclusive lock; failure leaves the original plus encrypted backup.
  renameSync(temporary,file);temporary=null;
  return {saved:true,encryptedBackupCreated:true,privateOnly:true,
    // Return a count/status only; don't expose repo, action title, host or local file name.
    selected:after.projects.length};
 }finally{
  if(temporary){try{unlinkSync(temporary);}catch{}}
  if(handle!==undefined){closeSync(handle);try{unlinkSync(lock);}catch{}}
 }
}
