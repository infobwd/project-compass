# PC-04K — Owner-reviewed Snapshot Delta → Encrypted Next Action (Local Terminal)

**2026-11-01 Asia/Bangkok · Draft / Windows acceptance PENDING · No Merge/Deploy.**

## Handoff / intended outcome

The owner accepted **PC-04J locally** ("ผ่านแล้วไปงานต่อไป") after the owner-private saved Delta Review Queue was implemented. This is **OWNER-REPORTED Local PASS**, not independently attached exact Windows HEAD/HTTP trace or verified Host/Production. The PC-04J list is a *prompt to review evidence*, **not an owner TODO**.

PC-04K adds an **optional separate owner-local terminal workflow** which links one **specific PR/Issue number that changed between two saved GitHub OPEN lists** to a real human-confirmed encrypted TODO. It performs a **fresh, read-only GitHub API GET** for the selected reference and requires (a) a separate human attestation **REVIEWED** and (b) a separately previewed write confirmation **CONFIRM** before the existing encrypted workplan revision code may write. No browser POST endpoint is added. Nothing is automatically saved when visiting a review page.

## Strict gates and attribution

1. **Trusted local-only execution.** Existing hidden private Snapshot/workplan passphrase from a real TTY on the owner's Windows machine; protected `BWD_COMPASS_PRIVATE_DIR` directory is outside Git. A stage ID must refer to the **previously activated** encrypted Stage and exact old encrypted backup already validated by PC-04I. This workflow does **not** restage or activate anything.
The PC-04J **private-only unsaved worksheet** now prints a contextual `--review-only` terminal command using the actual project index, kind, direction and reference number from the selected saved Delta row, but **not** the private Stage ID. The owner must set `$stageId` in their protected PowerShell session. This text is a display hint, **not a browser import/execution or HTTP write**.

2. **Exact owner selection.** Owner enters project index (1-based in the existing ordered 11-project registry), PR or ISSUE, `NEW_OPEN` / `NO_LONGER_OPEN`, and the numeric ID. The model rejects any reference **not present in the fully verified saved Delta change category**, any changed selected scope, invalid count reconciliation, duplicate IDs or wrong project order.
3. **Fresh GitHub read, no GitHub writes.** On explicit CLI invocation, `gh api -X GET repos/OWNER/REPO/pulls/NUMBER` or `.../issues/NUMBER` uses only the repository and number derived from validated private scope. Spawn argument array, no shell. Response number, canonical GitHub URL and exact repo identity are checked. PR `state`, `merged_at`, `draft` and head SHA / Issue `state` are validated; an Issue response that points to a PR is rejected. Errors fail closed without printing response JSON, credentials, private paths or repository names.
4. **Evidence claims are narrow.** A GitHub API state describes that reference **at the moment of the read**. It does not prove branch dependency tests, Host/Production revision, deployment, task completion, security acceptance or the owner's priority. `NO_LONGER_OPEN` between two saved snapshots **never proves Merge**; a currently merged PR may be displayed only when the direct GitHub API itself reports `merged_at`, still without claiming Host success.
5. **Read-only mode first.** `--review-only` prints the project index, saved change category, PR/Issue number, observed time and a narrow current GitHub API result; returns `PC04K_READ_ONLY_REVIEW`, **writes: false**, and makes **no workplan changes**.
6. **Human-only action creation.** `--add-action` requires the human to open and manually review that specific GitHub PR/Issue and type **REVIEWED**. The owner independently enters title, priority P0–P3, responsible HUMAN/AI_ASSIST, optional due date, next step and evidence gap. The tool creates an in-memory preview with `TODO`, a private **OWNER_REVIEW** evidence link to the exact GitHub reference, and a stable marker in the action reason. It refuses duplicate PC-04K handoff of the same project/reference/change category. It never sets `DONE_BY_OWNER` or `HOST_REVIEWED_BY_OWNER`.
7. **Second independent save decision.** Exact **CONFIRM** is required for `commitOwnerRevision`, which exclusively locks and rechecks current encrypted workplan digest, makes a unique **encrypted backup**, then atomically writes the new encrypted workplan. Any cancellation or failure before the commit leaves it unchanged. Host/Deployment/Project acceptance fields are unchanged. No plaintext file.
8. **No browser writer / no GitHub write / no public data.** PUBLIC GitHub Pages remains fictional demo only. The private paired browser continues read-only; GitHub queries are triggered only by the owner invoking this explicit CLI and do not run in the webpage or Morning Brief.

