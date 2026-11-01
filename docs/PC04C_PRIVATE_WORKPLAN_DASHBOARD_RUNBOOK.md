# PC-04C — Owner-Private Read-only Workplan Dashboard (LOCAL ONLY)

**Status:** Implemented in a stacked Draft branch; exact-HEAD Windows, real-workplan and browser security acceptance **NOT YET VERIFIED**.  
**Approval scope:** user authorized owner-local private registry access on the trusted Windows machine only. GitHub Pages must remain **DEMO-only**. No Merge, Deploy, production writes or automatic completion.

## Evidence lineage

- PC-04A screenshot confirmed an encrypted owner workplan created and read successfully for 11 explicitly selected projects. Its starting aggregate of zero actions means **no workplan entries have been recorded yet**; it is not evidence of zero actual unfinished school/software tasks.
- PC-04B earlier Windows screenshots showed 122/122 tests PASS, Build/Public Scan/Source Preflight PASS, but the old dummy input diagnostic failed. After v2 code improvements, owner replied **"ผ่านทั้งหมด"**. This is **OWNER-REPORTED PASS** for the requested tests and fake input check; no new exact Windows SHA/log or `--add-action` encrypted save/backup evidence was supplied.
- PC-04C adds a read-only browser overlay and 8 fictional-only API/security tests. **New tests are not yet run on Windows**.
- PUBLIC `main` serves only fictional demo content and is not changed by this branch.

## PC-04C behavior

1. The previous `--ack-real-private-local` invocation **continues to open Snapshot-only view**. It does not load workplan data.
2. A separate **explicit** CLI flag `--ack-private-workplan-local` reads the already existing selected encrypted Snapshot **and** `owner-workplan.enc.json` from the owner-controlled private directory outside Git, after a single passphrase prompt in PowerShell. Invalid passphrase/mismatched scope or missing workplan → **no server starts**.
3. Loopback server is bound to `127.0.0.1` on a random port; paired short-lived session and logout/expiry gates unchanged.
4. After pairing only, `GET /api/workplan/summary` returns nonidentifying owner-authored **counts**: registered open/overdue actions, decisions awaiting owner review and projects with recorded owner reviews. It does **NOT** expose repository names, action titles, worktree paths or real Git credentials.
5. Only after `POST /session/details` step-up, `GET /api/workplan/actions` exposes a **minimized** owner-entered action list (repository, task title, priority, TODO/IN_PROGRESS/BLOCKED/DONE_BY_OWNER, responsible HUMAN/AI_ASSIST, due date, next step/reason, recorded update time). It **never** exposes `localWorktree`, `hostUrl`, raw evidence references, underlying encrypted workplan, notes or secrets.
6. The action list is sorted toward open and higher-priority work; capped at 100 display entries with a **truncated** notice if larger. Source status is `OWNER_AUTHORED_LOCAL`, not GitHub live.
7. All strings render via DOM `textContent`. No `innerHTML`, localStorage, service worker, file export, remote fonts, telemetry or network write route.
8. Logout and terminal server close release references to workplan and Snapshot; JS/OS memory cannot be guaranteed wiped. The server responds 401 after logout with old cookies; a different website or local hostile process still requires threat-model controls beyond the pilot.

## Owner Windows testing on D: (no data edits)

Stop old Private UI server with Ctrl+C before switching branch. **Preserve any worktree changes**:

```powershell
Set-Location '<LOCAL_WORKTREE_PATH>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04c-private-workplan-readonly-dashboard-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If local branch already exists, use `git switch feat/pc04c-private-workplan-readonly-dashboard-20261101` (on a clean matching local branch) rather than `--track`. Never force reset or clean. New phase has 8 additional fictional-only tests; **~134 is expected from prior predicted 126, not a confirmed Windows total**. Acceptance requires all tests pass (fail 0), Build PASS and final Public Scan PASS. Generic source preflight may still print `BLOCKED_FOR_REAL_PRIVATE_DATA` for broad/public rollout; this does not authorize public release.

Only after those tests pass, opt in to reading the existing real encrypted Workplan on the trusted Windows computer:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIRECTORY_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-private-workplan-local
```

Enter the **existing** passphrase in PowerShell, not browser or command-line argument. Open the printed exact `http://127.0.0.1:PORT/` on the **same machine**, enter the one-time pairing code. Do not screen-share real project names or passphrase.

### Manual local browser acceptance

- [ ] Browser initially shows LOCKED; unauthenticated `/api/workplan/summary` and `/api/workplan/actions` respond HTTP 401.
- [ ] After pairing, the workplan summary counts appear with an explicit warning that **zero recorded tasks does not mean zero real pending work**. `/api/workplan/actions` must respond 403 until detail step-up.
- [ ] After clicking detail confirmation, the owner-entered task list appears. If the workplan is still empty, it correctly says no **recorded** actions. Do not invent project progress.
- [ ] Review DOM/Network that no local path, private host mapping, raw encrypted file, evidence refs or credentials are sent to browser responses.
- [ ] After Logout, both workplan APIs respond 401 with the old cookie, paired page is locked again, and secrets/details are cleared from the DOM.
- [ ] Press Ctrl+C; the local port stops listening. Windows exact `git rev-parse HEAD` is recorded without publishing private values.

### Adding real tasks (PC-04B, separately)
If desired, owner may add a real TODO using `node tools/private-plan/action-entry.mjs --add-action`, explicitly entering a selected project index, actual title, priority and next step, then the exact **CONFIRM** command. It creates an encrypted backup before revision. **This does not happen automatically from the browser.** After adding an entry, restart the read-only PC-04C server to reload the new encrypted plan. **Never rerun `workplan-cli.mjs --init`** or remove existing files.

## Acceptance boundaries and next
- The actual private TODO count and any saved action/backup remain **NOT VERIFIED** until the owner separately shows nonidentifying `--summary` and confirms a revision.
- PC-04C is a **read-only** overlay; it does not edit tasks, mark DONE, sync GitHub, inspect the host or imply school acceptance.
- D0 old PUBLIC Git commits with Windows-path examples remain a human risk decision before any broader merge. Local HTTP/browser-extension/process risks remain explicit.
- PC-04D next: morning brief based on owner-confirmed action records + Git Snapshot freshness, marked NOT_VERIFIED where evidence absent. No presumed completion.

**No Merge / No Deploy / No Production writes / No private GitHub Pages data.**
