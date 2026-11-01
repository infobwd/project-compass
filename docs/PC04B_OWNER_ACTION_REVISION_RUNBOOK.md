# PC-04B — Owner Action Entry & Encrypted Workplan Revisions

**STATUS: Code pilot on Draft branch. Windows exact-HEAD tests pending. No Merge / Deploy.**

## Verified preceding owner evidence (PC-04A)
Owner's 2026-11-01 Windows PowerShell screenshot shows `--check` reported no existing workplan, `--init` created the encrypted workplan for **11 selected projects** without overwriting, then `--summary` read it back. Initial states: ownerReviewed **0**, openActions **0**, overdueActions **0**, decisionsPending **11**, hostReviewedByOwner **0**. These figures are **empty-plan defaults**, NOT evidence that the real projects have zero unfinished work. [Sanitized record](PC04A_OWNER_INIT_ACCEPTANCE_20261101.md). Exact PC-04A test SHA, Node test/build/public scan remain separately unverified.

## What PC-04B adds
- `tools/private-plan/action-entry.mjs`: interactive terminal-only **`--add-action`**. User chooses the project by **index 1–11** from the validated selected-snapshot order, enters an action title, priority P0–P3, HUMAN or AI_ASSIST responsibility, optional due date, next step and reason, then must type **CONFIRM** to save.
- New action begins as `TODO`; there is **no auto DONE**, no host acceptance or deployment inference. `AI_ASSIST` means an optional planning label, not permission to merge, deploy or execute commands.
- No plaintext CSV/JSON intermediary, GitHub writes, browser endpoint, remote sync or public Pages change.
- `tools/private-plan/workplan-revision.mjs`: validate exact owner-selected scope and allowed action contract; inspect SHA-256 digest of current **encrypted** file; require explicit `confirmed=true`; acquire exclusive lock file; re-read under lock, reject stale revision; copy an **encrypted backup** with a unique non-overwriting name; write new encrypted envelope to exclusive same-directory temporary file; replace current file; remove temporary and lock.
- If another editor holds the lock, or the contents changed after review, operation must fail **without overwriting silently**. Existing workplan and Backup are never uploaded.
- The AES-GCM/scrypt password is the existing PC-03B encrypted Snapshot/workplan passphrase, entered only in PowerShell. JavaScript memory/Windows swap cannot be guaranteed securely wiped.

## Why real status is still UNKNOWN
A GitHub Snapshot says what was observed in GitHub, not whether school work is completed. PC-04B adds **owner-authored next actions** only. Development acceptance still requires OWNER_REVIEW evidence; host verification still requires HOST_CHECK; DONE_BY_OWNER still requires owner evidence. Later PC-04C will display these owner-private actions through a separately secured local interface only after review. Public GitHub Pages continues to show fictional `DEMO MODE`.

## PC-04B acceptance on Windows D:
Stop a running Node private UI server with Ctrl+C before switching to avoid old processes, preserve local modifications:

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04b-owner-action-encrypted-revisions-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the branch already exists, use `git switch feat/pc04b-owner-action-encrypted-revisions-20261101`; never force `reset --hard` or `git clean`. Prior expected test total was ~110 (unverified on PC-04A); six more tests suggest ~116 if there were no other changes. **Expected count is not a test result.** Require `fail 0`, Build PASS, Public Dist final PASS and 5/5 source gate PASS. Source preflight may deliberately report `BLOCKED_FOR_REAL_PRIVATE_DATA` for general/public release; that is not a failure of the specifically owner-authorized local-only pilot.

**Never run PC-04A `--init` again — owner encrypted file already exists!**

After the exact new tests pass:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_FOLDER_OUTSIDE_GIT>'
node tools/private-plan/workplan-cli.mjs --check
node tools/private-plan/workplan-cli.mjs --summary
```

Check `workplanExists: true`. To **explicitly** add one real next action only when ready:

```powershell
node tools/private-plan/action-entry.mjs --add-action
```

1. Enter existing passphrase only in Terminal (not echoed).
2. Enter project index from **your own Local Private Dashboard's order** — no repository names printed by the command to logs. Confirm the intended index before continuing.
3. Enter actual task/priority/owner/due date/next step/reason. For unverified conditions, describe the specific **review work**, not imaginary completion.
4. Check the private preview shown in your Terminal. **Type `CONFIRM`** only if correct. Any other input cancels without writing.
5. Successful save creates **one encrypted backup** of the old file and writes the revised encrypted workplan; it does not modify selected Snapshot or send real project data to GitHub. If a lock/conflict error occurs, STOP and investigate; do not delete a lock or backup blindly.
6. Rerun `node tools/private-plan/workplan-cli.mjs --summary`. After one TODO was explicitly saved, `openActions` should increase by one, **not** `ownerReviewed` or `hostReviewedByOwner`. This is a locally entered task, NOT a completion claim.
7. Backups are encrypted but may accumulate; defer any retention/deletion policy until reviewed. Windows NTFS mode 0600 semantics are not a substitute for OS account permissions / BitLocker.

If the user is not ready to enter an actual task, complete only automated tests and `--check`/`--summary`; no data mutation needed to accept the code pilot.

## Known limitations / next phases
- Windows `renameSync` replacement can fail due to open file/antivirus; an error should leave old encrypted data intact and the backup available. **Actual Windows file replacement still needs testing**; do not infer atomic durability across crashes or power loss.
- Lock files protect concurrent writes by this tool only; other noncooperating software can still modify files. SHA validation detects changes during the normal locked path, not every adversarial Windows race.
- Current CLI adds a TODO only. Owner-approved evidence additions, status changes and task completion come later, with dedicated user review and robust revision handling.
- Historic PUBLIC Git path examples remain publicly accessible in older experimental commits; owner risk review remains OPEN. No automatic history rewrite or broader remote private access.
- Exact Local Windows test SHA, independent host acceptance and full security/OS threat assessment remain separate evidence gates.
- **No Merge / Deploy / public data injection / production writes.**

Next: PC-04C owner-private read-only action dashboard after the PC-04B local pilot is accepted; PC-04D morning brief with explicit source-freshness and no invented completion.