## Owner Windows test gate — before any real review

Stop existing private browser with Ctrl+C only if switching branches is necessary. Preserve all local uncommitted edits. Never use `reset --hard` or `git clean`.

```powershell
Set-Location '<OWNER_LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04k-owner-reviewed-delta-to-action-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the branch is already present, use `git switch feat/pc04k-owner-reviewed-delta-to-action-20261101` instead of `--track`. If switching is blocked by changes, STOP and inspect; do not overwrite. PC-04J added 12 synthetic tests over the previous PC-04I ~217 estimate; PC-04K adds **9 synthetic-only tests**. **~238 total is a prediction, not a result.** Exact Windows Node `fail 0`, Build/Public Dist PASS and security preflight are required.

## Owner action workflow — optional; protected local-only

**Do not run `--add-action` until the owner has independently checked a real PR/Issue and wants to record a TODO.** A separate protected offline backup of the encrypted owner workplan is strongly recommended.

First choose a reference actually displayed in the PC-04J local Delta Review Queue. Copy its project index, type (PR/ISSUE), change direction and number **only into the owner-private PowerShell**; do not copy private reference metadata into PUBLIC Git.

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<OWNER_PROTECTED_PRIVATE_DIRECTORY_OUTSIDE_GIT>'
$stageId = 'ACTUAL_PREVIOUSLY_ACTIVATED_24_HEX_STAGE_ID'
$index = 1    # EXAMPLE ONLY: replace with exact selected index from private page
$kind = 'PR'  # PR or ISSUE, based on selected item
$change = 'NEW_OPEN'  # or NO_LONGER_OPEN
$number = 123  # EXAMPLE ONLY: replace with an actual saved Delta reference

gh auth status
node tools/private-plan/delta-action-cli.mjs --review-only --stage-id $stageId --project-index $index --kind $kind --change $change --number $number
```

The CLI reads the current selected encrypted workplan and exact activated Stage, performs a direct **GET-only** GitHub status check for the exact selected PR/Issue and reports `PC04K_READ_ONLY_REVIEW`. If the item is absent from the saved Delta category or the GitHub response is invalid/unauthorized, it **fails closed**; never substitute an arbitrary ID or manually change a Snapshot to make it pass.

For a *genuinely owner-reviewed* reference that needs a new task, the optional explicit write command is:

```powershell
node tools/private-plan/delta-action-cli.mjs --add-action --stage-id $stageId --project-index $index --kind $kind --change $change --number $number
```

Open and review the PR/Issue on GitHub independently, then type **REVIEWED** only if you genuinely did so. The tool prompts for task details and displays the private in-memory preview. Type **CONFIRM** only if you want an encrypted TODO + owner evidence entry and encrypted old-workplan backup. Anything else cancels without saving. Never share passphrase, token, decrypted plan, evidence text or full terminal details in a public PR.

## Local acceptance checklist

- [ ] GitHub exact PR/Issue read uses **GET only** and refuses wrong ID/repo, missing metadata, Issue-that-is-PR, errors, or invalid status.
- [ ] `--review-only` leaves encrypted workplan SHA-256 unchanged and creates no files.
- [ ] Wrong selected index, change direction or number outside saved Delta refuses operation before any workplan write; no fabricated TODO.
- [ ] `--add-action`: cancel at **REVIEWED** leaves workplan unchanged; cancel at **CONFIRM** leaves it unchanged. Prefer testing cancellation without saving a real action during initial QA.
- [ ] In synthetic tests only, a true **REVIEWED + CONFIRM** makes **one** encrypted backup/revision and adds one OWNER_REVIEW evidence link + one TODO without setting DONE/Host accepted. A second handoff of the same reference fails closed.
- [ ] Public Pages `src/` has no import, private browser no HTTP write endpoint, credentials remain in trusted terminal only. `npm run check:public-dist` PASS.
- [ ] If a real owner chooses to commit, separately verify encrypted backup and new workplan SHA-256, reopen Private Dashboard and see exactly one new TODO; no GitHub/Host status changed automatically.
- [ ] No Merge, Deploy, Publication of Private Registry or hidden 07:00 scheduling changes.

**Important:** This is a local owner workflow; the GitHub verification is live at read time but the saved Delta/Snapshot remains historical. CI status, deployment and project completion require their own independent evidence and human acceptance.
