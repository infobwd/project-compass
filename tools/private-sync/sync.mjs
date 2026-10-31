#!/usr/bin/env node
// PC-03A: read-only GitHub metadata collector. Never imported by the public frontend.
import { spawnSync } from 'node:child_process';
import { randomBytes, scryptSync, createCipheriv, createDecipheriv } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, renameSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const FORMAT = 'BWD-COMPASS-PRIVATE-SNAPSHOT-V1';
const SHA = /^[a-f0-9]{40}$/i;
const LOGIN = /^[a-z0-9](?:[a-z0-9-]{0,38})$/i;
const FULL_NAME = /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;

export function encryptSnapshot(record, passphrase) {
  if (typeof passphrase !== 'string' || passphrase.length < 12) throw new Error('Passphrase must be at least 12 characters');
  const salt = randomBytes(16), iv = randomBytes(12);
  const key = scryptSync(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(FORMAT));
  const plaintext = Buffer.from(JSON.stringify(record), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  plaintext.fill(0); key.fill(0);
  return { format: FORMAT, algorithm: 'aes-256-gcm', kdf: 'scrypt-N32768-r8-p1',
    salt: salt.toString('base64'), iv: iv.toString('base64'),
    tag: tag.toString('base64'), ciphertext: encrypted.toString('base64') };
}

export function decryptSnapshot(envelope, passphrase) {
  if (!envelope || envelope.format !== FORMAT || envelope.algorithm !== 'aes-256-gcm' ||
      envelope.kdf !== 'scrypt-N32768-r8-p1') throw new Error('Unsupported snapshot');
  const salt = Buffer.from(envelope.salt, 'base64'), iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  if (salt.length !== 16 || iv.length !== 12 || tag.length !== 16) throw new Error('Invalid encryption parameters');
  const key = scryptSync(passphrase, salt, 32, { N: 32768, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(FORMAT)); decipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
      decipher.final()]).toString('utf8'));
  } finally { key.fill(0); }
}

export async function getAllPages(api, uri, maxPages = 10) {
  const all = [];
  for (let page=1; page<=maxPages; page++) {
    const separator = uri.includes('?') ? '&' : '?';
    const items = await api(uri + separator + 'per_page=100&page=' + page);
    if (!Array.isArray(items)) throw new Error('Unexpected GitHub API collection');
    all.push(...items);
    if (items.length < 100) return { items: all, complete: true };
  }
  return { items: all, complete: false };
}

export async function collectSnapshot(api, {owner, limit=3, now=()=>new Date().toISOString()}) {
  if (!LOGIN.test(owner||'')) throw new Error('Invalid account name');
  if (!Number.isInteger(limit) || limit<1 || limit>100) throw new Error('Limit must be 1..100');
  const listing = await getAllPages(api, '/user/repos?affiliation=owner,collaborator,organization_member');
  if (!listing.complete) throw new Error('Repository list incomplete: no snapshot will be saved');
  const eligible = listing.items.filter(r=>r?.owner?.login?.toLowerCase()===owner.toLowerCase() && FULL_NAME.test(r.full_name||''));
  const unique = [...new Map(eligible.map(r=>[r.id,r])).values()]
    .sort((a,b)=>a.full_name.localeCompare(b.full_name));
  const projects=[];
  for(const repo of unique.slice(0,limit)) {
    const full=repo.full_name, branch=repo.default_branch;
    if(!/^[a-z0-9_.\/-]+$/i.test(branch||'')) throw new Error('Invalid default branch metadata');
    let sha=null, shaState='UNKNOWN';
    try {
      const b=await api('/repos/'+full+'/branches/'+encodeURIComponent(branch));
      if(SHA.test(b?.commit?.sha||'')){sha=b.commit.sha;shaState='VERIFIED';}
    } catch { /* never infer a missing SHA */ }
    const getItems = async kind => {
      try {
        const x=await getAllPages(api, '/repos/'+full+'/'+kind+'?state=open');
        return { state:x.complete?'VERIFIED':'INCOMPLETE',items:x.items };
      } catch { return { state:'UNKNOWN',items:[] }; }
    };
    const prs=await getItems('pulls'), issues=await getItems('issues');
    const trueIssues=issues.items.filter(i=>!i.pull_request);
    projects.push({
      repositoryId:repo.id, fullName:full, visibility:repo.private?'private':'public',defaultBranch:branch,
      defaultHead:{sha,state:shaState},
      openPRs:{state:prs.state,count:prs.state==='VERIFIED'?prs.items.length:null,
        atLeast:prs.items.length,items:prs.items.map(p=>({number:p.number,draft:!!p.draft,
          headSha:SHA.test(p.head?.sha||'')?p.head.sha:null,base:p.base?.ref||null}))},
      openIssues:{state:issues.state,count:issues.state==='VERIFIED'?trueIssues.length:null,
        atLeast:trueIssues.length,numbers:trueIssues.map(i=>i.number)}
    });
  }
  return {format:'BWD-COMPASS-REGISTRY-V1',observedAt:now(),owner,
    coverage:limit>=unique.length?'ALL_ACCESSIBLE_FOR_OWNER':'PARTIAL',
    discoveredOwnerRepositories:unique.length,inspectedRepositories:projects.length,projects,
    source:'GitHub CLI read-only authenticated API',
    caveat:'No host, CI, local-worktree, acceptance or deployment claim. PRIVATE ONLY.'};
}

