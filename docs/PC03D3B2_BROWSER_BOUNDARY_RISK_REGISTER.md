# PC-03D3B-2 — Browser Boundary, Privacy Review and Real-Data Decision Register

**STATUS:** SYNTHETIC SECURITY REGRESSION PILOT; exact-HEAD Windows QA pending.  
**REAL PRIVATE BROWSER GATE:** `BLOCKED_FOR_REAL_PRIVATE_DATA`.  
**No real encrypted Snapshot accessed, no production branch inference, no HTTP/private data UI created, no Merge / Deploy.**

## 1. Evidence baseline (2026-11-01, Asia/Bangkok)

- D3B-0: owner screenshot showed **74/74 tests PASS**, Build PASS, public-dist scan PASS and source preflight 5/5 PASS with intentional `BLOCKED_FOR_REAL_PRIVATE_DATA`.
- D3B-1: owner stated that all requested tests and synthetic browser/Logout checks passed. Acceptance recorded as **OWNER-REPORTED PASS**; the exact Windows-tested SHA, independently captured 401 statuses and test total were not supplied.
- D3B-2: six new synthetic boundary regression tests added under `tests/pc03d3b2-browser-boundary.test.mjs`, **not yet tested on Windows at this HEAD**.
- D0 old public Git commits: previous user-specific Windows path examples remain in the public Git history; review and final disposition remain OPEN. New branches redacted path literals in current documentation, but that does not undo old public exposure.
- Only synthetic/fictional entities are used in the current HTTP server. Existing PC-03C selected Snapshot, if stored on owner's private drive, is outside Git.

## 2. Browser threat model (specific unresolved risks)

| Threat / weak assumption | Present mitigations in synthetic pilot | Remaining risk for real data | Action before real-data access |
| --- | --- | --- | --- |
| Other websites calling localhost | Exact Host, Origin, Fetch metadata and POST header checks | Non-browser clients and extensions can forge headers; browser behavior needs actual QA | Browser-origin and DNS rebinding tests including unusual Host, proxy, cookie modes |
| HTTP session cookie | HttpOnly, SameSite=Strict, short idle/absolute limits, opaque random token | Loopback is HTTP, not encrypted TLS; no Secure cookie attribute in existing pilot | Explicit transport/session risk review or stronger authenticated local-app architecture |
| Local untrusted process | Loopback-only port, random port | Other programs in same account can connect to 127.0.0.1 and may scrape traffic/memory | Trusted workstation assumption, OS hardening, process/browser trust boundary approval |
| Shoulder surfing/browser extensions | Pairing code shown in terminal and not returned via HTTP | Authenticated browser may expose private data to extensions/devtools/screenshots | Minimized private details, explicit step-up, account/browser privacy procedure |
| Cache/file persistence | no-store/Pragma, no service worker, no export | Browser cache and OS memory are not guaranteed erased; inspector and accessibility output may persist | DevTools Network/Storage QA and no export/file/telemetry checks |
| XSS/data-driven markup | Synthetic UI uses textContent/createElement and restrictive CSP | Unknown real repository names may include unusual Unicode or control characters | Strict serialization + escape/limit tests on private projection and dynamic rendering |
| Snapshot staleness | PC-03C validates observation age and selected scope | Git snapshot cannot certify host deployment or school acceptance | Explicit observedAt, UNKNOWN, stale/error markers; separate verified host evidence |
| Public Git history | current document redaction | old commits/PRs may expose concrete local paths | Owner sign-off risk disposition or approved remediation, never unilateral history rewrite |
| Premature unlock or UI import | Preflight source isolation blocks direct imports | Source-check pattern scan is not a security proof | Independent review plus exact build/dist artifacts QA before private module use |

## 3. D3B-2 new synthetic-only automated gates
- BB-01: protected/static/error responses have no-store, deny framing and no permissive CORS.
- BB-02: no endpoints for guessed raw snapshot/config/export; errors contain no sensitive data.
- BB-03: cross-origin attempts cannot grant details authorization.
- BB-04: opaque session token never appears in HTML/CSS/JS/summary response body.
- BB-05: absolute session expiry rejects even under recurring activity.
- BB-06: explicitly closed loopback server no longer accepts its former port.

These six tests extend the synthetic **test suite only**, do not test real encrypted file access, and do not authorize a browser private-data route. `npm run test` expected **86** only if previous total 80 still holds; the expectation is **not a verified result**.

## 4. Decision gates for a future REAL selected-Snapshot browser
All must be individually resolved and recorded:

- [ ] G1 — D0 public Git history exposure: inspect scope, decide documented risk acceptance or approved remediation; do not auto-rewrite history or rotate credentials without confirmed need and owner direction.
- [ ] G2 — Capture exact Windows-tested Git SHA for the current implementation and manual Logout→Refresh→401 of three protected APIs.
- [ ] G3 — Complete threat review of local HTTP session/possible local-process access, cookie/CSRF/Host/Origin/CORS and browser storage/extension leak channels.
- [ ] G4 — Explicit owner approval **specifically** for real encrypted private GitHub Snapshot data in a local browser; prior "proceed" does not count as this approval.
- [ ] G5 — Build a separate minimal real-data runtime with terminal-only passphrase prompt, in-memory validation, least-privilege projection and no raw snapshot/PR content endpoint. This is **not built here**.
- [ ] G6 — Exact real-data runtime and device QA with local only, no history leakage, no plaintext files, no external network, logout/expiry and carefully verified API responses. Approval is separate from implementation and cannot be substituted by tests of dummy data.
- [ ] G7 — Owner reviews merge/deployment separately. A private local UI does not make GitHub Pages private; no Merge/Deploy by default.

**Current decision:** G1–G7 incomplete; remain **BLOCKED**.

## 5. Windows runbook
Keep the current working directory private and preserve any untracked build files:

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/test/pc03d3b2-browser-boundary-readiness-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the test branch exists locally, use `git switch test/pc03d3b2-browser-boundary-readiness-20261101`. Do not force-reset or delete files. Confirm a source preflight pass is accompanied by `BLOCKED_FOR_REAL_PRIVATE_DATA`.

This phase adds only tests/docs, so you **do not need to start the browser server again** unless investigating a failed test. The prior synthetic authentication server and the PC-03C terminal reader remain unchanged.

## 6. Distinct next owner actions
1. Report exact `git rev-parse HEAD`, overall test count/pass/fail, build PASS, public scan PASS, and security preflight PASS/BLOCKED. No tokens, cookies, passphrases, repo names or private files.
2. Review the D0 public Git exposure choices; decide whether to accept the limited local-path visibility risk or request an audited history/visibility remediation. This requires a separate explicit human action.
3. If real-data local browser access is desired, provide **specific approval for that capability only after security review**, not through a generic "continue" command.

**No Merge / No Deploy / No production changes / No private data publication.**
