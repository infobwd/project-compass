# PC-04A — Owner-Managed Private Project Workplan (Evidence-First)

**STATE:** IMPLEMENTED ON SEPARATE DRAFT BRANCH — EXACT-HEAD WINDOWS TESTS PENDING.  
**PRIVATE ONLY:** This workplan contains private repo names, next actions, optional Windows worktree paths, host links and owner decisions. Never copy an initialized plan, plaintext JSON, private screenshot, or its decrypted output into PUBLIC GitHub Pages, GitHub PR, Actions artifacts or a conversation.

## Why this work exists
PC-03A–D3B established the 11-project **encrypted selected GitHub Snapshot**, five distinct evidence axes and a locally paired read-only browser. Git snapshots are **not** proof of Dev completion, host deployment, school acceptance or what the owner should do next. PC-04A adds a **separate human-maintained workplan**, not guessed data. The existing public Pages remains **fictional demo only**, with manual deploy.

## Data contract and confidence
`tools/private-plan/workplan-model.mjs` implements a pure strict selected-scope model:

| Field | Default | How state may change |
| --- | --- | --- |
| Development | `UNKNOWN` | Owner review; `ACCEPTED_BY_OWNER` requires recorded OWNER_REVIEW evidence |
| Git | Read-only existing validated Snapshot | Not rewritten by manual workplan and never implies host completion |
| Deployment | `NOT_VERIFIED` | `HOST_REVIEWED_BY_OWNER` requires recorded HOST_CHECK; still only owner-review evidence |
| Decision | `NEEDS_REVIEW` | `APPROVED_BY_OWNER` / `BLOCKED_BY_OWNER` require OWNER_REVIEW evidence |
| Confidence | Sourced from timestamped Snapshot / owner entries | Do not promote owner report to independent host proof |
| Next actions | Empty on initialization | Only owner-authored actions with priority, status, due date, next step and reason |
| Completed action | Never by default | `DONE_BY_OWNER` requires supporting OWNER_REVIEW evidence |
| Blockers | Empty on initialization | User must supply actual blocker and evidence context |
| Local worktree + host mapping | `null` | Added locally only, inside encrypted private plan |

`summarizeWorkplan` counts owner reviews, open/overdue actions, unreviewed decisions and source freshness. If a project has no owner action, it emits a clearly labeled **`SUGGESTION_NOT_VERIFIED`**, never silently inventing a completed task or current status.

## Encryption and local storage
`tools/private-plan/encrypted-workplan.mjs` uses a new AES-256-GCM envelope with domain-separated AAD `BWD-COMPASS-OWNER-WORKPLAN-ENC-V1` and scrypt-N32768/r8/p1. Filename: **`owner-workplan.enc.json`**, stored ONLY in the configured `BWD_COMPASS_PRIVATE_DIR` outside Git.

- No plaintext intermediary, network request, GitHub write, Pages import or public React dependency.
- `--init` creates an **empty, fail-closed** selected registry: all 11 project states start UNKNOWN / NOT_VERIFIED / NEEDS_REVIEW, no paths/host links/actions invented.
- **Exclusive create:** if the encrypted workplan exists, refuse overwrite. No auto-merge of conflicting owner notes or silent migration.
- `--summary` decrypts only in the local Node process and prints nonidentifying aggregate counts (no project names).
- `--check` prints whether a plan file exists, without reading/decrypting private project entries.
- The existing selected GitHub Snapshot is **never modified**. The original owner's Snapshot passphrase is entered in PowerShell only and also protects this new workplan. Avoid filming or pasting terminal secrets.
- JS heap/OS swap cannot be guaranteed securely zeroed. OS account and disk security remain necessary.

## Exact Windows D: operator steps (manual)
Before switching Branch: stop the old Node Private UI server (Ctrl+C). Check any untracked/modified files and preserve work; do not `git clean` or `reset --hard`.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04a-private-workplan-evidence-model-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If this Branch exists locally use `git switch feat/pc04a-private-workplan-evidence-model-20261101`.

**Acceptance:** tests `fail 0`, build PASS, public scan final PASS, preflight 5 source checks PASS. Preflight may still display `BLOCKED_FOR_REAL_PRIVATE_DATA` for broad/public release; it does **not** revoke the separately authorized owner-only local pilot. Previous D3B-4 expected ~99 tests; adding 11 PC-04A tests gives ~110 expected if there are no other changes. **Prediction only, not an observed count.**

Once the exact-head tests pass and the owner is using their trusted Windows account:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
node tools/private-plan/workplan-cli.mjs --check
```

If `workplanExists: false` and the folder/selection are correct, the owner may **explicitly create** their encrypted workplan:

```powershell
node tools/private-plan/workplan-cli.mjs --init
```

The command prompts for the existing selected Snapshot passphrase in the Terminal (not echoed). It then validates the selected Snapshot before creating the new encrypted `owner-workplan.enc.json` with no work-status guesses. It will **not overwrite** an existing file. If `workplanExists: true`, stop and preserve existing data. Do NOT try to remove/recreate automatically.

Read aggregate state locally after the one-time initialization:

```powershell
node tools/private-plan/workplan-cli.mjs --summary
```

Expected first-run values (assuming a complete 11-project Snapshot): selected 11; ownerReviewed 0; openActions 0; decisionsPending 11. **These are empty-plan defaults, not statements that the actual projects have no outstanding work.** The next PC-04B phase will add explicit owner-editing and safe encrypted revisions. Avoid manually editing encrypted files.

## Important boundaries and open work
- The local browser from D3B-4 **does not load the workplan** in this phase. PC-04A is Terminal/init/model groundwork; PC-04B owner-editing / secure save and PC-04C local dashboard overlay are separate implementation gates.
- Public GitHub Pages still shows sample projects, and MUST NOT display actual owner data from `owner-workplan.enc.json`.
- D0 older PUBLIC Git commit history exposed some workstation paths. Its risk disposition/remediation decision remains OPEN. This feature does not rewrite history.
- Host deployment, PA, school decisions, and actual project next actions are UNKNOWN until owner-supplied and verified in a separate workflow.
- Owner security approval for local private Snapshot does not authorize Merge, Deploy, GitHub Pages real project data or external network access.
- No automatic Merge / Deploy / GitHub writes / secret upload.

## PC-04 sequence
- **PC-04A:** private evidence model, encrypted create-only workplan and owner CLI — this Draft PR.
- **PC-04B:** owner-authored edits, evidence attachments/refs, safe revision/versioning and explicit review; do not auto-mark done.
- **PC-04C:** secure local dashboard cards, actionable queue, blockers and decision requests after step-up authorization.
- **PC-04D:** freshness-aware snapshots, morning summary and explicit evidence gap alerts, with no invisible changes or public leaks.
- **PC-04E:** additional fictional Public Pages UI examples only after separate owner review.

**STOP if any test fails, data selection differs, or the public scanner finds private references.**
