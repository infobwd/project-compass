# PC-04J — Owner Review Queue from the Saved Snapshot Delta

**Date:** 2026-11-01 Asia/Bangkok. **State:** source implemented on a new isolated branch, exact Windows regression and private-browser QA NOT VERIFIED. No Merge, Deploy, GitHub write, Task write, or public private-data export.

## Owner handoff and intent

The owner reported PC-04I Windows/private-browser acceptance **PASS** after Stage-validated encrypted before/after Snapshot diff. Record **OWNER-REPORTED LOCAL PASS**, not independently rerun logs or Host Production acceptance. PC-04I is a comparison of *two saved open lists*, not GitHub Live. A missing PR number can mean merged, closed, or otherwise absent; it is **not a Merge/Close/Done claim**.

PC-04I showed up to 12 changed IDs per category and an omission count. PC-04J provides a **complete, paginated, explicitly owner-initiated review queue** for each saved change category, and opens the already existing **unsaved PC-04F evidence checklist** for any individual reference. **Review queue ≠ owner TODO.** No automatic rank, priority, due date, acceptance, deployment or merge interpretation.

## Model and UI design

- New pure `tools/private-plan/delta-review-queue.mjs`: validates existing selected owner workplan; verifies source `PC04I_SAVED_SNAPSHOT_DELTA` and selected project order, later Snapshot timestamp, complete/deduplicated positive numeric references and arithmetic reconciliation between before/after open totals.
- Project/category key is strictly `{projectIndex, kind: PR|ISSUE, change: NEW_OPEN|NO_LONGER_OPEN, page: 0..49}`. Each page contains at most **10 validated saved IDs** (pure model supports max 20; HTTP fixes it at 10). Numeric order originates in the two observed lists, not task priority. Changes are not GitHub Live.
- Read-only owner-local API `GET /api/delta/review/{index}/{PR|ISSUE}/{NEW_OPEN|NO_LONGER_OPEN}/{page}`. In a trusted 127.0.0.1 loopback session, unpaired **401**; paired but detail permission not granted **403**; after existing separate step-up authorization **200**. Malformed/out-of-scope URL or page **404**, POST **404**, no opt-in delta/owner plan **404**, after logout old cookie **401**.
- Private UI in the existing delta section: **“ตรวจ PR/Issue เพิ่งพบว่าเปิดทั้งหมด”**, **“ตรวจ PR/Issue ไม่อยู่ในรายการเปิดแล้วทั้งหมด”** where count greater than zero. Responsive Prev/Next per category; each row has **“เปิดแบบตรวจหลักฐาน”**.
- Reuses the PC-04F temporary worksheet (same four manual verification prompts, no persistence). The delta worksheet appears **inside the private delta section**, with extra context warning that category is only a change in open-list observations and never proves Merge/Close.
- The worksheet reminds the owner to check the **current PR/Issue directly in GitHub**, dependency/base branch, test evidence and separate Host results. A real TODO requires explicit independent owner decision and the separate encrypted terminal `action-entry.mjs --add-action` + `CONFIRM`.
- No HTTP POST writer, network GitHub call, browser localStorage/sessionStorage, public React import, plaintext/private export, automated TODO, scheduling or ranking. Older private viewers without PC-04I opt-in stay unchanged. Lock/Logout clears DOM and revokes access.

## Windows local QA

Stop the old private Node viewer (Ctrl+C). On the existing D: working copy, preserve all uncommitted files. Never use `reset --hard` or `git clean` as a shortcut.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04j-private-delta-review-queue-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If local branch already exists, use `git switch feat/pc04j-private-delta-review-queue-20261101` instead. When working-tree changes block switching, stop and inspect them rather than overwriting.

PC-04J adds **12 synthetic-only tests** (6 pure model + 6 local HTTP/UI). PC-04I had an estimated **217 total** after its 16 tests; therefore **229 is only a prediction**, not a Windows test result. Require actual `fail 0`, Vite Build PASS, Public Dist Scan PASS, and static preflight source checks. General real-private browser release gate remains a **separate human-controlled review**, not waived by source tests.

### Owner-local viewer

**Do not create another Stage or Activate**; use the encrypted selected Snapshot/old backup verified during PC-04I and the exact **already activated** Stage ID. Run on the same trusted Windows computer:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<OWNER_PROTECTED_PRIVATE_DIRECTORY_OUTSIDE_GIT>'
$stageId = 'ACTUAL_24_HEX_ID'
node tools/private-ui/private-delta-local.mjs --ack-private-workplan-local --delta-stage-id $stageId
```

Replace \`ACTUAL_24_HEX_ID\` with the exact already activated 24-character hexadecimal Stage ID from your private Windows Terminal (do not type angle brackets into the CLI). Enter the existing passphrase only in the private Terminal. Open the exact printed `http://127.0.0.1:PORT/` on the same PC, use the one-time pairing code and separate confirmation to show details.

### Owner acceptance checklist

- [ ] Tests **actual** fail 0; Build and Public Dist Scan PASS. The source preflight passes; protected real browser security gates are not claimed resolved.
- [ ] Before pairing `/api/delta/review/0/PR/NEW_OPEN/0` returns **401**; paired without step-up **403**; after step-up **200** and max 10 IDs. A 0-item category or out-of-range page does not create fake rows.
- [ ] Thai detail view shows four change categories per project as appropriate, each with **“ตรวจ ... ทั้งหมด”** for nonzero counts, even if PC-04I short preview omitted items.
- [ ] Prev/Next traverse the complete saved ID set without duplicates or skipped IDs. Numbers are not prioritized.
- [ ] Clicking **“เปิดแบบตรวจหลักฐาน”** opens a private unsaved worksheet for the *specific* number. For a `NO_LONGER_OPEN` entry it explicitly says this **does not prove Merge/Close**.
- [ ] Checking boxes, closing worksheet or changing category does not add a TODO, change priority, mark a PR done, or write the owner encrypted workplan.
- [ ] Invalid URL, POST, wrong Origin/Host and after-Logout old cookie are rejected; logout clears worksheet.
- [ ] 390px/mobile and desktop: Thai labels legible, tap targets practical, no horizontal scroll or clipped bottom actions.
- [ ] Public GitHub Pages continues fictional DEMO only. No private project names, PR/Issue numbers, private paths, credentials or screenshots of sensitive pages are placed into PUBLIC Git.

## Evidence model / caveats

- `NEW_OPEN` = present in later **saved OPEN list** but absent in earlier one.
- `NO_LONGER_OPEN` = present in earlier saved OPEN list but absent later. **NO proof** of merged, closed, work completed, deployment or CI state.
- Existing owner tasks live separately in an encrypted workplan and may already address an observed PR; this UI **does not** automatically deduplicate or open/close those owner tasks.
- A change in HEAD SHA does not independently verify production. Human must check the actual GitHub PR/Issue and host deployment as separate sources.
- Current Draft stack is not merged; no public release authorization, including unresolved historic public Git-path exposure and local browser threat-model gates.

**No Merge / Deploy / automatic TODO / public real data.**
