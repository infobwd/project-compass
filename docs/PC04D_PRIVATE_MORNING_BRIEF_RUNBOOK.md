# PC-04D — Evidence-First Private Morning Brief (OWNER LOCAL, read-only)

**State: IMPLEMENTED IN ISOLATED DRAFT BRANCH — WINDOWS QA NOT YET VERIFIED.**
**No merge, no deploy, no automatic scheduling, no remote access to D: or private Pages data.**

## Evidence and approval lineage (2026-11-01, Asia/Bangkok)

The owner provided mobile screenshots showing PC-04C private workplan cards, readable status-axis text, action-area warning outside the metric grid and touch-friendly buttons, followed by “ผ่านทั้งหมด”. PC-04C mobile UX is **OWNER-REPORTED LOCAL PASS** with independent HTTP 401 and new exact-HEAD tests not separately attached. [Sanitized record](PC04C_OWNER_MOBILE_ACCEPTANCE_20261101.md).

The last verified private workplan view had an **empty owner task register** and 11 decisions needing owner review. These are snapshot/owner-plan observations, NOT current verification that actual projects have no work left. Only the owner can add real TODOs using the separately authorized PC-04B action-entry workflow and explicitly typing CONFIRM.

## What PC-04D does

- `tools/private-plan/morning-brief.mjs` is **pure** and operates in process memory on the validated encrypted GitHub selected-snapshot projection + separately encrypted owner workplan; no GitHub REST calls, host checks or remote sync.
- `tools/private-plan/morning-brief-cli.mjs --summary` produces a **nonidentifying** local aggregate: snapshot observation/freshness, owner-reviewed project counts, **owner-entered** open/overdue actions, owner recorded DONE, decisions waiting, host reviews and review-prompt count. It never emits repository names, host/worktree paths or task titles.
- `--details` is a **separate explicit opt-in**, requiring the owner to type **DISPLAY** in the local Terminal before repository names, recorded task text, priority, due date or review gaps appear. These details are PRIVATE and must not be shared to public CI/logs/screenshots.
- The command reads local encrypted files **in memory** only. It does not create a plaintext Markdown/CSV/JSON report, write back to the private plan, create tasks, mark any task DONE, touch GitHub, verify host deployment, merge, deploy or schedule itself.
- Sorting is by owner-recorded priority (P0 before P1), overdue status, and explicit task status, not by guessed Git progress. A separate review queue is labeled `REVIEW_PROMPT_NOT_VERIFIED` and is **NOT** an owner-confirmed task.
- The displayed day and overdue classification use the **Asia/Bangkok calendar**, not UTC date slicing. Invalid recorded due dates trigger a data-quality warning instead of silently claiming overdue.
- Output explicitly says `ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE`; the freshness marker is as of the saved Snapshot, not proof of current GitHub/host status. Git default HEAD never proves deployed revision or project acceptance.
- If no TODO is saved, the brief says **no owner-entered task recorded**, NOT “all projects complete”.

## PC-04D1 concise Thai mode (owner local only)

Owner-provided screenshot confirms the older `--details` displayed a local report after `DISPLAY`: no owner-entered TODO yet, and review prompts for the selected project scope. This was **OWNER-REPORTED / SCREENSHOT DETAILS PASS**, not a full new-HEAD Test or CI acceptance. The repetitive English evidence flags were difficult to scan in a narrow Windows terminal.

A separate optional command now generates a shorter Thai-language checklist without changing any owner workplan records:

```powershell
node tools/private-plan/morning-brief-cli.mjs --compact
```

Enter the **existing** password into the terminal (masked). The command explicitly warns that project names and owner task details are private, and **requires the exact word `DISPLAY`** before printing them. Before `DISPLAY`, it does not print a project name or task title. Typing anything else cancels without writing.

The compact output contains:
- Report day in Asia/Bangkok, stored Git Snapshot observation timestamp, freshness, and explicit **not GitHub Live / host unverified** statement.
- Counts of **owner-recorded** open tasks, overdue tasks, and owner-reviewed DONE; pending owner decisions and recorded host reviews.
- Up to 8 owner-recorded priority-ranked TODOs, with a clear notice if further entries are hidden; `--details` remains the full private audit output.
- One concise review line per project, labeled **suggested review, not an owner-recorded TODO**. It intentionally avoids repeating five technical code strings across all projects.
- Empty task register warns that `0 TODO` does not prove there is no unfinished project work.

