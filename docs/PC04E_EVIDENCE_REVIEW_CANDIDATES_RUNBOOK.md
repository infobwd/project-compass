# PC-04E — Evidence-first PR/Issue review candidates (owner-only / read-only)

**Status:** Code on isolated Draft branch; exact Windows tests and owner browser QA pending. **No Merge / Deploy / automatic TODO creation.**

## Why this exists
The owner reported all PC-04D2 local acceptance checks PASS. This is **OWNER-REPORTED LOCAL PASS**, not independently checked GitHub/Host production acceptance. The private dashboard reads an already encrypted selected GitHub Snapshot and a separately encrypted owner workplan for the owner's explicitly selected repositories. A zero owner-entered TODO count means **no TODO was recorded**, not that the real backlog is empty. This phase improves the next-action workflow without fabricating project progress.

## PC-04E source and trust contract
- The saved selected Snapshot's existing `openPRs.items` and `openIssues.numbers` are authoritative **only as historical observations at `observedAt`**. The data was collected using authenticated GitHub CLI read-only API, not verified live by this local dashboard.
- The private offline projection retains **numeric PR/Issue refs in server memory only**, with source flags. It never sends raw PR branch SHAs, private local paths, passwords, host URLs, evidence references, full encrypted Snapshot or raw workplan to the public UI or client.
- The pure candidate model accepts a list **only** if the PR/Issue aggregate is `VERIFIED`, the entire enumeration exists, its count equals the verified count, each numeric ID is valid and unique, and PR draft types are valid. Otherwise the source is `PARTIAL_OR_UNKNOWN` and it creates **no fabricated PR/Issue IDs** from the aggregate.
- The model recommends **reviewing observed PR #N / Issue #N**, never that it is currently open, code is complete, Host is deployed, or that it should be merged. It does not assign P0-P3 or create/complete owner TODOs. PR and Issue numbers shown in descending numerical order are not a business priority ranking.
- It displays at most **two PR and two Issue refs per project** with omitted counts, to avoid an overwhelming dashboard; the owner can review the GitHub source separately for more.
- Old selected snapshots **may be stale**. If `RECENT` is shown, it describes the saved observation age, not a fresh live GitHub check. Always open GitHub PR/Issue to verify latest content/branch/tests before recording a real next action.
- The saved Snapshot is **read-only** during PC-04E. No fresh collection or auto-update is introduced; the existing `sync.mjs --collect --selected` implementation replaces the encrypted selected Snapshot, so **do not refresh until an owner-approved encrypted backup/recovery procedure is established**. The separately encrypted owner workplan must not be recreated or overwritten.

## Local browser flow (owner permission required)
- `node tools/private-ui/private-local.mjs --ack-private-workplan-local` remains the only opt-in loading owner private selected Snapshot and workplan.
- Unpaired `GET /api/candidates/summary` → HTTP **401**. After pairing, the summary returns **nonidentifying aggregate** PR/Issue reference counts and incomplete source counts.
- Unpaired `GET /api/candidates/details` → **401**; paired without detail step-up → **403**. After the same explicit `POST /session/details` step-up used by PC-04D2, local Thai UI displays collapsed per-project candidate list, with PR # / Issue # and draft status. No direct owner task mutation endpoint or outbound GitHub API navigation is added.
- Existing Snapshot-only legacy mode sees HTTP **404** for both routes. Logout invalidates the session and both routes → **401** even with old cookie; strict local Host/Origin/CSP/no-store remain in force.
- No public Pages source `src/` changes; PUBLIC GitHub Pages remains **DEMO ONLY**.
- A candidate is tagged `priority: NOT_ASSESSED`, `ownerConfirmed:false`, `ownerTasksAdded:0`. Clicking/expanding it **does not write to encrypted files**.

## Windows acceptance (D: local worktree)

Stop previous private Node server with **Ctrl+C**; preserve uncommitted changes and do not reset/clean.

```powershell
Set-Location '<LOCAL_PROJECT_COMPASS_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04e-private-evidence-review-candidates-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the branch already exists locally, use `git switch feat/pc04e-private-evidence-review-candidates-20261101`. If Git reports changed files or divergence, STOP and resolve safely first.

This phase adds **15 fictional-only tests (7 pure model + 8 HTTP)**. Based on the preceding prediction of 163 tests for PC-04D2 (now owner-reported PASS), the **expected** new count is approximately 178; do not assert this count until Windows reports it. Require `fail 0`, Build PASS, Public Dist Scan PASS and source checks PASS. Generic `BLOCKED_FOR_REAL_PRIVATE_DATA` continues to gate broad/public real-data release.

If all pass, with the existing outside-Git protected private directory configured in a trusted PowerShell session:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<PROTECTED_PRIVATE_DIRECTORY_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-private-workplan-local
```

Enter the **existing** passphrase into Terminal only. Open the exact printed `http://127.0.0.1:PORT/` on the **same Windows machine**; use browser responsive mode for 390px testing (do not expose the local server to phones on the LAN or Internet).

### Manual browser checklist
- [ ] Before pairing, both candidate routes return 401.
- [ ] After pairing, candidate aggregate counts are visible but project identifiers remain hidden until detail authorization.
- [ ] Before step-up, candidates detail returns 403.
- [ ] After clicking owner detail authorization, project cards display only **stored** PR/Issue numbers and explicit `NOT LIVE`/not-TODO text; incomplete collections produce a warning with **no made-up numbers**.
- [ ] Project cards are collapsed initially, expand/collapse by mouse/touch and keyboard.
- [ ] No actual task is added to owner workplan and no `DONE`, `MERGED`, `DEPLOYED` or `HOST_VERIFIED` is inferred.
- [ ] Logout revokes candidate routes (401); Ctrl+C stops the listener.
- [ ] Public Pages remains fictional DEMO. Share only PASS/FAIL, count and exact SHA; do not share screenshots with private project names, passphrase or cookies.

## How an owner can *later* adopt a grounded next action
This phase is **read-only**. To turn a reviewed candidate into a real TODO, the owner must independently:
1. Open the referenced PR/Issue on GitHub and check whether its state, linked PR dependencies, test logs, host acceptance and scope are still current.
2. Decide if there is a concrete next task. Suggested wording is “ตรวจ [PR/Issue] #N กับหลักฐานและทดสอบล่าสุดก่อนตัดสินใจ” rather than “งานเสร็จ / Merge / Deploy”.
3. Use existing local `node tools/private-plan/action-entry.mjs --add-action` with selected project index, owner-defined title, priority, next step and explicitly type `CONFIRM`. This separate workflow backs up the encrypted plan; this read-only candidates page **does not** invoke it.
4. Restart the local browser viewer to load the revised encrypted plan. Never rerun PC-04A `--init`.

A future PC-04E2 may provide an **explicitly authorized** local-only browser adoption UI, but only after separate threat-model, CSRF, encrypted revision and consent gate reviews. **No auto-adoption.**

## Security status
- Owner's PC-04D2 visual/functional acceptance is reported PASS; independent HTTP threat review and historic PUBLIC Git path-disclosure remediation remain unresolved release gates.
- No Merge or Deploy to GitHub Pages, no host writes, no automatic morning schedule, no owner workplan updates in this branch.
