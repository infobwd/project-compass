# PC-04B — Windows INPUT_CHECK v2 / Synthetic Diagnostic Follow-up

**Date:** 2026-11-01, Asia/Bangkok.
**Status:** revised CLI and tests committed to existing **DRAFT PR #17**; exact-head Windows re-test still pending.
**Scope:** owner private/local only. No Merge / Deploy / actual private workplan modifications.

## Evidence from owner screenshots

- Node tests **122/122 PASS**, no failures.
- Vite production build **PASS**.
- Public build scan **PASS** (3 text assets; no listed sensitive patterns).
- Synthetic/public source preflight 5 checks **PASS**. The output `BLOCKED_FOR_REAL_PRIVATE_DATA` continues to apply to general/public real-data release, not the approved isolated owner-local experiment.
- `node tools/private-plan/action-entry.mjs --input-check` stopped at the **first masked dummy-input prompt** with `PC04B_INPUT_CHECK_SECRET_FAILED`; project index prompt was not reached.
- The screenshot cannot distinguish blank input, a typo, keyboard/TTY input handling, a paste issue, or a case-sensitive literal mismatch. **Do not claim a confirmed root cause.**
- `--input-check` deliberately does **not** open private files, ask for a real password or write any workplan changes.
- The previous private summary showed an intact 11-project encrypted registry with 0 owner-entered actions (new empty plan). An unsuccessful diagnostic does not justify deleting/reinitializing the encrypted file.
- GitHub HEAD and local Windows tested SHA are separate; exact SHA was not in owner screenshot.

## Version 2 diagnostic: visible, masked, index

The new command prompts in this order (ALL INPUTS ARE **FAKE TEST VALUES**, never the actual passphrase):

1. `Step 1/3: type TEST (visible) then Enter:` — type **TEST**, press Enter; the characters should be visible.
2. `Step 2/3: type TEST again (hidden) then Enter:` — type **TEST** and press Enter; no characters should be visible. The fake diagnostic tolerates lowercase `test` and surrounding spaces; it does not print the hidden value.
3. `Step 3/3: type 1 (visible) then Enter:` — type **1**, press Enter.

Success output:

```text
PC-04B PRIVATE ACTION: INPUT_CHECK_PASS
inputCheck: PASS
visibleInput: PASS
maskedInput: PASS
indexInput: PASS
writes: false
privateDataAccessed: false
```

Failure is distinct without revealing hidden content:
- `PC04B_INPUT_CHECK_VISIBLE_EMPTY` / `VISIBLE_MISMATCH`
- `PC04B_INPUT_CHECK_MASKED_EMPTY` / `MASKED_MISMATCH`
- `PC04B_INPUT_CHECK_INDEX_FAILED` / `PC04B_INVALID_PROJECT_INDEX`
- `PC04B_INPUT_CLOSED` / `PC04B_TTY_REQUIRED`

If the hidden stage still fails, report **ONLY the code**, not the typed characters or actual passphrase. No private data is needed for debugging.

## Windows instructions

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

# Read/write ZERO private files — dummy TEST, TEST, 1
node tools/private-plan/action-entry.mjs --input-check
```

Stop if local edits conflict, a test fails or input check is not PASS. Do not `reset --hard` or `git clean`. The newly added v2 diagnostic includes four additional synthetic-only tests; **126 total is a prediction from previous 122**, not independently observed on Windows.

After a verified PASS only, the owner may decide to use `--add-action` with the actual encrypted plan and explicitly type `CONFIRM` to add a real TODO. **No silent changes, no automatic DONE or host acceptance.**

**Never run `workplan-cli.mjs --init` again** — the owner already created their encrypted workplan. Do not send private snapshots, screenshots of real repository names, passwords, cookies or action contents to this public PR.

## Source confidence
The new CLI and regression source were read back from GitHub, syntactically checked and fake TTY helper behavior exercised in the authoring environment. Full Windows tests, passphrase prompt compatibility and private-action persistence **remain unverified** pending the owner's next run.
