#!/usr/bin/env node
// PC-03D3B — read-only local security preflight for future private browser integration.
// Inspects only repository SOURCE CODE. Never decrypts snapshots or starts servers.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

function load(relative){
  return readFileSync(fileURLToPath(new URL(relative,import.meta.url)),'utf8');
}
export function auditSources({syntheticServer,publicApp,offlineAdapter}){
  const checks=[
    ['Synthetic HTTP runtime has no private reader import',
      !/offline-projection|private-sync\/read|private-sync\/sync|decryptSnapshot|readFileSync|BWD_COMPASS_PRIVATE_DIR/.test(syntheticServer)],
    ['Public React does not reference offline projection',
      !/offline-projection|PRIVATE_LOCAL_PROJECTION|SELECTED_ENCRYPTED_GITHUB_SNAPSHOT/.test(publicApp)],
    ['Private offline adapter has no HTTP/FS import or filesystem access',
      !/from ['"]node:(?:fs|http|https)|createServer\(|fetch\(|readFileSync\(/.test(offlineAdapter)],
    ['Authentication still requires local loopback',
      syntheticServer.includes("const HOST = '127.0.0.1'")],
    ['Synthetic-only API contract remains present',
      syntheticServer.includes("SYNTHETIC_ONLY") && syntheticServer.includes("if(!session.details)return deny(res,403);")]
  ];
  return {codeChecks:checks.map(([name,pass])=>({name,pass})),
          codeChecksPass:checks.every(([,ok])=>ok),
          // Human-review requirements NEVER become PASS just because code checks pass.
          realDataBrowserAuthorized:false,
          gate:'BLOCKED_FOR_REAL_PRIVATE_DATA',
          unresolved:[
            'D0 historic public Git path exposure: owner security review / remediation decision',
            'Exact Windows-tested commit SHA and manual Logout/Refresh/HTTP 401 evidence',
            'Separate explicit authorization for browser use of actual private Snapshot',
            'Threat-model audit: hostile local process, DNS rebinding, CSRF, sessions, cache, leakage',
            'Live encrypted Snapshot/Private UI acceptance tests after separate authorization'
          ]};
}
export function runPreflight(){
  return auditSources({
    syntheticServer:load('./auth-synthetic.mjs'),
    publicApp:load('../../src/App.tsx'),
    offlineAdapter:load('./offline-projection.mjs')
  });
}
const isMain=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  if(process.argv.length!==3||process.argv[2]!=='--check'){
    console.error('Usage: node tools/private-ui/security-preflight.mjs --check');process.exitCode=1;
  }else{
    const result=runPreflight();
    for(const check of result.codeChecks)console.log((check.pass?'PASS':'FAIL')+' — '+check.name);
    console.log('REAL PRIVATE BROWSER GATE: '+result.gate);
    console.log('Outstanding human security gates: '+result.unresolved.length);
    result.unresolved.forEach((v,i)=>console.log('  '+(i+1)+'. '+v));
    // Keep a visible nonzero exit if an automatable source-safety condition fails.
    // A successful exit never signifies authorization for real private browser data.
    if(!result.codeChecksPass)process.exitCode=1;
  }
}
