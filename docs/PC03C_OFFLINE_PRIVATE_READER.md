# PC-03C — Offline Private Registry Reader / Evidence Summary (DRAFT)

**Private-by-Default · Evidence-First · Local-only · No Merge / No Deploy**

## Status and source of truth
- The owner reports PC-03B collected all 11 explicitly selected repositories and found the encrypted file on D:. This is owner-confirmed Windows evidence, not independently inspected private content.
- The reader does **not** access GitHub, GitHub Pages, the host, browser storage or the network.
- It reads **only** `projects.selection.json` and `selected.snapshot.enc.json` from the configured `BWD_COMPASS_PRIVATE_DIR`, never from the public checkout.
- The passphrase is entered interactively, is not echoed, and is not supplied via CLI argument/environment variable. The decrypted object is held in JS process memory only and not written to disk. Process memory is not protected against a compromised host/session.
- Source scripts are generic. **Never commit a real allowlist, plaintext private snapshot, passphrase, internal host, personal identifier or generated report to this public repo**.

## Evidence contract
- `coverage: ALL_SELECTED` + matching `selection.requested/matched`, `inspectedRepositories` and the private allowlist count/order are required; fail closed on mismatches or duplicate IDs.
- A verified open PR count can be used only if that repository's PR collection was fully retrieved. If ANY repo PR collection is UNKNOWN or INCOMPLETE, the global total is UNKNOWN. A separately labeled **known subtotal** remains possible.
- Independently validate the Git default branch HEAD, PR counts and true issue counts. These are **GitHub metadata at observation time**, not host status.
- `RECENT` for observed age <=24 hours, `AGING` for <=72 hours, `STALE` older than 72 hours; a snapshot dated >5 minutes in the future is `CLOCK_SKEW`. Freshness does not mean a deployment was verified.
- Deployment state and project acceptance remain `NOT_VERIFIED` for every repository.
- Default branch may be legacy or intentionally non-production; production branches need independent verification (including repositories with multibranch production workflows).

## Local Windows execution (PowerShell)

Prerequisites: PC-03B test/build/public scan PASS on an owner Windows checkout, GitHub CLI collector's selected file exists, and the user remembers the passphrase used to encrypt **the selected file**.

1. Check worktree changes (existing untracked package-lock/tsbuildinfo should not be deleted):
```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
```
2. If the working tree has no conflicting changes and branch is not already local:
```powershell
git switch --track origin/feat/pc03c-offline-private-reader-evidence-20261101
git rev-parse HEAD
```
If branch exists, use `git switch feat/pc03c-offline-private-reader-evidence-20261101` without force.
3. Run exact-head tests/build/scan:
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
npm run test
npm run build
npm run check:public-dist
```
4. Run the safe **aggregate-only**, offline summary:
```powershell
node tools/private-sync/read.mjs --summary
```
Enter the same passphrase used when PC-03B created `selected.snapshot.enc.json`. The summary prints counts, observation age, Git evidence coverage and UNKNOWN markers, **without repository names**.
5. Optional: only when viewing on your own private Windows terminal, explicitly allow project-name display:
```powershell
node tools/private-sync/read.mjs --details --ack-private-terminal
```
Do **not** paste details, screenshots with repo names, the selection file, snapshot, or passphrase in a public chat or issue. If details are needed for further work, prefer returning counts and redacted lines.
6. To verify no new plaintext file was created, review only filenames, not contents:
```powershell
Get-ChildItem '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>' -File | Select-Object Name,Length,LastWriteTime
git status --short
```
Existing `latest.snapshot.enc.json` and `selected.snapshot.enc.json` are **read-only** for PC-03C; no export or overwrite occurs.

## Stop / incident gates
- Wrong passphrase, missing file, count mismatch, invalid observedAt, duplicate/wrong selected repository => error and no summary. Never weaken validation.
- Build or privacy scan failure => stop before using detailed mode.
- A `STALE` or `CLOCK_SKEW` snapshot must not be described as current. Re-collection requires a separate, explicit PC-03B action.
- If private details appear in a public place, cease sharing, review exposure and redact promptly.

## Follow-on, not included
- No private web API, database, role-based authentication, browser display, current host checks, deployment automation, or GitHub Pages integration.
- PC-03D may add an owner-local **secured UI**, but its authentication and data-leak threat model must pass human review before any browser access.
- GitHub PR merge and deploy require owner authorization, separately from this read-only pilot.

## Acceptance
- Exact-head `npm run test`, `npm run build`, `npm run check:public-dist`.
- `--summary` from 11-project encrypted private snapshot, correct counts and age.
- Invalid passphrase / tampered ciphertext rejected, no plaintext persisted.
- `--details` refuses display without explicit acknowledgment.
- Host & acceptance remain `NOT_VERIFIED`.
