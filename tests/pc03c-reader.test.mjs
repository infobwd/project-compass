import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { encryptSnapshot, decryptSnapshot } from '../tools/private-sync/sync.mjs';
import { verifySelectedSnapshot, observedFreshness, buildEvidenceSummary, formatEvidenceSummary } from '../tools/private-sync/summary.mjs';

const owner='sample-owner',names=[owner+'/demo-one',owner+'/demo-two'];
const sha='a'.repeat(40);
function fixture(){
 return {
  format:'BWD-COMPASS-REGISTRY-V1',owner,coverage:'ALL_SELECTED',
  selection:{mode:'EXPLICIT',requested:2,matched:2},
  observedAt:'2026-11-01T00:00:00.000Z',inspectedRepositories:2,
  projects:[
   {fullName:names[0],defaultBranch:'main',defaultHead:{state:'VERIFIED',sha},
    openPRs:{state:'VERIFIED',count:3,atLeast:3},
    openIssues:{state:'VERIFIED',count:2,atLeast:2}},
   {fullName:names[1],defaultBranch:'master',defaultHead:{state:'UNKNOWN',sha:null},
    openPRs:{state:'UNKNOWN',count:null,atLeast:0},
    openIssues:{state:'VERIFIED',count:0,atLeast:0}}
  ]
 };
}
test('selected snapshot validates strictly and preserves default branch distinction',()=>{
 const r=verifySelectedSnapshot(fixture(),names);
 assert.equal(r.projects[1].defaultBranch,'master');
});
test('does not mistake a selected registry for complete global coverage',()=>{
 const r=buildEvidenceSummary(fixture(),names,Date.parse('2026-11-01T01:00:00Z'));
 assert.equal(r.count,2);
 assert.equal(r.pullRequests.total,null);
 assert.equal(r.pullRequests.knownOpen,3);
 assert.equal(r.pullRequests.unknownProjects,1);
 assert.equal(r.issues.total,2);
 assert.equal(r.deployment,'NOT_VERIFIED');
 assert.equal(r.acceptance,'NOT_VERIFIED');
});
test('fully verified PRs and Issues use nested counts, including nonzero and zero',()=>{
 const s=fixture();
 s.projects[1].openPRs={state:'VERIFIED',count:4,atLeast:4};
 const result=buildEvidenceSummary(s,names,Date.parse('2026-11-01T01:00:00Z'));
 assert.equal(result.pullRequests.knownOpen,7);
 assert.equal(result.pullRequests.total,7);
 assert.equal(result.issues.knownOpen,2);
 assert.equal(result.issues.total,2);
 const output=formatEvidenceSummary(result);
 assert.match(output,/Open PRs: 7 total; 7 from 2 verified repositories/);
 assert.match(output,/Open Issues: 2 total; 2 from 2 verified repositories/);
 assert.doesNotMatch(output,/NaN/);
});
test('partially unavailable counts are UNKNOWN not NaN or zero',()=>{
 const r=buildEvidenceSummary(fixture(),names,Date.parse('2026-11-01T01:00:00Z'));
 assert.equal(r.pullRequests.total,null);
 assert.equal(r.pullRequests.knownOpen,3);
 assert.equal(r.pullRequests.unknownProjects,1);
 const output=formatEvidenceSummary(r);
 assert.match(output,/Open PRs: UNKNOWN total; 3 from 1 verified repositories; 1 unknown/);
 assert.doesNotMatch(output,/NaN/);
});
test('aggregate report does not expose repository identifiers',()=>{
 const data=buildEvidenceSummary(fixture(),names,Date.parse('2026-11-01T01:00:00Z'));
 const plain=formatEvidenceSummary(data);
 assert.doesNotMatch(plain,/sample-owner\/demo-/);
 assert.match(plain,/Open PRs: UNKNOWN total/);
 assert.match(plain,/Host deployment: NOT VERIFIED/);
 const details=formatEvidenceSummary(data,{details:true});
 assert.match(details,/sample-owner\/demo-one/);
 assert.match(details,/master/);
});
test('denies incorrectly counted or incomplete selected snapshot',()=>{
 const s=fixture();s.selection.requested=3;
 assert.throws(()=>verifySelectedSnapshot(s,names));
 const s2=fixture();s2.coverage='PARTIAL';
 assert.throws(()=>verifySelectedSnapshot(s2,names));
});
test('denies wrong selection, duplicate, invalid counts and malicious terminal control names',()=>{
 const s=fixture();s.projects[1].fullName=names[0];
 assert.throws(()=>verifySelectedSnapshot(s,names));
 const s2=fixture();s2.projects[0].openPRs.count=0;
 assert.throws(()=>verifySelectedSnapshot(s2,names));
 const s3=fixture();s3.projects[0].fullName='evil\u001b[31m/attacker';
 assert.throws(()=>verifySelectedSnapshot(s3,names));
});
test('denies malformed Git evidence or branch names',()=>{
 const s=fixture();s.projects[0].defaultBranch='main\u001b[2J';
 assert.throws(()=>verifySelectedSnapshot(s,names));
 const s2=fixture();s2.projects[0].defaultHead.sha='not-a-sha';
 assert.throws(()=>verifySelectedSnapshot(s2,names));
});
test('observed freshness reports recent, aging, stale and clock skew',()=>{
 const t=Date.parse('2026-11-01T00:00:00Z');
 assert.equal(observedFreshness('2026-11-01T00:00:00Z',t+1000).state,'RECENT');
 assert.equal(observedFreshness('2026-11-01T00:00:00Z',t+25*3600000).state,'AGING');
 assert.equal(observedFreshness('2026-11-01T00:00:00Z',t+73*3600000).state,'STALE');
 assert.equal(observedFreshness('2026-11-01T00:00:00Z',t-600000).state,'CLOCK_SKEW');
});
test('AES-256-GCM encrypted selected snapshot can be read without persistence',()=>{
 const r=fixture(), pass='test-only-long-passphrase';
 const envelope=encryptSnapshot(r,pass);
 assert.deepEqual(buildEvidenceSummary(decryptSnapshot(envelope,pass),names,
   Date.parse('2026-11-01T01:00:00Z')).count,2);
 assert.doesNotMatch(JSON.stringify(envelope),/sample-owner/);
 assert.throws(()=>decryptSnapshot(envelope,'incorrect-but-long-passphrase'));
});
test('reader CLI help works and detail requires explicit acknowledgment',()=>{
 const script=fileURLToPath(new URL('../tools/private-sync/read.mjs',import.meta.url));
 const help=spawnSync(process.execPath,[script,'--help'],{encoding:'utf8'});
 assert.equal(help.status,0);
 assert.match(help.stdout,/--details --ack-private-terminal/);
 const invalid=spawnSync(process.execPath,[script,'--details'],{encoding:'utf8'});
 assert.notEqual(invalid.status,0);
 assert.match(invalid.stderr,/--summary or --details --ack-private-terminal/);
});
