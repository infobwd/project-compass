import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSelection, selectOwnerRepositories } from '../tools/private-sync/selection.mjs';
import { collectSnapshot, encryptSnapshot, decryptSnapshot, saveEncrypted } from '../tools/private-sync/sync.mjs';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const owner='sample-owner', sha='a'.repeat(40);
const first={id:1,full_name:owner+'/first',owner:{login:owner},private:true,default_branch:'main'};
const second={id:2,full_name:owner+'/second',owner:{login:owner},private:true,default_branch:'master'};
const json=names=>JSON.stringify({format:'BWD-COMPASS-SELECTION-V1',owner,repositories:names});
const api=async uri=>{
 if(uri.startsWith('/user/repos'))return [first,second];
 if(uri.includes('/branches/'))return {commit:{sha}};
 if(uri.includes('/pulls?')||uri.includes('/issues?'))return [];
 throw Error('Unexpected API request');
};
test('strict selection parses 2 repository names in requested order',()=>{
 assert.deepEqual(parseSelection(json([second.full_name,first.full_name]),owner),[second.full_name,first.full_name]);
});
test('selection rejects duplicate entries, incorrect owner and extra fields',()=>{
 assert.throws(()=>parseSelection(json([first.full_name,first.full_name.toUpperCase()]),owner));
 assert.throws(()=>parseSelection(json(['different-owner/anything']),owner));
 assert.throws(()=>parseSelection(JSON.stringify({format:'BWD-COMPASS-SELECTION-V1',owner,repositories:[first.full_name],secret:'not allowed'}),owner));
});
test('selection rejects malformed and oversized JSON',()=>{
 assert.throws(()=>parseSelection('not json',owner));
 assert.throws(()=>parseSelection('x'.repeat(32769),owner));
 assert.throws(()=>parseSelection(json([]),owner));
});
test('selection requires every selected repository available, fail closed',()=>{
 assert.throws(()=>selectOwnerRepositories([first],[first.full_name,second.full_name]));
});
test('collect selected repos uses explicit names and marks exact coverage',async()=>{
 const names=parseSelection(json([second.full_name]),owner);
 const r=await collectSnapshot(api,{owner,selectedRepositories:names,now:()=> '2026-11-01T00:00:00Z'});
 assert.equal(r.coverage,'ALL_SELECTED');
 assert.equal(r.inspectedRepositories,1);
 assert.deepEqual(r.projects.map(p=>p.fullName),[second.full_name]);
 assert.equal(r.selection.mode,'EXPLICIT');
 assert.equal(r.selection.requested,1);
 assert.equal(r.discoveredOwnerRepositories,2);
});
test('missing selected repo rejects before a snapshot can be produced',async()=>{
 await assert.rejects(collectSnapshot(api,{owner,selectedRepositories:[owner+'/not-accessible']}));
});
test('new encrypted selected snapshot does not overwrite existing latest snapshot',()=>{
 const folder=mkdtempSync(join(tmpdir(),'bwd-pc03b-'));
 try {
  const pass='synthetic-strong-passphrase';
  const original=encryptSnapshot({mode:'pilot'},pass);
  const selected=encryptSnapshot({mode:'selected',repos:11},pass);
  const existing=saveEncrypted(original,folder);
  const before=readFileSync(existing,'utf8');
  const path=saveEncrypted(selected,folder,'selected.snapshot.enc.json');
  assert.ok(existsSync(path));
  assert.equal(readFileSync(existing,'utf8'),before);
  assert.deepEqual(decryptSnapshot(JSON.parse(readFileSync(path,'utf8')),pass),{mode:'selected',repos:11});
  assert.throws(()=>saveEncrypted(selected,folder,'../escape.json'));
 } finally {rmSync(folder,{recursive:true,force:true});}
});
