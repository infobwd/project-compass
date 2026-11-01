# PC-04L — Synthetic Encrypted TODO Commit & Recovery Gate

**2026-11-01 (Asia/Bangkok) · isolated stacked Draft · no Merge/Deploy · owner Windows test PENDING.**

## Evidence and boundary

The owner reported PC-04K exact-HEAD Windows tests **238/238 PASS**, build/public-dist checks PASS, paired owner-local GitHub GET-only **PC04K_READ_ONLY_REVIEW**, and both owner cancellation paths **PC04K_CANCELLED_NOT_REVIEWED** and **PC04K_CANCELLED_UNSAVED** with before/after encrypted owner-workplan hash and file list unchanged. These are **owner-observed Windows acceptance**, not an independent replay of the private files, and not a real TODO commit.

PC-04L is a **separate test-only child of PC-04K PR #27**, never the isolated public Pages `main`. It exercises the existing encrypted transaction implementation against **invented repository names and freshly generated temporary test directories only**. No real private configuration, source snapshot, credential, host, student/school record, or owner TODO is read or modified.

## Implementation and scope

- Adds `tests/pc04l-fictional-encrypted-transaction.test.mjs` only, with seven Node tests.
- Creates strictly fictional selected/old/new snapshots and an initially empty encrypted workplan in a **new OS temporary folder**; activates a fictional encrypted Stage with a matching encrypted old Snapshot backup.
- Uses the existing PC-04I saved Delta validation, PC-04J exact reference selection, PC-04K current GitHub response validation **with an in-memory fake response (NO GitHub network)**, and the real existing workplan model + `commitOwnerRevision` against that disposable directory.
- Positive fixture test requires exactly **one encrypted backup**, **one TODO**, **one OWNER_REVIEW evidence link**, original Snapshot preserved, no Host/Production acceptance and no plaintext title in the encrypted envelope.
- Negative fixture tests: preview without commit, missing owner confirmation, stale workplan hash refusal without lock/backup, repeated PR-reference duplicate refusal, invalid activated Stage refusal.
- Recovery rehearsal: restore the original encrypted workplan bytes **only inside the disposable test folder**, decrypt/validate the restored empty plan and confirm Snapshot Delta still verifies. This does **not implement an owner production restore tool** and is not authorization to replace the real protected workplan.
- Every fixture uses `try/finally` cleanup, and no public `src/`, API writer, GitHub Actions scheduler, public Pages export, migration, or private-server code is changed.

## Source verification and honest acceptance status

GitHub connector source read-back can verify committed file contents and PR topology, **not** execute the Windows Node test suite. Do not claim the seven tests PASS until the owner supplies actual exact-head test results. Baseline PC-04K **238 observed tests** + **7 new authored tests** = **245 predicted**, not a passing count.

### Owner Windows test — optional next gate

Preserve any local edits: `git status --short` before switching, and **STOP** if checkout would overwrite work. Never use `reset --hard` or `git clean`.

```powershell
Set-Location '<OWNER_EXISTING_PROJECT_COMPASS_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/test/pc04l-fictional-encrypted-todo-save-rollback-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If that branch already exists locally use `git switch test/pc04l-fictional-encrypted-todo-save-rollback-20261101` instead of `--track`. Confirm the exact SHA against this Draft PR. The static preflight's `BLOCKED_FOR_REAL_PRIVATE_DATA` remains an independent, intentional human security gate; a source-level PASS does not waive it.

### Acceptance criteria

1. Actual Node test runner: **0 failures**; all seven PC-04L cases exercised with no real-file accesses; build/public-dist PASS.
2. A successful isolated encrypted commit creates exactly one simulated TODO and OWNER_REVIEW evidence, one encrypted old-plan backup, **no change to the saved encrypted Snapshot**, no Host/Production acceptance.
3. Missing consent, stale SHA, invalid Stage and duplicate context fail before writing; cancelled preview never calls commit.
4. Manual recovery is tested only in the disposable fictional fixture, not performed on a live owner folder.
5. No real TODO saved, no private data published, no GitHub write except this test-only Draft source branch/PR, no Merge or Deploy.

## What remains independently gated

- **Real owner TODO save**: not requested, not executed, and requires separate owner approval plus genuine review, encrypted backup/restore plan, and secure workstation readiness.
- **Human security gates**: historic PUBLIC Git path exposure review, owner-visible exact Logout/HTTP 401 and security acceptance, authorization/browser isolation, hostile local process/DNS rebinding/CSRF/session/cache/leakage threat-model review, and private browser/Snapshot live acceptance.
- **Deployment/Host evidence**: no GitHub metadata or test suite implies that Host was deployed or accepted.

**This PR is an intentionally isolated test candidate, not a release. Do not Merge or Deploy.**
