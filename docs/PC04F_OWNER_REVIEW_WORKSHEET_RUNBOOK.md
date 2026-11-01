# PC-04F — Owner Review Worksheet (Private Local, NO WRITES)

**Date:** 2026-11-01, Asia/Bangkok. **State:** Draft branch implementation; exact Windows acceptance NOT VERIFIED. No Merge, Deploy, automatic TODO or public private-data upload.

## PC-04E owner screenshot / evidence

Owner-provided screenshot of the protected local browser shows legible Thai PR/Issue review candidates grouped by project. One expanded card shows two saved PR numbers and one Issue number, marked Draft where applicable, and the count of PRs not displayed. The page states that entries are **NOT TODO** and their priority remains **NOT ASSESSED**. Record this as **PC04E_OWNER_BROWSER_VISUAL_PASS**, but **not** independent logout/HTTP/Windows Git SHA/CI acceptance. The screenshot contains real project identifiers and is **not committed** to this public repo.

I checked current authenticated GitHub PR metadata separately while planning this phase: saved snapshot references can remain Open/Draft but newer PRs may also exist. The private web page still uses the **saved selected Snapshot**, not those live queries. The CLI must never silently overwrite the encrypted Snapshot or owner workplan.

## Purpose

Help the owner choose one specific PR or Issue, perform evidence checks, and then **independently decide** whether a concrete next action is needed. This phase does NOT add an encrypted browser-write endpoint, mark a project reviewed, save checkbox state, change status, or assign priority.

## Privacy and behavior

- The new **“เลือกตรวจรายการนี้”** button appears only inside the selected per-project candidate list that is available **after pairing + explicit second detail authorization**.
- Clicking it opens an in-page **temporary worksheet** for that single already-listed saved Snapshot reference. It displays the selected project and **1-based index in the existing selected Registry** to help the owner use the separate encrypted CLI correctly.
- Four temporary unchecked local browser checkboxes prompt: (1) verify current PR/Issue state on GitHub, (2) inspect base/dependent PR and recent test evidence, (3) independently inspect Host/Deployment when relevant, (4) decide concrete next action and assign priority personally.
- All checkboxes exist **only in the DOM**. Checking them is **not** recorded in the encrypted owner plan, the server, a browser database, or GitHub. It never means `OWNER_CONFIRMED` or `DONE`; the worksheet expressly warns this.
- Clicking **“ปิดแบบตรวจ (ไม่บันทึก)”**, pairing reset, details rerender or Logout clears the temporary worksheet from the DOM. The old protected pairing and detail API routes are unchanged. No new endpoint, cookie handling, outbound GitHub link, clipboard export, localStorage or service worker is added.
- The owner can only persist a task using the **existing separately audited encrypted CLI** `node tools/private-plan/action-entry.mjs --add-action` and explicit `CONFIRM`. That workflow creates encrypted revision + backup; it is **not invoked by this page**.
- If a Snapshot shows only part of a long PR list (e.g. displays 2 of many), the rest **are not deleted or considered done**. The owner must review the latest source directly.
- Every PR/Issue remains `REVIEW_AT_SNAPSHOT_NOT_LIVE`. The owner must not infer completed tests, Merge, deployment, or project acceptance from the candidate list.

## Windows owner local QA

First stop previous local Node viewer using Ctrl+C. Preserve any unstaged/untracked files. Fetch and switch the isolated PC-04F branch; **never** force-reset or clean as a shortcut:

```powershell
Set-Location '<PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04f-owner-review-worksheet-local-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the PC-04F branch already exists, use `git switch feat/pc04f-owner-review-worksheet-local-20261101` instead. No code edits are needed locally.

PC-04F adds **5 fictional-only tests**; the prior PC-04E suite reported **177/178** before a one-test correction, then the owner said the retry passed. A **183 total** is only a prediction from 178 + 5, **not independently proven on Windows**. The acceptance gate is actual `fail 0`, Build PASS, Public Dist PASS, and 5/5 source preflight checks.

After those pass, use the existing privately authorized launcher on a trusted local computer:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<PROTECTED_OUTSIDE_GIT_PRIVATE_DIRECTORY>'
node tools/private-ui/private-local.mjs --ack-private-workplan-local
```

Enter the existing passphrase in Terminal, open the exact printed `http://127.0.0.1:PORT/` on **the same computer**, pair and confirm details. Do not share passwords, screenshots of private project names, or cookies on this PUBLIC PR.

### Browser acceptance checklist

- [ ] Unpaired candidate routes → HTTP 401; paired before detail authorization → 403.
- [ ] Candidate list visible only after detail step-up; no live GitHub status is asserted.
- [ ] Click **“เลือกตรวจรายการนี้”** on one synthetic or real stored ref: a clearly labeled **unsaved** worksheet opens, showing exactly that ref and matching project index; checkbox questions remain unchecked initially.
- [ ] Checking all boxes does **not** save a task or mark project reviewed. Closing worksheet clears its checks.
- [ ] Open a second candidate: the previous worksheet is replaced; no state persists.
- [ ] Logout resets worksheet, candidate/details APIs return 401 with old cookie; close Node listener using Ctrl+C.
- [ ] No browser private workplan POST route is added; no public Pages data changed.
- [ ] Zero registered owner TODOs still means *no tasks recorded*, not *no real unfinished work*. Do not automatically convert missing evidence into tasks.

## What PC-04F does not do

- It is **not** a live GitHub collector or recent PR ranking engine.
- It does **not** import screenshots into private/public Git, create TODOs, generate plaintext export, email/notify, schedule at 07:00, or update owner acceptance.
- It does **not** resolve historic PUBLIC Git commit/path exposure or general local HTTP security questions. Owner must separately decide the handling of those release gates.
- **No Merge / Deploy / automatic acceptance.**
