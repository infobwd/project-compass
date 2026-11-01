# PC-04G — Encrypted GitHub Snapshot Refresh / Two-Step Activation

**State:** source implemented in an isolated Draft branch, Windows acceptance **NOT VERIFIED**. All commits are to the PUBLIC source repository and contain only fictional tests and generic instructions; no real GitHub selected registry, local folders, private project names, production credentials or decrypted content has been committed.

## Starting evidence (2026-11-01, Asia/Bangkok)
The owner explicitly reported **PC-04F PASS** after its Windows testing instructions; treat this as **OWNER-REPORTED LOCAL PASS**, not independent exact-HEAD log, host acceptance, merged code or production deployment.

The PC-04E browser screenshot confirmed candidate PR/Issue numbers from a saved encrypted selected Snapshot, and older GitHub observations may already have changed. This is why the owner needs a **safe refresh** before deciding which real work to record. The previous `sync.mjs --collect --selected` path writes to the active `selected.snapshot.enc.json` without a separate owner-confirmed backed-up promotion step; **do not use that command to refresh the existing active snapshot**.

## New owner-local protocol

The new `tools/private-sync/staged-refresh-cli.mjs` supports three commands, each using the existing hidden passphrase entered in a trusted terminal:

1. `--stage` — preflight the current encrypted selected Snapshot and separately encrypted owner workplan, check selected folder/ownership/scope, use authenticated GitHub CLI **read-only GET** to collect the exact selected repositories, validate the new full snapshot and PR/Issue enumerations, then save a **NEW encrypted staging file** with a random stage ID. The active Snapshot and workplan are unchanged; no backup is created until activation. A failed or incomplete collection creates no staging file.
2. `--inspect --stage-id ID` — decrypt staged/current Snapshot only **in process memory**, compare both to the private selection and the owner plan, verify the stage was created from **the exact current encrypted Snapshot**, check strictly increasing `observedAt` and no invalid or incomplete PR/Issue list, then print only nonidentifying old→new counts and observation times. **No writes.**
3. `--activate --stage-id ID` — repeat the exact inspection, print the old/new nonidentifying totals, and **require the owner to type the exact word `ACTIVATE`**. Otherwise cancel without writing. After explicit confirmation, acquire an exclusive filesystem lock, re-read the staged file, current active encrypted Snapshot and selected config to prevent stale activation; create a unique **encrypted backup of the old active Snapshot**, then atomically rename a temporary **encrypted envelope** over `selected.snapshot.enc.json`. The separately encrypted owner workplan is never overwritten, recreated or marked reviewed.

The previous selected Snapshot is retained in `selected.snapshot.backup-<timestamp>-<random>.enc.json` outside Git, and the encrypted staging file is also retained. Full backup restoration and retention policy are **not implemented in this phase** and require their own owner acceptance. A failed activation may leave an encrypted backup without replacing active; it never intentionally writes plaintext. Do not delete backup or staged files without a separate recovery plan.

## Fail-closed conditions

- Private directory must exist, reside outside all Git worktrees, and have no unintended symlink targets.
- Existing encrypted selected Snapshot, selection file and owner workplan must decrypt/validate **before** the network collection.
- New snapshot must have identical ordered selected repositories, matching owner and exact scope; `observedAt` must be newer and not more than 5 minutes ahead of trusted local time.
- **ALL** PR and Issue collections must be `VERIFIED` and fully enumerated, counts exactly match, and numeric references are unique and valid. Any incomplete/unknown/malformed collection stops staging rather than inventing missing PRs.
- A stale active encrypted digest or changed selected config prevents activation. Incorrect passphrase, wrong stage ID, changed Stage content or a busy lock fails closed.
- All GitHub API calls use `gh api -X GET`; there are no GitHub writes, host checks or CI completion inference.
- Private owner workplan is validated against both old and new selected snapshots; its encrypted file stays byte-for-byte unchanged.
- No new backend HTTP endpoint or public React import; PUBLIC GitHub Pages continues fictional DEMO content.

## Windows owner acceptance

**Do not refresh real data until the new code passes all local tests.** Preserve local pending files; stop the current private Node viewer with Ctrl+C first, to avoid an in-memory viewer still showing the old Snapshot.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04g-safe-snapshot-stage-activate-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If this Branch is already present, use `git switch feat/pc04g-safe-snapshot-stage-activate-20261101` instead of `--track`. If Git detects conflicts or local edits, stop; **do not `reset --hard` or `git clean`**.

This phase adds **8 fictional-only Node tests** including encrypted backup/restore-data checks in a disposable OS temporary folder, no implicit activation, duplicate PR rejection and stale current digest refusal. Previously PC-04F added 5 to PC-04E's owner-reported 178, so the predicted total after PC-04G is **191**, but that figure is not Windows-verified. Require actual `fail 0`, Build PASS, Public Scan PASS and 5 preflight source checks PASS. The general `BLOCKED_FOR_REAL_PRIVATE_DATA` gate is still expected for PUBLIC broader release.

### Owner manual refresh — only after local code test acceptance

1. Stop old owner-private server; ensure you are on the PC-04G Branch and **make a separate offline copy of the encrypted private folder** to a trusted local backup destination before any first live activation.
2. Set the protected private directory (outside Git) with `BWD_COMPASS_PRIVATE_DIR`, and confirm `gh auth status` passes. Do not share tokens or the Snapshot passphrase with anyone.
3. Run `node tools/private-sync/staged-refresh-cli.mjs --stage`. Enter existing passphrase in Terminal. GitHub data is read-only and a unique **encrypted staging file** is created if all 11 selected projects validate. The output provides a nonsecret stage ID; record that ID privately.
4. Run `node tools/private-sync/staged-refresh-cli.mjs --inspect --stage-id <ID>` and manually review the old/new observation dates and aggregate PR/Issue counts. **If the data are incomplete or unexpected, stop.**
5. Only if satisfied, run `node tools/private-sync/staged-refresh-cli.mjs --activate --stage-id <ID>`; enter the passphrase and separately type **ACTIVATE** to authorize the encrypted backup and new active Snapshot. This is an explicit user action, not automatic.
6. Confirm that a unique old encrypted backup exists, the active encrypted Snapshot has a newer observation timestamp, the separately encrypted workplan remains present, and no plaintext JSON was written.
7. Restart the owner-local private browser on the same Windows computer using `--ack-private-workplan-local`. Confirm candidate PR/Issue counts and the workplan TODOs still match owner records. The refreshed Snapshot is **newly collected Git metadata**, never Host/Production acceptance proof.

**Important:** An interactive cloud Work/ChatGPT session cannot assume access to the user's protected Windows D: filesystem. This mechanism runs locally, manually, with user authorization and a masked local passphrase.

## Threats and outstanding gates

- Exclusive lock protects cooperating refresh commands, not malicious same-machine processes or browser extensions. The tool does not claim a full Windows filesystem permissions, atomic power-loss or crash-recovery audit.
- No automated 07:00 refresh or unattended passphrase collection. Scheduling remains a separate privacy design.
- Historic path exposure in an earlier PUBLIC Git commit remains a human security decision; this Draft PR must not be merged until appropriate risk review.
- No actual remote host checked, no PR merged, no site deployed, no owner task created, and no real project completion claimed.

**DRAFT ONLY. No Merge / Deploy / Public real data.**
