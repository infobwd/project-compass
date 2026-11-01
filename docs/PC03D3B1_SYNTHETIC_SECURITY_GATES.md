# PC-03D3B-1 — Security hardening pilot with synthetic data only

**State:** TEST CODE + SECURITY DECISION DESIGN; WINDOWS QA NOT VERIFIED.
**No real private Snapshot use; no decrypt; no private browser authorization.**
This branch is stacked on PC-03D3B-0 and adds **six adversarial tests** of the *existing fictional* local pairing server. D3B-0 was accepted from an owner PowerShell screenshot showing 74/74 pass, Build PASS, public scanner PASS, 5/5 source checks PASS, and `BLOCKED_FOR_REAL_PRIVATE_DATA`.

## What these new tests actually cover
| ID | Adversarial check | Expected |
| --- | --- | --- |
| SYN-01 | Unpaired request to summary/projects/evidence | 401, no fixture identifiers |
| SYN-02 | Paired but without explicit detail step-up | summary 200, project/evidence 403 |
| SYN-03 | Logout with prior cookie; pairing-code replay | All three APIs 401; replay 401 |
| SYN-04 | Forged cookie, foreign Host/Origin and cross-site Fetch metadata | 401/403 with no fixture leak |
| SYN-05 | CSRF-like POST header/content-type manipulations | 403; no detail authorization |
| SYN-06 | Session idle expiration and anonymous static page | 401 after expiry; no token/fixture disclosure |

These are unit/integration tests against a localhost Node HTTP test server with **only fictional fixtures**. They are NOT a browser penetration test, do not cover hostile browser extensions or local malware, and do not authorize exposing real data.

## Real private-browser Security Gate — remains BLOCKED
The phase name "D3B-1" here refers only to *preparatory security tests and decision design*, **not** D3B-1 implementation of real-data HTTP, which remains explicitly unauthorized.

| Gate | Current evidence | Decision |
| --- | --- | --- |
| PC-03D3B-0 automated test and preflight | Owner screenshot 74/74, Build PASS, scan PASS, 5/5 PASS | PASS for source pilot only |
| PC-03D3A five-axis UI with fictional data | Owner screenshot + owner confirmation | Owner-reported PASS |
| Exact Windows-tested HEAD for D2/D3A/D3B | Not shown in prior screenshots | OPEN |
| Manual browser Logout → Refresh + API 401 | Separate manual transcript absent | OPEN |
| D0 historic public commit path exposure | Prior files redacted on a newer branch, older commits remain accessible | OPEN — owner security decision |
| Synthetic hostile-origin regression tests in this PR | Added six cases | QA PENDING |
| Hostile real browser, local-process, extensions, cache and CSRF threat test | Not independently performed | OPEN |
| Owner permission to show actual private 11-project Snapshot in browser | Not granted | **BLOCKED** |
| Private GitHub Pages / host deployment | Not authorized or built | **BLOCKED** |

## D0 public history decision — requires the owner, not an automatic tool
Earlier PUBLIC Git history contains concrete workspace path examples. Changing a newer document does not erase older commits or PR diffs. Options for explicit human review include:
1. **Documented limited-risk acceptance** after confirming paths only (no passwords, access keys, student identities or private snapshot contents) are present, with corresponding mitigation and scope; this is a project security decision, not a claim that prior history is removed.
2. **Approved remediation** if sensitive information is detected: separately plan token rotation and controlled repository visibility/history strategy with impact assessment for collaborators/Pages/links. No automatic force push, destructive history rewrite, repo deletion or visibility change.
3. **Independent security review** before choosing either.

The test branch does not make this choice for the owner.

## Windows local test steps
1. Stop any previously running fictional local server with Ctrl+C.
2. In the existing worktree, check `git status --short` before switching branches and preserve untracked files:
```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git fetch origin --prune
git switch --track origin/test/pc03d3b1-synthetic-hostile-origin-gates-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```
If branch already local, use `git switch test/pc03d3b1-synthetic-hostile-origin-gates-20261101`.
3. Expect **80 tests** only if previous 74 remain unchanged plus six additions. `fail 0` matters more than the predicted total.
4. Preflight MUST still print `REAL PRIVATE BROWSER GATE: BLOCKED_FOR_REAL_PRIVATE_DATA` and five outstanding human gates.
5. Optionally test a *fictional* browser session only; do not type any private passphrase, do not connect private Snapshot. Manual logout and unauthorized API response remain a separate human acceptance gate.
6. Report exact Git SHA, test summary, Build/Scan/Preflight result, and redacted manual Logout/401 statuses. Never paste actual pairing code, session Cookie, private snapshot or selection JSON.

## Real-data phase prerequisites (not executed)
- Human approval of the D0 exposure disposition and explicit authorization specifically to open private local browser data.
- A complete, reviewed trust boundary: terminal-only passphrase, pairing code expiration/retry budget, bind 127.0.0.1, robust Host/Origin/CSRF/session policies, no snapshot raw endpoint or plaintext file, no external requests/telemetry/service worker, no cache and full logout/expiry.
- Minimized private view: source timestamp, exact selected count, `UNKNOWN` instead of guessing, no host deployment inference, step-up before project identifiers. No public React/Pages import.
- Validate threat model on exact code and real-device/desktop behavior **before** making this feature available.

**No Merge. No Deploy. No production operation. No private registry publication.**
