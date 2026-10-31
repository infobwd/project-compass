# PC-03D1 — Local Acceptance Record (Owner-Reported)

**Recorded:** 2026-11-01 (Asia/Bangkok)  
**Source:** Owner's Windows PowerShell screenshots and explicit test confirmation in the BWD Project Compass conversation.  
**Scope:** PC-03D1 *synthetic locked local shell only*; **not** PC-03D2 authentication and not Production.

## Observations
| Assertion | Evidence type | Result | Limitation |
| --- | --- | --- | --- |
| Locked synthetic page visible, clearly labeled LOCAL / DEMO / LOCKED | Screenshot supplied by owner | **PASS — OBSERVED IN SCREENSHOT** | No browser network/penetration audit attached |
| NO PRIVATE DATA LOADED banner rendered | Screenshot supplied by owner | **PASS — OBSERVED IN SCREENSHOT** | Confirms visible UI, not proof about all possible side channels |
| TCP listening address is loopback `127.0.0.1` | Windows `Get-NetTCPConnection -State Listen -LocalPort <actual-port>` screenshot | **PASS — OBSERVED IN SCREENSHOT** | Port/PID are deliberately omitted from public log; runtime listener was observed at a point in time |
| Node tests | Owner explicitly confirmed D1 tests passed | **PASS — OWNER REPORTED** | Exact test totals/logs or CI result not independently attached |
| Production Build | Owner explicitly confirmed D1 build passed | **PASS — OWNER REPORTED** | Not independent CI attestation |
| Public Dist Scan | Owner explicitly confirmed D1 scan passed | **PASS — OWNER REPORTED** | Pattern scan does not replace manual privacy review |
| GitHub Draft PR #7 and source files | GitHub connector read-back | **VERIFIED GIT STATE** | Git code does not prove a release |
| Historic public path examples in preceding commits | D0 targeted public source audit | **OPEN PRIVACY REVIEW** | Source replacement on latest branch does not erase Git history |
| Termination / no listener after Ctrl+C | Not reported separately | **NOT VERIFIED** | Owner must stop server and optionally verify socket disappears |
| D2 authenticated private browser access | Not implemented/authorized | **NOT STARTED** | Requires separate human security gate |

## Acceptance
**D1 LOCAL ACCEPTANCE: PASS (owner-reported, partial visual/socket corroboration).** 
Do not elevate this result to HOST_VERIFIED, independent security certification, or D2 authorization. The owner approved PC-03D design and D0/D1 work. Real private-browser authentication and exposure require separate explicit approval and threat-model gate completion.

**Safety boundaries:** No merge; no deploy; no production changes; no private snapshot or selection JSON committed; no GitHub Pages private data. The existing encrypted terminal reader remains the approved working fallback.

## Safe next actions (not performed by this record)
1. Operator: stop the local demo with Ctrl+C and verify it no longer listens on its former loopback port.
2. Owner: review historical public Git metadata exposure and choose documented remediation or explicit risk acceptance; no force-push automatically.
3. Design/implementation: D2 may begin with **fictional auth regression tests only after separate approval**. Do not connect real encrypted selected snapshot to browser or external host until independently reviewed.
