# PC-04O O3-V — Fictional Visual QA for the REAL Private UI Implementation

**2026-11-02 (Asia/Bangkok) — stacked Draft, NO Merge/Deploy/real data.**

## Why an additional launcher is necessary

The pre-existing `auth-synthetic.mjs` is an older *different* D2 synthetic UI. It does **not** show the newly implemented PC-04O project search. This QA-only launcher calls the same `startOwnerLocalServer` function used by the real private browser with a freshly constructed **in-memory fictional projection**, so the owner can inspect the *actual new search UI* at 390×844, 1024×768 and desktop.

The launcher `tools/private-ui/pc04o-fictional-visual.mjs` has no Snapshot/Workplan/passphrase/Host/GitHub read, and rejects any process with `BWD_COMPASS_PRIVATE_DIR` set before it imports the real private UI module. The browser is loopback-only. A new three-test file checks invented fixture scope, fail-closed private-dir guard, and 401 → 403 → 200 → Logout 204 → 401 access control.

This does **not** loosen any of the human-security gates and does not authorize actual local private Snapshot use on a changed O3 UI head.

## Owner Windows operator flow — manually, no secrets

1. Preserve local changes. Check `git status --short` and **stop if dirty**. Do not use `git reset --hard` or `git clean`.
2. Open a **new PowerShell window**, not the previously authorized private-data terminal. Confirm the private folder environment variable is absent. If present, do not paste/show its value; close that window and open a clean one (prefer a new shell with no inherited configured Private environment).
3. Switch to this QA Draft branch and confirm HEAD against the PR.
4. Run the full Node tests, Build and Public Dist Scan. The previous O3 owner screenshot was **252/252 PASS on the former PR #34 branch**; new launcher adds 3 tests, so **255 expected but not yet verified**.
5. Only then start the imaginary portfolio browser.

```powershell
Set-Location '<YOUR_EXISTING_PROJECT_COMPASS_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/qa/pc04o-o3-fictional-visual-preview-20261102
git branch --show-current
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check

if ($env:BWD_COMPASS_PRIVATE_DIR) { throw 'STOP: use clean PowerShell' }
node tools/private-ui/pc04o-fictional-visual.mjs
```

If the branch already exists in the worktree, use `git switch qa/pc04o-o3-fictional-visual-preview-20261102` instead of `--track`.

The CLI prints a temporary `http://127.0.0.1:PORT/` and a one-time **fictional** pairing code. Do not send the code or authenticated browser cookies into the chat/GitHub. Open this URL only in the same owner's trusted Chrome on the same Windows computer. It is safe to test because all project names are invented.

## Visual acceptance matrix

| Check | Expected |
|---|---|
| Locked / before pairing | No project names, counts or search field; no private data; protected API 401 |
| After pairing but before details | Summary available; search field hidden; `/api/projects` 403 |
| After explicit details step-up | Four fictional project cards visible; search field appears and has an accessible label |
| Search `alpha` | One fictional card; label reports 1 of 4; no network request on keystroke |
| Search nonsense text | Neutral "no matching project" message; **never** says all work finished |
| Clear query | All four fictional cards return |
| Logout | Browser shows LOCKED; search/input/cards cleared; API 401 for stale cookie |
| 390×844 mobile | No horizontal overflow, search reachable and not clipped by lower edge, 44px targets |
| 1024×768 tablet | Readable 2-column axes, labels wrap, keyboard focus works |
| 1440×900 desktop | Main content centered, search and cards readable, no overflow |
| Security/operational | No real file opens, no HTTP writer, no private data in public dist; Ctrl+C closes server |

Use Chrome DevTools → **Toggle device toolbar**, enter each viewport, refresh as needed **only while on fictional preview**. If a refresh returns LOCKED, re-pair by restarting the fictional launcher (one-time pairing) and continue; do not bypass the session controls.

**STOP / HOLD** if any actual project data appears or private directory env is configured; if search shows before details opt-in; if Logout fails to clear UI; if tests fail; or if a non-loopback address appears.

## Evidence classification and promotion decision

- The preceding PR #34 has **owner-observed** automated tests 252/252 PASS, Build/Public Dist PASS and static Preflight PASS, but not independently proven exact SHA from screenshot.
- This new QA branch has **three authored tests and source read-back only**; no Windows test result/Chrome viewport evidence yet. Do not carry 252/252 or screenshots over as this branch's acceptance.
- Existing M1/M4 owner conditional risk acceptance, M2 synthetic acceptance, narrow M3 authorization and M5 hold remain unchanged.
- The launch is manual; no PR in the private stack may be merged to PUBLIC `main` for preview. No automatic TODO, real snapshot/Workplan load, GitHub write, merge, deploy, refresh/activate or production acceptance.
