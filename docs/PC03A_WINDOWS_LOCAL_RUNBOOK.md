# PC-03A — Windows PowerShell runbook

**Use a normal PowerShell window; administrator rights are not required.** Do not run commands that delete/reset local work or modify production. Full instructions are also delivered in the conversation.

## Prepare
Check these commands one by one:
```powershell
git --version
node --version
npm --version
gh --version
code --version
```
If missing, install Git for Windows, Node LTS, GitHub CLI or VS Code from the official vendor. If you use winget:
```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id GitHub.cli -e
winget install --id Microsoft.VisualStudioCode -e
```
Install only missing tools, then reopen PowerShell.

GitHub login (owner completes interactive browser step):
```powershell
gh auth login
gh auth status
```
Choose GitHub.com / HTTPS / web browser. Never paste a GitHub token or credential into a chat.

## Clone if absent, or preserve an existing clone
```powershell
# Example location on D: (replace only if your D: folder layout differs)
$workRoot = '<LOCAL_WORK_ROOT>'
$repoPath = Join-Path $workRoot 'project-compass'
New-Item -ItemType Directory -Force -Path $workRoot | Out-Null
Test-Path (Join-Path $repoPath '.git')
```
If False and the directory does not already hold important files:
```powershell
git clone https://github.com/infobwd/project-compass.git "$repoPath"
```
If True, do **not** clone again. Continue:
```powershell
Set-Location "$repoPath"
git status --short
git remote -v
git branch -vv
git worktree list
git fetch origin --prune
git branch -a
```
If `git status --short` is not empty, stop and preserve/review changes before any branch switch. Never use `git reset --hard`, `git clean -fd`, or force checkout as a shortcut.

If the local PC-03 branch does not exist:
```powershell
git switch --track origin/feat/pc03-local-encrypted-github-readonly-20261101
```
If it already exists, inspect and then `git switch feat/pc03-local-encrypted-github-readonly-20261101`.

## PC-02 and PC-03 tests (exact HEAD)
```powershell
git rev-parse HEAD
git status --short
node --test tests/pc03-private-sync.test.mjs
npm install
npm run test
npm run build
npm run check:public-dist
npm run dev
```
Open the local URL Vite prints. Check mobile 390x844, tablet 1024x768 and desktop; search, filters, details, daily brief demo, dark mode, keyboard and browser zoom. Stop Vite with Ctrl+C. Do not call the local URL a deployed Pages site.

## Private encrypted snapshots on D: (NOT inside the Git checkout)
Keep encrypted private metadata outside the public source tree. Use a separate directory
`<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>` for the local snapshot. Never place snapshots under
`<LOCAL_PROJECT_WORKTREE>`.

Set this for the **current PowerShell window** before running --check / --collect:
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
node tools/private-sync/sync.mjs --check
```
The reported private output directory must match the D: location. The collector creates the
directory on its first successful encrypted collection. Avoid printing/sharing its contents.
This setting affects the current shell only; repeat it in a new window. If the user wants
the setting to persist across newly opened PowerShell sessions, choose the Windows user-level
environment variable explicitly:
```powershell
[Environment]::SetEnvironmentVariable('BWD_COMPASS_PRIVATE_DIR', '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>', 'User')
```
Close/reopen PowerShell, then verify with `node tools/private-sync/sync.mjs --check`.
An absolute path is required; paths within any Git worktree are refused. Use a trusted,
access-controlled account and device encryption for D: as well.

## Read-only private collection (separate from demo)
```powershell
node tools/private-sync/sync.mjs --check
gh auth status
node tools/private-sync/sync.mjs --collect --owner infobwd --limit 3 --ack-private-local
```
Enter a separate passphrase (12+ characters) when prompted; input is hidden. The first three inspected owner repositories form a **partial** snapshot when more than three exist.
The script stores only `latest.snapshot.enc.json` in the directory reported by `--check`. With the D: override above:
```powershell
$privateDir = $env:BWD_COMPASS_PRIVATE_DIR
Get-ChildItem "$privateDir" -File | Select-Object Name, Length, LastWriteTime
```
Without this override, it uses the OS application-data default (usually C:).
Never copy this file into the Git clone or public Pages. Only after reviewing the first run, optionally increase `--limit 100` to inspect more accessible owner repositories; this replaces the latest encrypted snapshot.

## What to report back safely
Node/npm/Git/gh version, checked-out HEAD SHA, `npm run test` counts, build outcome, static artifact scan PASS/FAIL, partial/full collection count, and non-sensitive screenshots. Do **not** send token, passphrase, auth screen or private encrypted data.

## Stop conditions
- Git working tree not clean
- Tests fail or build fails
- `gh auth status` not authenticated
- Output would be inside a Git checkout
- A command proposes Merge, Deploy, migration, production credentials or real private data in a public web application

Keep PRs Draft and report the error; do not bypass gates.
