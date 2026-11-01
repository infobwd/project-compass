// PC-04A: encrypted owner workplan stored OUTSIDE Git. No HTTP endpoint, no public React import.
// Private file content may include repo names, host links and local Windows worktree paths.
import {randomBytes,scryptSync,createCipheriv,createDecipheriv} from 'node:crypto';
import {existsSync,mkdirSync,writeFileSync,readFileSync,lstatSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {assertOutsideGit} from '../private-sync/sync.mjs';
import {validateWorkplan} from './workplan-model.mjs';
const FORMAT='BWD-COMPASS-OWNER-WORKPLAN-ENC-V1';
export const WORKPLAN_FILE='owner-workplan.enc.json';
function ensurePassphrase(pass){
 if(typeof pass!=='string'||pass.length<12||pass.length>500)throw Error('Workplan passphrase must have 12..500 characters');
}
function buf(value,needed){
 if(typeof value!=='string'||value.length>20_000_000)throw Error('Malformed encrypted workplan');
 const b=Buffer.from(value,'base64');
 if(needed && b.length!==needed)throw Error('Malformed encrypted workplan');
 return b;
}
export function encryptWorkplan(plan,passphrase){
 ensurePassphrase(passphrase);
 const salt=randomBytes(16),iv=randomBytes(12);
 const key=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:128*1024*1024});
 const plain=Buffer.from(JSON.stringify(plan),'utf8');
 try{
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from(FORMAT));
  const enc=Buffer.concat([cipher.update(plain),cipher.final()]);
  return {format:FORMAT,algorithm:'aes-256-gcm',kdf:'scrypt-N32768-r8-p1',
   salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),
   ciphertext:enc.toString('base64')};
 }finally{plain.fill(0);key.fill(0);}
}
export function decryptWorkplan(envelope,passphrase){
 ensurePassphrase(passphrase);
 if(!envelope||envelope.format!==FORMAT||envelope.algorithm!=='aes-256-gcm'||
    envelope.kdf!=='scrypt-N32768-r8-p1')throw Error('Unsupported encrypted workplan');
 const salt=buf(envelope.salt,16),iv=buf(envelope.iv,12),tag=buf(envelope.tag,16);
 const enc=buf(envelope.ciphertext);
 if(enc.length===0||enc.length>8*1024*1024)throw Error('Invalid ciphertext size');
 const key=scryptSync(passphrase,salt,32,{N:32768,r:8,p:1,maxmem:128*1024*1024});
 try{
  const cipher=createDecipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(FORMAT));cipher.setAuthTag(tag);
  const plain=Buffer.concat([cipher.update(enc),cipher.final()]);
  try{return JSON.parse(plain.toString('utf8'));}finally{plain.fill(0);}
 }finally{key.fill(0);}
}
function directory(folder){
 if(typeof folder!=='string'||folder.length===0)throw Error('Private folder required');
 const path=resolve(folder);assertOutsideGit(path);
 mkdirSync(path,{recursive:true,mode:0o700});
 if(lstatSync(path).isSymbolicLink())throw Error('Private folder cannot be a symlink');
 const real=realpathSync(path);assertOutsideGit(real);
 return real;
}
export function createPrivateWorkplanFile(plan,projection,passphrase,folder){
 validateWorkplan(plan,projection);
 const dir=directory(folder);
 const output=join(dir,WORKPLAN_FILE);assertOutsideGit(output);
 if(existsSync(output))throw Error('Private workplan already exists — refusing overwrite');
 const envelope=encryptWorkplan(plan,passphrase);
 const str=JSON.stringify(envelope)+'\n';
 if(str.length>8*1024*1024)throw Error('Encrypted workplan too large');
 // Exclusive create: no silent overwrites, no plaintext intermediary, private mode.
 writeFileSync(output,str,{encoding:'utf8',flag:'wx',mode:0o600});
 return {path:output,created:true};
}
export function readPrivateWorkplanFile(projection,passphrase,folder){
 const dir=directory(folder),file=join(dir,WORKPLAN_FILE);
 assertOutsideGit(file);
 if(lstatSync(file).isSymbolicLink())throw Error('Symlink workplan refused');
 const raw=readFileSync(file,'utf8');
 if(raw.length>8*1024*1024)throw Error('Encrypted file too large');
 const plan=decryptWorkplan(JSON.parse(raw),passphrase);
 return validateWorkplan(plan,projection);
}