export function privateDir(env=process.env) {
  return process.platform==='win32'
    ? join(env.LOCALAPPDATA||join(homedir(),'AppData','Local'),'BWDProjectCompass','private')
    : join(env.XDG_DATA_HOME||join(homedir(),'.local','share'),'bwd-project-compass','private');
}
export function assertOutsideGit(path) {
  let dir=resolve(path);
  while(true) {
    if(existsSync(join(dir,'.git')))throw new Error('Refusing private output inside a Git working tree');
    const up=dirname(dir);if(up===dir)break;dir=up;
  }
}
export function saveEncrypted(envelope, folder=privateDir()) {
  assertOutsideGit(folder);mkdirSync(folder,{recursive:true,mode:0o700});assertOutsideGit(folder);
  const filename=join(folder,'latest.snapshot.enc.json'),temp=join(folder,'.snapshot-'+process.pid+'.tmp');
  try {
    writeFileSync(temp,JSON.stringify(envelope)+'\n',{encoding:'utf8',mode:0o600,flag:'wx'});
    renameSync(temp,filename);
  } finally {if(existsSync(temp))rmSync(temp,{force:true});}
  return filename;
}
function gh(path) {
  const r=spawnSync('gh',['api','-X','GET',path],{encoding:'utf8',windowsHide:true,maxBuffer:16*1024*1024,timeout:25000});
  if(r.error || r.status!==0)throw new Error('GitHub API GET unavailable: check permissions, gh auth status and rate limit');
  try{return JSON.parse(r.stdout);}catch{throw new Error('Invalid GitHub API response');}
}
function hiddenInput(message) {
  if(!process.stdin.isTTY || !process.stdin.setRawMode)throw new Error('Interactive terminal required');
  return new Promise((resolve,reject)=>{
    let value='';process.stdout.write(message);process.stdin.setRawMode(true);
    process.stdin.resume();process.stdin.setEncoding('utf8');
    const finish=(err)=>{
      process.stdin.off('data',onData);process.stdin.setRawMode(false);
      process.stdin.pause();process.stdout.write('\n');
      err?reject(err):resolve(value);
    };
    const onData=(s)=>{for(const c of s){
      if(c==='\r'||c==='\n'){finish();return;}
      if(c==='\u0003'){finish(new Error('Cancelled'));return;}
      if(c==='\u007f'||c==='\b')value=value.slice(0,-1);
      else if(c>=' ')value+=c;
    }};
    process.stdin.on('data',onData);
  });
}
async function main() {
  const args=process.argv.slice(2);
  if(args.length===0 || args.includes('--help')) {
    console.log('Usage: node tools/private-sync/sync.mjs --check OR --collect --owner ACCOUNT --limit 3 --ack-private-local');
    return;
  }
  if(args.length===1 && args[0]==='--check') {
    const r=spawnSync('gh',['--version'],{encoding:'utf8',windowsHide:true,timeout:10000});
    console.log('Node '+process.version+'; GitHub CLI '+(r.status===0?'installed':'NOT INSTALLED'));
    console.log('Private output directory: '+privateDir());return;
  }
  const allowed=new Set(['--collect','--owner','--limit','--ack-private-local']);
  if(args.some(a=>a.startsWith('--')&&!allowed.has(a)))throw new Error('Unknown argument');
  if(!args.includes('--collect')||!args.includes('--ack-private-local'))throw new Error('Explicit local opt-in required');
  const val=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
  const owner=val('--owner'),limit=Number(val('--limit')||3);
  if(!LOGIN.test(owner||'')||!Number.isInteger(limit)||limit<1||limit>100)
    throw new Error('Provide --owner ACCOUNT and --limit 1..100');
  const auth=spawnSync('gh',['auth','status'],{encoding:'utf8',windowsHide:true,timeout:15000});
  if(auth.status!==0)throw new Error('GitHub CLI is not authenticated; run gh auth login');
  console.log('Reading GitHub metadata into memory (no public upload)...');
  const record=await collectSnapshot(gh,{owner,limit});
  const passphrase=await hiddenInput('Encryption passphrase (12+ characters; not echoed): ');
  const path=saveEncrypted(encryptSnapshot(record,passphrase));
  console.log('Encrypted snapshot saved to '+path);
  console.log('Inspected '+record.inspectedRepositories+' repositories; '+record.coverage+'. No host or deployment state verified.');
}
const isMain=process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain)main().catch(e=>{console.error('PC-03 stopped safely: '+e.message);process.exitCode=1;});