This compact output is still **PRIVATE**. Never redirect or post the terminal report (which contains identifiers) to GitHub, Actions or a public artifact. `--summary` is the nonidentifying count-only alternative suitable for sharing **only after reviewing for incidental sensitive facts**.

Four new fictional-only tests validate the empty register, Bangkok priority/due formatting, task truncation and mandatory DISPLAY gate. On the previous PC-04D code the test total was predicted at approximately 145; this change adds four tests, so **~149 is merely a forecast** until Windows output proves it.

**PC-04D1 exact-HEAD Windows tests and live private compact rendering remain NOT VERIFIED**. The command adds no automation or network access.

## Exact Windows commands (owner manual steps)

First ensure the existing local server is stopped via Ctrl+C and preserve all local changes:

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04d-private-evidence-morning-brief-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the PC-04D branch already exists locally, use `git switch feat/pc04d-private-evidence-morning-brief-20261101`, not `--track`; if files conflict, STOP and review first. Never use `reset --hard` or `git clean` as a shortcut.

At the time this code was authored, the previous PC-04C baseline expected 136 tests from 134 observed plus two new mobile tests; PC-04D adds **9** fictional-only tests, so **145 is a prediction, not a Windows-confirmed count**. Require `fail 0`, Build PASS, Public Dist final PASS and five preflight source checks PASS. The generic preflight may continue displaying `BLOCKED_FOR_REAL_PRIVATE_DATA` for PUBLIC real data: that remains the correct broader release gate.

For the private summary:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<PRIVATE_DIRECTORY_OUTSIDE_GIT>'
node tools/private-plan/morning-brief-cli.mjs --summary
```

Enter the existing Snapshot/workplan passphrase **only in the local Terminal**, with hidden input. Share only nonidentifying aggregate result counts, never the passphrase.

When the owner **specifically wants private project-by-project next actions on the same trusted machine**:

```powershell
node tools/private-plan/morning-brief-cli.mjs --details
```

After entering the hidden passphrase, type **DISPLAY** to explicitly allow the private Terminal listing. The output includes real repository identifiers, task titles and review gaps. Keep the Terminal private; do not redirect its output to a public file or share screenshot with private identifiers.

**Never rerun** `workplan-cli.mjs --init`: the encrypted plan already exists on D:. To add/update a real next task, use the separately gated PC-04B `action-entry.mjs --add-action` with actual details and `CONFIRM` after review, then rerun PC-04D summary. PC-04D itself is always read-only.

## Acceptance checklist and privacy boundary

- [ ] Exact Windows SHA recorded; full Node tests pass, build PASS, public-dist scan PASS, source preflight 5/5 PASS.
- [ ] `--summary` prints no repository names/task details and shows `liveGitHubChecked: false`, counts and Bangkok date.
- [ ] `--details` **does not print any private project names before DISPLAY**; if the owner cancels, there are no writes.
- [ ] The last known empty plan produces zero **recorded** TODOs and explicit owner-review prompts, not false completion.
- [ ] Owner-added TODOs (if any) appear only in private `--details` and derive from plan evidence; an invalid due date yields warning.
- [ ] Public GitHub Pages remains `DEMO MODE` with fictional data. No connected real-data API or encrypted workplan added to `src/`, `dist/` or Actions artifacts.
- [ ] No plaintext files/reports written, GitHub status mutations, host validations or scheduled hidden operations.

## 07:00 automation — separate PC-04D2 security gate

This implementation provides a **local manual brief**. It does **not** install a Task Scheduler job or create a ChatGPT scheduled task. Existing ChatGPT morning reminders/briefs must be assessed independently. A cloud scheduled task cannot be assumed to access the owner's private Windows D: encrypted files or passphrase. Scheduling a safe morning summary requires an explicit design/approval (e.g., owner-unlocked local service + carefully scoped export of **approved non-sensitive aggregate**), freshness controls and user confirmation before activation. Do not automate password collection, plaintext export or real private Pages publishing.

## Remaining risks

D0 historic public Git-path disclosure review remains OPEN. Loopback HTTP/browser-extension/local process risks remain separate from this Terminal CLI. Workplan owner statuses and HOST_CHECK records are **owner-recorded only**, not third-party independent host verification. The workplan itself has not been updated by this phase.

**No Merge. No Deploy. No public real private registry. No automatic schedule.**
