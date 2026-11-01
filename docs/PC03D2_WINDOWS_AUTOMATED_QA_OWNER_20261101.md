# PC-03D2 — Windows Automated Test & Shutdown Evidence (Owner Screenshot)

**Recorded:** 2026-11-01 (Asia/Bangkok); evidence source: owner's PowerShell screenshot in BWD Project Compass chat. The screenshot itself is not committed to this PUBLIC repository.

**Scope:** PC-03D2 SYNTHETIC-ONLY Local Pairing pilot. No real selected Private Registry or encrypted Snapshot is loaded; no merge or deploy authorized.

## Results checked from screenshot
| Check | Evidence | Verdict | Qualifications |
| --- | --- | --- | --- |
| Node test suite | terminal summary `tests 57`, `pass 57`, `fail 0` | **PASS — screenshot observed** | Full log/CI not independently checked; exact HEAD not visible in this screenshot |
| TypeScript + Vite production build | `npm run build`, `1580 modules transformed`, `built in 3.32s` | **PASS — screenshot observed** | Build of public demo, not private authenticated deployment |
| Public dist pattern scanner | `PASS: public dist scan, 3 text assets, no sourcemaps or listed sensitive patterns` | **PASS — screenshot observed** | Pattern scan cannot certify absence of all sensitive information |
| Listener shutdown | `Get-NetTCPConnection -State Listen -LocalPort 7283 -ErrorAction SilentlyContinue`, no entries returned | **PASS for no listener at this port — screenshot observed** | The screenshot describes 7283 as the D2 port; no complete process/network inventory was performed |
| Pairing state, synthetic summary cards and details | earlier browser screenshots | **PASS for visually shown states** | Does not prove endpoint authorization resistance |
| Logout followed by refresh and unauthorized summary/details denial | no new manual evidence yet | **NOT VERIFIED (manual)** | Automated session/logout test passed as part of test suite |
| Wrong/replayed/expired code / hostile Origin/Host | regression test code and overall 57/57 pass | **PASS — owner machine test suite** | Not independently penetration-tested |
| Git head of Windows execution | not visible in latest screenshot | **NOT VERIFIED in screenshot** | GitHub head for Draft PR #8 was separately checked, not linked to exact local test SHA |
| Old public Git history path exposure remediation | previously documented in D0 | **OPEN HUMAN REVIEW** | Source redaction in newer branch does not erase older commits |

## Acceptance decision
**PC-03D2 synthetic automated QA: PASS (owner Windows screenshot).**  
**PC-03D2 administrative Local Acceptance: CLOSED — OWNER_ACCEPTED_WITH_OPEN_EVIDENCE_EXCEPTIONS** by explicit user instruction on 2026-11-01; see [closure record](PC03D2_OWNER_LOCAL_ACCEPTANCE_CLOSURE_20261101.md). The exact tested commit SHA and interactive Logout → refresh / unauthorized direct API (401) retest remain **NOT VERIFIED**, not passed or waived. No private-data unlock is authorized by this administrative closure.

User action: in PowerShell confirm `git rev-parse HEAD`, then (with new synthetic pairing code on a fresh server only if needed) log in, click Logout, reload, confirm LOCKED and no `/api/summary` or `/api/projects` access without re-pairing. Do not paste code/cookies/screenshots with secrets.

## Safety and next phase
- D0 historical public metadata risk remains **OPEN** for human risk acceptance/remediation.
- Do not connect any real encrypted Snapshot to this D2 server; D3 private-data architecture requires separate explicit consent and security review.
- No Merge; no Deploy; no forced Git reset; no public Pages private API.
