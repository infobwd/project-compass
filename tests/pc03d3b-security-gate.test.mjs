import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {auditSources,runPreflight} from '../tools/private-ui/security-preflight.mjs';
const clean={
  syntheticServer:"const HOST = '127.0.0.1'; const mode='SYNTHETIC_ONLY'; if(!session.details)return deny(res,403);",
  publicApp:'export function App(){return null}',
  offlineAdapter:'export function projectOfflineEvidence(){return null}'
};
test('source preflight passes isolated fictional code but STILL blocks real private browser',()=>{
 const r=auditSources(clean);
 assert.equal(r.codeChecksPass,true);
 assert.equal(r.codeChecks.length,5);
 assert.equal(r.realDataBrowserAuthorized,false);
 assert.equal(r.gate,'BLOCKED_FOR_REAL_PRIVATE_DATA');
 assert.ok(r.unresolved.length>=5);
});
test('source preflight catches private adapter import inside HTTP runtime',()=>{
 const result=auditSources({...clean,syntheticServer:clean.syntheticServer+" import './offline-projection.mjs';"});
 assert.equal(result.codeChecksPass,false);
 assert.equal(result.realDataBrowserAuthorized,false);
});
test('preflight rejects private snapshot path inside Public App',()=>{
 const r=auditSources({...clean,publicApp:clean.publicApp+" const t='SELECTED_ENCRYPTED_GITHUB_SNAPSHOT';"});
 assert.equal(r.codeChecksPass,false);
});
test('checked-in code remains isolated, real-data browser gate is BLOCKED',()=>{
 const r=runPreflight();
 assert.equal(r.codeChecksPass,true);
 assert.equal(r.gate,'BLOCKED_FOR_REAL_PRIVATE_DATA');
 assert.equal(r.realDataBrowserAuthorized,false);
});
test('read-only preflight CLI prints blocked gate without storing private data',()=>{
 const file=fileURLToPath(new URL('../tools/private-ui/security-preflight.mjs',import.meta.url));
 const result=spawnSync(process.execPath,[file,'--check'],{encoding:'utf8'});
 assert.equal(result.status,0);
 assert.match(result.stdout,/REAL PRIVATE BROWSER GATE: BLOCKED_FOR_REAL_PRIVATE_DATA/);
 assert.match(result.stdout,/Outstanding human security gates: 5/);
 assert.doesNotMatch(result.stdout,/selected\.snapshot\.enc\.json|projects\.selection\.json|github_pat_/);
});
