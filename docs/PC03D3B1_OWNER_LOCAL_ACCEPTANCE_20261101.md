# PC-03D3B-1 — Owner-reported Local Acceptance (Synthetic Security Tests)

**Recorded:** 2026-11-01, Asia/Bangkok.  
**Decision:** `LOCAL_ACCEPTANCE_OWNER_REPORTED_PASS_WITH_EVIDENCE_LIMITS`, synthetic-only.

## Evidence accepted
Owner replied **“ผ่านทั้งหมด ดำเนินการต่อ”** after receiving the instructions to run the D3B-1 Windows test/build/public scan/security-preflight and manual synthetic Logout → refresh → unauthorized HTTP 401 checks. This is an explicit owner-reported **PASS for the requested test sequence**, not a pasted exact-HEAD test log or independent CI run.

| Check | Current verdict | Source/limits |
| --- | --- | --- |
| Six newly introduced synthetic hostile-origin scenarios | OWNER_REPORTED PASS | Full tests summary / exact Windows SHA not independently attached in the acceptance message |
| Node test suite (80 expected, not directly observed) | OWNER_REPORTED PASS; **numeric count unverified** | Do not assert 80/80 independently without the Windows output |
| Vite build and public-dist scan | OWNER_REPORTED PASS | Previous D3B-0 74/74/build/scan screenshot exists; D3B-1 is a different HEAD |
| Five source isolation checks and blocked real-data gate | OWNER_REPORTED PASS | Latest exact D3B-1 log not attached; gate MUST remain BLOCKED |
| Synthetic browser pairing, logout, refresh, unauthenticated /api/summary, /api/projects, /api/evidence | OWNER_REPORTED PASS | Individual 401 responses were not independently captured |
| Exact `git rev-parse HEAD` for local Windows tests | **NOT VERIFIED** | Owner did not attach its output |
| Host deployment, private UI hardening, real Snapshot data in browser | **NOT VERIFIED / NOT AUTHORIZED** | No real-data work performed |
| Historic public Git commit exposure | **OPEN HUMAN DECISION** | Latest branch redaction does not erase history |

## Closure boundaries
D3B-1 synthetic regression pilot is accepted for **local experiment continuation**, retaining the two evidence limitations: (1) exact Windows-tested SHA and (2) no independent browser/CI security attestation. User's broad PASS confirms their observed manual logout checks but does not authorize sending private data over HTTP.

Real local private browser access is still `BLOCKED_FOR_REAL_PRIVATE_DATA`; the private encrypted Snapshot is for the PC-03C terminal reader only until an additional explicit owner authorization and threat-model review.

## Next safe scope
D3B-2 security review can prepare synthetic browser-boundary regression tests, release checklist and an explicit decision register. No automatic Merge, Deploy, production operation, private Snapshot read, browser access to real repository identities, or rewrite of public Git history.
