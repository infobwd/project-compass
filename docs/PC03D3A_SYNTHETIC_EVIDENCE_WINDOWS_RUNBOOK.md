# PC-03D3A — Five-Axis Evidence Dashboard (Synthetic Only)

**Status:** Code and tests on a separated Draft branch. **No real private Snapshot browser access authorized, implemented or tested.** No Merge / Deploy / Production writes.

## Grounded baseline / reason for scope
The owner explicitly closed PC-03D2's **synthetic Local Acceptance** with open evidence exceptions. Its latest evidence includes 57/57 Node tests, build and public artifact scan PASS in Windows screenshot; synthetic UI cards appeared correctly. The separate manual Logout→Refresh/API-401 result and the exact tested Windows SHA were not provided. D0 old public Windows path history exposure remains OPEN. The D2 administrative closure does **not** prove a real-data browser security gate.

Therefore PC-03D3A is an intermediate, read-only, fictional-evidence UI extension, not connection to the 11-repository Private Registry.

## Implemented
- `tools/private-ui/synthetic-evidence.mjs`: explicit evidence contract for five independent axes:
  - Development = UNKNOWN
  - Git = SIMULATED (fictional fixture, not a verified GitHub observation)
  - Deployment = NOT_VERIFIED
  - Decision = NEEDS_REVIEW
  - Confidence = DEMO_ONLY
- `observedAt=null` and `source=FICTIONAL_FIXTURE` always. Fictional `Fictional Atlas` / `Sample Orchard` only, not real private repo names.
- `GET /api/evidence` responds **only after a paired session AND explicit details acknowledgement**. Otherwise HTTP 401 or 403; same Host/Origin restrictions as D2, no wildcard routes.
- Five-axis view is rendered using DOM `textContent` and `createElement`; no raw JSON dumps, `innerHTML`, database reads, GitHub network calls, login token in URL or browser localStorage.
- Client hides all private-appearing details on lock/logout. This is **fictional data only**; the view is still not an authenticated true Private Registry.
- Existing D2 synthetic login, summary, details, logout and expiry remain unchanged by design.
- `tests/pc03d3a-synthetic-evidence.test.mjs`: strict contract, rejected invented real verification, unauthorized & pre-step-up endpoint denial, post-step-up and logout, Host/Origin isolation, static UI/source boundaries.

## Evidence-first status logic
Never derive a project's completion from Git default branch, PR count or missing issue count. The five axes are separate. `UNKNOWN` is not `DONE`; `NOT_VERIFIED` is not a failure or acceptance. A fictional record has no observed timestamp and cannot be labeled RECENT. No real host/production state has been checked.

## D3B *future* real-data gate (not authorized here)
Before importing an encrypted selected Snapshot to an HTTP-serving process, do all of the following separately:
1. Receive explicit owner approval **specifically for local real-data browser access** (current "continue" only authorizes D3A, not real data).
2. Re-evaluate D0 historic public path exposure and document risk acceptance or an authorized remediation (no implicit history rewrite).
3. Confirm exact tested Windows SHA and a manual Logout→Refresh→401 / session-expiry check. Regression tests alone are insufficient.
4. Complete hostile-origin, cookie, session fixation/replay, CSRF and DNS-rebinding threat tests against the exact D3 implementation.
5. Enforce terminal-only passphrase, never accept it in browser/URL/history, no accidental static asset or public Pages inclusion.
6. Restrict host bind to 127.0.0.1, no LAN/mobile remote connection; no plaintext snapshot persistence, caching, telemetry, service worker, auto-refresh or host writes.
7. Data flow should use `verifySelectedSnapshot` / `buildEvidenceSummary` with strict selection and total UNKNOWN logic, retaining Git versus deployment/acceptance separation.
8. Review all pages on desktop/tablet/mobile *simulated on the same authorized machine*; do not infer real device internet access or host acceptance.
9. Require explicit independent sign-off before any Merge/Deploy. This phase does not implement D3B.

## Windows D3A acceptance
From the operator's existing local project worktree:
```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc03d3a-synthetic-evidence-axes-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/auth-synthetic.mjs
```
If branch already exists use `git switch feat/pc03d3a-synthetic-evidence-axes-20261101`. Do NOT discard uncommitted changes. Open the printed loopback URL on the same Windows computer and pair with the new one-time **synthetic** terminal code. First confirm the Evidence button is disabled before authorizing project detail. Then click the explicit Detail consent, click **แสดงมิติหลักฐานสมมติ**, confirm both fictional projects show five axes, no actual repository names. Check Logout→Refresh and direct `/api/evidence` returns 401 without pairing. Stop with Ctrl+C, confirm no port listener. Do not share code/cookies.

### Expected
- Automated tests: original 57 plus 5 new tests if no intervening changes, **expect 62 / fail 0**. This is a prediction, not a claimed Windows run result.
- Build: PASS; public dist scanner: PASS.
- POST/GET gating: unauthenticated /api/evidence returns 401; paired but no detail consent returns 403; after consent returns fictional data; after logout returns 401.
- Source shows `FICTIONAL_FIXTURE`, no actual observations.
- Responsive: 390×844 mobile, 1024×768 tablet, 1440×900 desktop, browser zoom 125%/150%/200%.
- Separate Development / Git / Deployment / Decision / Confidence values; no fabricated `DONE`, `PRODUCTION`, `VERIFIED` for actual projects.

## Distinct confidence and outstanding actions
- GitHub source read-back: available and checked; **not** proof of Windows tests or host.
- D2: owner-admin closed with manual Logout and SHA verification exceptions still OPEN.
- D3A: code exists, exact GitHub HEAD static checks planned; owner Windows Local Acceptance NOT VERIFIED.
- D3B: NOT STARTED / NOT AUTHORIZED.
- Production: NOT DEPLOYED from this PR; no automatic Merge or Deploy.
