# PC-04B — Windows Terminal Input Hotfix / Owner Evidence (sanitized)

**Date:** 2026-11-01, Asia/Bangkok. **State:** HOTFIX ON DRAFT PR #17 — full Windows verification still required.

## Observed from owner PowerShell screenshot
- `npm run build`: PASS.
- `npm run check:public-dist`: PASS, three text assets, no listed sensitive patterns/sourcemaps.
- `node tools/private-ui/security-preflight.mjs --check`: five source checks PASS with the **expected** `BLOCKED_FOR_REAL_PRIVATE_DATA` for general/public release.
- `workplan-cli.mjs --check`: `workplanExists:true`, `writes:false`.
- `workplan-cli.mjs --summary`: selected **11**, ownerReviewed **0**, openActions **0**, overdueActions **0**, decisionsPending **11**, hostReviewedByOwner **0**, freshness RECENT. This is a **new empty workplan**, not a claim that there is no actual unfinished work.
- `action-entry.mjs --add-action` accepted the terminal passphrase, reached `Project index:`, then showed a generic failure message. **No PREVIEW or CONFIRM and no success message.** The evidence supports **NOT COMMITTED**; recheck `--summary` after any future attempt.
- The screenshot does **not** show the full `npm run test` result or exact Windows Git SHA. Do not infer.

## Root-cause analysis (hypothesis, not proven)
Prior CLI uses a separate raw-mode hidden-passphrase reader, calls `process.stdin.pause()`, and then switches to `node:readline/promises`. That handoff may fail in some PowerShell/terminal configurations. An empty/invalid index followed by Enter would also trigger the same generic error because failures were previously swallowed. The screenshot does **not** disambiguate the two causes.

## Patch
- Replace mixed input mechanisms with **one direct TTY reader** for secret (no echo) and subsequent prompts (visible local echo), restoring terminal raw mode after each prompt.
- Add `--input-check` to test typing **TEST** (masked) followed by **1** (visible) **without opening Snapshot or the workplan and without any writes**.
- For project selection, type a number from `1..11`; to see the private names/index mapping **on the local screen only**, type `L` then Enter. Do not share terminal screenshots that reveal private repository IDs.
- Safe diagnostic code (`PC04B_INVALID_PROJECT_INDEX`, `PC04B_INPUT_CLOSED`, etc.) replaces a vague generic error when possible. Never print actual entered passphrase or failure stack with private values.
- Added 6 fictional/mocked TTY tests covering sequential secret-to-index input, hidden echo, Unicode/backspace, cancellation, closed terminal and diagnostic mode. No real private file is used by tests.
- Existing `CONFIRM` gate, one-action `TODO`, stale-write SHA check, encrypted backup and exclusive lock are preserved.

## Windows operator instructions — do not recreate the workplan
First stop any old local server and preserve local changes:

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch feat/pc04b-owner-action-encrypted-revisions-20261101
git pull --ff-only
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If that branch has uncommitted changes or diverged local commits, do not blindly pull or reset; check the situation first.

**Input test before touching private data:**
```powershell
node tools/private-plan/action-entry.mjs --input-check
```
At the first prompt type **TEST**, press Enter (typing is not echoed). At the second prompt type **1**, press Enter. Expect `PC-04B PRIVATE ACTION: INPUT_CHECK_PASS`, `inputCheck: PASS`, `writes: false`, `privateDataAccessed: false`. It must NOT access the encrypted registry.

After tests pass, and only if actually ready to record a real next action:
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_FOLDER_OUTSIDE_GIT>'
node tools/private-plan/workplan-cli.mjs --check
node tools/private-plan/workplan-cli.mjs --summary
node tools/private-plan/action-entry.mjs --add-action
```
The file already exists: **never rerun `--init`**. At `Project index`, enter an integer **1..11**, then Enter; optionally type `L` to show the mapping **on your private machine**. Do not leave it blank. Review the task fields in the terminal. Type `CONFIRM` only if you intend to save a real `TODO`; anything else cancels without updating the encrypted plan. After saving, rerun summary: `openActions` increases by one, while Owner Reviewed / Host Reviewed stay unchanged unless separately recorded with evidence.

## Acceptance boundaries
- Static syntax and simulated TTY checks are evidence of code structure only, **not Windows acceptance**.
- The older failed entry does not prove a committed action. Treat existing data as intact unless the post-attempt encrypted summary says otherwise.
- Explicit approval to view local private registry remains separate from PUBLIC Pages content; no private data copied to public repo.
- Historic PUBLIC Git-path disclosure and broader HTTP security acceptance remain separately open.
- **No Merge / Deploy / automatic action creation or status completion.**
