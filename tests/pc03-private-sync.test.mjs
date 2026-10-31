import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { encryptSnapshot, decryptSnapshot, getAllPages, collectSnapshot, assertOutsideGit, saveEncrypted, privateDir } from '../tools/private-sync/sync.mjs';

const sha='a'.repeat(40),owner='example-owner',full=owner+'/example-app';
const repo={id:4,full_name:full,owner:{login:owner},private:true,default_branch:'main'};
const fake=async uri=>{
  if(uri.startsWith('/user/repos'))return [repo];
  if(uri.includes('/branches/'))return {commit:{sha}};
  if(uri.includes('/pulls?'))return [{number:11,draft:true,head:{sha},base:{ref:'main'}}];
  if(uri.includes('/issues?'))return [{number:11,pull_request:{url:'example'}},{number:8}];
  throw new Error('Unexpected request');
};
test('read-only collector correctly separates repo, PR and true Issues',async()=>{
  const s=await collectSnapshot(fake,{owner,limit:3,now:()=> '2026-11-01T00:00:00.000Z'});
  assert.equal(s.projects.length,1);assert.equal(s.projects[0].defaultHead.sha,sha);
  assert.equal(s.projects[0].openPRs.count,1);assert.equal(s.projects[0].openIssues.count,1);
  assert.equal(s.projects[0].openIssues.numbers[0],8);assert.equal(s.coverage,'ALL_ACCESSIBLE_FOR_OWNER');
});
test('limited collection honestly reports PARTIAL',async()=>{
  const withTwo=async uri=>uri.startsWith('/user/repos')?[repo,{...repo,id:5,full_name:owner+'/more'}]:fake(uri);
  const s=await collectSnapshot(withTwo,{owner,limit:1});assert.equal(s.coverage,'PARTIAL');
});
test('failed metadata read is UNKNOWN, not zero',async()=>{
  const bad=async uri=>uri.includes('/pulls?')?Promise.reject(new Error('forbidden')):fake(uri);
  const s=await collectSnapshot(bad,{owner,limit:3});assert.equal(s.projects[0].openPRs.state,'UNKNOWN');
  assert.equal(s.projects[0].openPRs.count,null);
});
test('AES-GCM encrypted round-trip and bad passphrase rejection',()=>{
  const item={projects:[{id:3}],description:'fictional'};
  const x=encryptSnapshot(item,'example-long-passphrase');
  assert.deepEqual(decryptSnapshot(x,'example-long-passphrase'),item);
  assert.throws(()=>decryptSnapshot(x,'another-long-passphrase'));
  assert.doesNotMatch(JSON.stringify(x),/fictional/);
});
test('invalid passphrase and ciphertext are rejected',()=>{
  assert.throws(()=>encryptSnapshot({},'short'));
  const x=encryptSnapshot({ok:true},'example-long-passphrase');
  x.tag=Buffer.alloc(16).toString('base64');
  assert.throws(()=>decryptSnapshot(x,'example-long-passphrase'));
});
test('absolute custom private directory can live on another drive; relative path denied',()=>{
  const requested=join(tmpdir(),'bwd-compass-private-fixture');
  assert.equal(privateDir({BWD_COMPASS_PRIVATE_DIR:requested}),resolve(requested));
  assert.throws(()=>privateDir({BWD_COMPASS_PRIVATE_DIR:'private'}),/absolute path/);
  assert.throws(()=>privateDir({BWD_COMPASS_PRIVATE_DIR:''}),/absolute path/);
});
test('Git worktree output is blocked',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'compass-git-'));
  try{mkdirSync(join(tmp,'.git'));assert.throws(()=>assertOutsideGit(join(tmp,'private')));
    assert.throws(()=>saveEncrypted({ok:true},join(tmp,'private')));}
  finally{rmSync(tmp,{recursive:true,force:true});}
});
test('output to safe OS folder contains only encrypted envelope',()=>{
  const tmp=mkdtempSync(join(tmpdir(),'compass-safe-'));
  try{const x=encryptSnapshot({secret:'synthetic'},'example-long-passphrase');
    const path=saveEncrypted(x,join(tmp,'private'));
    assert.equal(existsSync(path),true);assert.match(path,/latest\.snapshot\.enc\.json$/);}
  finally{rmSync(tmp,{recursive:true,force:true});}
});
test('API pagination reports INCOMPLETE when capped',async()=>{
  const p=await getAllPages(async()=>Array(100).fill({n:1}),'/fictional',2);
  assert.equal(p.complete,false);assert.equal(p.items.length,200);
});
test('invalid owner or malformed list fails closed',async()=>{
  await assert.rejects(collectSnapshot(fake,{owner:'bad/name',limit:1}));
  await assert.rejects(collectSnapshot(async()=>({error:'invalid'}),{owner,limit:1}));
});
