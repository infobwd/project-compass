# PC-03B — Explicit Private Project Scope (DRAFT)
**Security boundary: PUBLIC repository holds generic code and fictional test names only.**
No private repository list, local credentials, host data, actual snapshots or project-private evidence is committed.

## Motivation
A count-limited GitHub sync reads the first N sorted accessible owner repositories, not necessarily the designated school projects. PC-03B adds explicit local-only scope and evidence of selection completeness.

## Design
- Use an opt-in flag `--selected` in addition to `--collect --owner ACCOUNT --ack-private-local`.
- The selection file lives at `<BWD_COMPASS_PRIVATE_DIR>/projects.selection.json`, **outside the public Git working tree**.
- The text file contains only private metadata, with the strict structure:
```json
{
  "format": "BWD-COMPASS-SELECTION-V1",
  "owner": "sample-owner",
  "repositories": ["sample-owner/sample-project"]
}
```
- Strictly validate 1..40 unique owner-qualified full names. Never infer requested scope from GitHub listing order.
- Do not save any scoped snapshot if the owner repository listing is incomplete or one requested repository is missing/inaccessible. Report failure, not zero/complete.
- Save an AES-256-GCM snapshot as `selected.snapshot.enc.json`; preserve the original `latest.snapshot.enc.json` 3-repo pilot.
- Selection mode reports `coverage=ALL_SELECTED`, not `ALL_ACCESSIBLE_FOR_OWNER` and not deployment acceptance.
- No private HTTP API, app-server, auth-backed private UI, host probe, private data import into React, or Pages publishing.

## Windows / D: procedure
1. Keep Git checkout separate from the encrypted private directory and test via the selected Draft PR branch.
2. User creates the private `projects.selection.json` outside Git with only approved names.
3. Run `npm run test`, `npm run build`, `npm run check:public-dist`.
4. Run the selected collector manually:
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = 'D:\BWD-Compass-Private\private'
node tools/private-sync/sync.mjs --collect --owner sample-owner --selected --ack-private-local
```
5. Verify `selected.snapshot.enc.json` exists; report **counts only**, never the selection JSON, passphrase, or snapshot contents.
6. If any missing/inaccessible repo is reported, stop and review private allowlist and `gh auth status`. Do not weaken validation.
7. Never merge/release from this pilot automatically.

## Boundaries and acceptance
- Git branch/PR metadata is not host release or project completion.
- The default branch may be a legacy branch; project-specific canonical branch mapping requires separate evidence.
- Host, local Windows worktrees, CI, real-device QA, frontend private authentication and public projection remain NOT VERIFIED / NOT IMPLEMENTED.
- The plain-text selection file is **not encrypted**: keep the private D: directory protected by Windows ACLs and encrypted disk. It is configuration only; full snapshots are encrypted.
- Each future public projection must be allowlisted and approved; never put these private records in `src/`, `public/`, `dist/` or GitHub Pages.

## Rollback
Do not run `--selected`, or switch back to the PC-03A branch. Local scoped output is a separate new file and does not replace the pilot. Do not delete files automatically.
