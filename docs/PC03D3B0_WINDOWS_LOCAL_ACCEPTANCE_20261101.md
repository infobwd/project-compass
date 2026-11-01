# PC-03D3B-0 — Windows Local Acceptance (Owner Screenshot)

**Evidence recorded:** 2026-11-01, Asia/Bangkok.
**Source:** Owner's Windows PowerShell screenshot provided in BWD Project Compass conversation.
**Acceptance:** **LOCAL TEST AND SOURCE SECURITY PREFLIGHT — PASS (OWNER SCREENSHOT)**.
**Real-data browser gate:** **BLOCKED_FOR_REAL_PRIVATE_DATA** (expected; NOT an error).

## Observations confirmed directly from screenshot

| Gate | Observed result | Confidence / limitation |
| --- | --- | --- |
| `npm run test` | **74 tests / 74 pass / 0 fail** | Screenshot of Windows PowerShell; exact `git rev-parse HEAD` was not visible |
| `npm run build` | **PASS**; Vite 7.3.7; 1,580 modules transformed | Screenshot; does not mean website deployed |
| `npm run check:public-dist` | **PASS**; three text assets; no sourcemaps or listed sensitive patterns | Targeted pattern scanning, not comprehensive penetration audit |
| `node tools/private-ui/security-preflight.mjs --check` | **5/5 checks PASS** | Static source isolation only; not a runtime privacy audit |
| Real-private-browser security gate | **BLOCKED_FOR_REAL_PRIVATE_DATA** | Explicitly remains blocked; this is correct |
| Outstanding human security gates | **5** | Listed in screenshot; none marked complete just from preflight |
| Real selected Snapshot in browser | **NOT STARTED / NOT AUTHORIZED** | No evidence of a real-data HTTP/UI path |
| Tested Windows Git SHA | **NOT VERIFIED** | Screenshot did not show `git rev-parse HEAD`; matching output suggests D3B-0 but does not independently prove exact SHA |

## Decision

**D3B-0 local implementation test acceptance: PASS on owner evidence.** This closes the **source-check/adapter pilot acceptance only**, with no implied production, CI, full security certification, or authorization for real browser use.

Unresolved blockers to D3B-1 real-data browser access:
1. D0 historical public Git path exposure: documented owner remediation or risk-acceptance decision (never force-push as a side effect).
2. Exact Windows-tested SHA plus manual Logout → Refresh and no-session `/api/summary`, `/api/projects`, `/api/evidence` HTTP 401 evidence.
3. Separate explicit owner approval **specifically for real private-data browser access**.
4. Threat-driven hostile-origin, DNS-rebinding, CSRF, cookie/session, no-store and local malicious process testing, beyond source-string checks.
5. Owner-controlled terminal unlock, private in-memory projection, data minimization, logout/idle expiry, public build isolation and no plaintext persistence acceptance.

Next safe scope: develop separate **fictional-only** threat/regression tests and prepare human authorization matrix without touching selected encrypted Snapshot. No merge/deploy.

**Do not copy private snapshots, passphrases, repository list, or real project status into this public repository. No Merge / No Deploy / No Production writes.**
