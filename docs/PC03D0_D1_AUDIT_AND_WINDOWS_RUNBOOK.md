# PC-03D0/D1 — Public-source Privacy Audit & Synthetic Locked Local Server

**Status: IMPLEMENTED ON ISOLATED DRAFT BRANCH. NOT MERGED / NOT DEPLOYED.**
Owner approved PC-03D architecture and moving to D0/D1; **not** permission to release private data, expose an authenticated API, perform real-data browser unlock or merge.

## D0: Public-source privacy audit, 2026-11-01

Audited all 14 top-level markdown documents in the parent PC-03D design branch for local drive paths, named internal hosts and explicit repository names.

### Findings and changes
- Concrete Windows workspace-path patterns appeared in the PC-03A Windows runbook (5 occurrences), PC-03B scoped sync runbook (1), PC-03C offline reader runbook (3), and README (1). These may be user-specific even without a token.
- **Updated these four documents on this D1 branch only**: replaced specific drive paths with `<LOCAL_WORK_ROOT>`, `<LOCAL_PROJECT_WORKTREE>`, and `<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>`. These are illustrative placeholders, **not copy/paste PowerShell variables**.
- Other scanned markdown files had no matches for the targeted Windows-path pattern or selected internal-host/repo URL patterns. This is a targeted review, not a universal sensitive-content proof.

### Open security limitation
The **PUBLIC repository's older branches, Draft PR diffs and immutable commit history still contain previous examples**. Changing the newest text does not retroactively erase prior content. Do **not** attempt forced history rewrites, delete PRs, rotate secrets, change visibility or merge by default. Human must decide whether prior path exposure needs a separate documented remediation/incident workflow. If credentials or real sensitive data are discovered, escalate appropriately.

D0 **code/document remediation in current branch: performed.** D0 **historical exposure/remediation acceptance: OPEN / HUMAN REVIEW REQUIRED**. Do not mark full privacy gate PASS.

## D1: Locked synthetic owner-local UI (code shipped in draft)
Run `tools/private-ui/locked-demo.mjs` manually under a trusted Windows account. This is **not a private authenticated Dashboard**.

Security by construction:
- Node built-in HTTP server, forced `127.0.0.1`, random OS port, no LAN/0.0.0.0.
- Only two routes: `/` generic LOCKED DEMO HTML and `/shell.css` local CSS. Every other route, including `/api/summary`, `/session`, `/api/projects`, is 404.
- Reject wrong Host, foreign Origin and cross-site Fetch metadata; reject non-GET/HEAD and request bodies.
- CSP blocks all scripts, connections, images, external fonts and forms; no cookies/session, no service worker, no cache, no telemetry, no external assets.
- No imports of snapshot/selection reader, no passphrase prompt and no decrypted project names; never pretend a synthetic shell is an authenticated real-data app.
- Opening it on an authorized same-machine browser for visual evaluation does not enable device access from a phone/tablet over LAN.

### Windows PowerShell acceptance
Start only after inspecting `git status --short`; preserve existing work and untracked files.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc03d1-local-locked-synthetic-shell-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/locked-demo.mjs
```
If branch is already local, use `git switch feat/pc03d1-local-locked-synthetic-shell-20261101`; never reset/clean forcefully.

The last command prints a random loopback URL such as `http://127.0.0.1:PORT/`. Open that URL **on the same Windows machine**, inspect that it is marked `LOCAL · DEMO · LOCKED` and `NO PRIVATE DATA LOADED`. Press **Ctrl+C** to stop it. No private file must be read or changed. The real PC-03B/C encrypted snapshots are not needed for D1 and should not be opened.

### Verify socket
In a second PowerShell window while the demo runs:
```powershell
Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalAddress -eq '127.0.0.1' } |
  Select-Object LocalAddress,LocalPort,OwningProcess
```
The result may include other local listeners; check the exact port printed by the demo. There must be no D1 listener on `0.0.0.0`, a private LAN address or `::`.

### Acceptance gates and status
| Gate | Expectation | Verified at draft authoring |
| --- | --- | --- |
| GitHub source and branch | D1 code in Draft PR | YES — GitHub read-back after creation |
| Standalone Node tests | locked shell, Host/Origin, methods, headers, routes | NOT YET independently tested on exact HEAD |
| Production Build / public-dist scanner | both PASS; private-ui source not present in dist | NOT VERIFIED on D1 |
| Same-machine browser | responsive 390/1024/1440, zoom, focus | NOT VERIFIED on Windows |
| No private data filesystem access | no snapshot imports/reads in server | source-level check only |
| Loopback listener and shutdown | 127.0.0.1 only, Ctrl+C closes | NOT VERIFIED on Windows |
| D0 historic public metadata | historical exposure fully resolved | NOT RESOLVED |
| User approval for D2 real auth | required separately | NOT GRANTED |

**Do not start D2 authentication or private data browser access until D1 and privacy gates are accepted separately.** Do not Merge/Deploy.
