# PC-03D2 — Owner Screenshot Visual QA (2026-11-01)

Status: **VISUAL QA PASS FOR SHOWN STATES ONLY**. Do not equate with overall D2 Local Acceptance.

## Evidence and provenance
Owner supplied two browser screenshots of the **synthetic-only** PC-03D2 UI after UX refinement. Screenshots are retained in the chat, **not** checked into this public repository. Images do not include Git HEAD, test logs, browser DevTools, process state, OS viewport metrics or full logout/expiry transitions.

## What is supported by screenshots
| Check | Status | Evidence limit |
| --- | --- | --- |
| PAIRING form absent on the paired screen | PASS / visually observed | Shows post-pair display, not pairing security |
| PAIRED + synthetic-only label | PASS / visually observed | Does not establish session duration or authorization rules |
| Six readable summary metric cards | PASS / visually observed | Displayed counts are fictional |
| Clear UNKNOWN and NOT_VERIFIED labels | PASS / visually observed | No real-host/acceptance check occurred |
| Separate detail section with fictional project cards | PASS / visually observed | Screen shows details after request, not resistance to unauthorized access |
| Details button disabled/relabelled when open | PASS / visually observed | Cannot prove endpoint denial before acknowledgement |
| Logout button visible | PASS / visually observed | **Click/logout revocation NOT YET VERIFIED** |
| Narrow-viewport layout appears readable where shown | PASS / visually observed | Precise 390×844, 1024×768, 1440×900 and zoom QA remain NOT VERIFIED |
| Browser contains actual private registry data | NO EVIDENCE; prohibited in D2 | Only synthetic sample data visible |

## Pending owner acceptance evidence
1. Confirm exact Windows `git rev-parse HEAD` matches the branch under test.
2. Run `npm run test`, `npm run build`, `npm run check:public-dist` on exact HEAD; report PASS/FAIL counts and SHA, but not terminal pairing codes or session cookies.
3. Click Logout, then refresh; verify PAIRING/LOCKED returns, and direct `/api/summary` and `/api/projects` requests deny access (401) without re-pairing.
4. Verify loopback-only actual listen port while server runs, then Ctrl+C, then no listener on that port. No background services.
5. Confirm invalid/replayed/expired codes and hostile Host/Origin failures from automated tests; screenshots are not substitutes for request-level security testing.
6. Review D0 prior public Git path exposure. Existing old commit history remains reachable; human remediation decision open.

No private Snapshot read; no publication of repository names; no merge, deploy, CI or host acceptance inferred.

Next safe decision: **D2 Local Acceptance** requires all test/behavior results above. Real Snapshot browser access remains NOT IMPLEMENTED / NOT AUTHORIZED.
