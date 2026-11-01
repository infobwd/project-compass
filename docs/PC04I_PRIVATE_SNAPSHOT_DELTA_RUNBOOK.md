# PC-04I — Two Saved GitHub Snapshot Delta (Private Local, Evidence-First)

**Date:** 2026-11-01 (Asia/Bangkok). **Status:** Isolated Draft implementation; Windows regression and owner browser acceptance **PENDING**. No Merge/Deploy, GitHub writes, active Snapshot changes or owner TODO writes.

## Source and acceptance boundary

The owner explicitly reported **PC-04H PASS** following Windows testing of saved PR/Issue pagination. Record as **OWNER-REPORTED LOCAL PASS**, not an independently attached final Node log or Host/Production acceptance. The PC-04G prior encrypted Snapshot was manually staged, inspected and activated; the owner separately accepted the post-activation encrypted backup/hash and local browser checks. The known older/newer aggregate observation changed, but **net-count movement cannot identify which PRs were newly opened or removed from the open list**.

This phase answers: “Compared with the immediately preceding saved selected GitHub Snapshot, which PR/Issue numbers newly appear as OPEN and which are no longer observed as OPEN?” A PR missing from a later open list could have been merged, closed without merging, or otherwise changed in access/state: **absence is not proof of Merge, completion or deployment**.

## Hard source validation

PC-04I only compares the two encrypted Snapshots already held **outside Git**:
- Current `selected.snapshot.enc.json` **must exactly match the encrypted envelope** inside the chosen previously activated `snapshot-refresh-stage-<24-hex-id>.enc.json`. If a further activation happened, this phase stops; it will **not** silently compare unrelated files.
- `projects.selection.json` SHA-256 must still equal the Stage's selection digest. Stage metadata includes the digest of its previous encrypted Snapshot.
- The local private folder must contain a generated `selected.snapshot.backup-*.enc.json` whose byte-level SHA-256 equals the Stage's `oldDigest`. That **exact encrypted old Snapshot** and the current active envelope are decrypted only in the private Node process memory, using the existing terminal-entered passphrase.
- Both must satisfy strict selected owner/name/order/count validation. Both PR and Issue lists must have **VERIFIED, complete, exact-count-matching, unique positive numeric references** for every selected project. Incomplete/malformed counts fail closed; no inferred ID from aggregate changes.
- The separately encrypted owner workplan must decrypt and validate against **both** selected snapshots. It is **not updated**.
- The newer saved `observedAt` must be later than the older one. No GitHub API or host request is made by this phase.

## Difference semantics

Per project, the pure model compares:
- **PR newly observed OPEN**: number appears in the newer verified open list but not older.
- **PR no longer observed OPEN**: number appears in older verified open list but not newer; **NOT proof of Merge/Close**.
- Equivalent categories for true GitHub Issues (not PRs).
- Default Git HEAD changed **only when both default-head SHAs are VERIFIED**. Unknown is `NOT_COMPARABLE`, never assumed identical or different. This is not a deployment revision.
- Among PR numbers observed OPEN in both lists, count changed head SHA (only if both available) and draft state changes. This is not test/merge readiness.
- Aggregate old/new open totals, per-category additions/removals, current/previous observation timestamps, selected project count.
- No owner TODO, priority, accepted scope, deployment or project completion changes are made or inferred.

## Two local ways to read the delta

### A. Simple terminal (English-only safe summary)

Only after all Tests PASS on Windows, in trusted PowerShell with the private directory set **outside Git**:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<OWNER_PROTECTED_PRIVATE_DIRECTORY>'
$stageId = 'ACTUAL_24_HEX_ID'
node tools/private-sync/snapshot-delta-cli.mjs --summary --stage-id $stageId
```

Replace example `ACTUAL_24_HEX_ID` with the **real** 24-character hexadecimal ID of the Stage already activated. Never include `< >` around the actual variable's value in PowerShell. Enter the existing passphrase in Terminal; this prints only aggregate counts, observation dates, and encrypted-backup verification flags. **No files written, no network.**

To read individual private repo names and changed numeric IDs only in the owner's local terminal, use:

```powershell
node tools/private-sync/snapshot-delta-cli.mjs --details --stage-id $stageId
```

The tool requires the separate exact word **DISPLAY**, then prints private names/identifiers in that local terminal. **Do not paste/show this verbose output in the public PR.**

### B. Local private browser (recommended for Thai review)

Stop the previously running local private server with `Ctrl+C`. Then run:

```powershell
node tools/private-ui/private-delta-local.mjs --ack-private-workplan-local --delta-stage-id $stageId
```

This is **opt-in** and independent of the older `private-local.mjs` launcher: only the new command loads verified old-backup/current delta into memory. It requires the existing masked local passphrase, uses a **127.0.0.1-only** random port and one-time pairing code. Open the printed `http://127.0.0.1:PORT/` on the **same trusted Windows computer**, not via public Pages or LAN. No local server was started from this GitHub-only implementation.

After pairing, the new Thai section **“มีอะไรเปลี่ยนไปตั้งแต่ Snapshot ครั้งก่อน”** displays **only nonidentifying aggregate counts** (newly observed OPEN, no longer observed OPEN, Issue additions, verified HEAD changes). After the existing separate **ยืนยันและแสดงรายโครงการ** detail authorization, each collapsed project disclosure shows up to **12 observed IDs per change category**, including explicit omission counts if more; exact complete records remain obtainable via private Terminal `--details`. Logout clears the section and revokes the old cookie.

The API's unchanged shared security contract requires Host `127.0.0.1`, same Origin/Sec-Fetch, CSP/no-store, pairing session and separate detail authorization. New read-only routes:
- `GET /api/delta/summary`: unpaired **401**; paired **200**, aggregate-only with **no repo names or PR numbers**; without opt-in verified delta **404**.
- `GET /api/delta/details`: unpaired **401**, paired but not step-up **403**, step-up **200** with owner-private per-project references; without opt-in delta **404**.
- POST and malformed routes remain **404**, and after Logout old cookies yield **401**.
- No browser storage, clipboard export, plain JSON file, new encrypted owner workplan writer, background refresh or public `src/` import.

## Owner Windows acceptance workflow

Preserve the working tree, stop the previous private viewer, fetch/switch the isolated Draft branch, and record exact HEAD. Never reset/clean as a shortcut.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04i-private-snapshot-delta-readonly-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If branch exists locally, replace `git switch --track` with `git switch feat/pc04i-private-snapshot-delta-readonly-20261101`.

This phase introduces **16 fictional-only tests** (9 pure/backup/CLI + 7 HTTP/UI). PC-04H had 8 added tests over the prior owner-observed PC-04G 193; the expected total is approximately **217**, *not an observed Windows PASS*. Require `fail 0`, Build PASS, Public Scan PASS, and the existing source preflight gate. The broad `BLOCKED_FOR_REAL_PRIVATE_DATA` public release gate is **not** waived.

### Manual acceptance after full tests
- [ ] Summary counts are internally consistent with saved old/new snapshots, but do not assert live GitHub changes.
- [ ] Current Snapshot is verified to match the activated Stage and the old encrypted backup hash matches Stage `oldDigest`.
- [ ] The privately encrypted owner workplan remains byte-for-byte unchanged.
- [ ] Private Terminal `--summary` prints no real identifiers; `--details` requires exact `DISPLAY`.
- [ ] Unpaired delta endpoints 401; before step-up details 403; paired aggregate-only 200; after step-up detail 200; after Logout endpoints 401.
- [ ] Private browser shows Thai section, changes per project in collapsed disclosures, no wide overflow at 390px.
- [ ] No TODO created, no PR deemed merged, no Host/Production inferred, no public Pages real data.
- [ ] Private details remain only in owner-local terminal/browser. Share **PASS/FAIL + safe aggregate numbers only**, never project names, raw encrypted files, passphrases or full hashes in PUBLIC issues.

### Security release limitations
Current work is an owner-local evidence review pilot, not a full malicious same-machine-process/browser-extension or historic public Git-path exposure remediation. These are still human security gates. Existing stacked Draft PRs are **unmerged** and the public GitHub Pages app remains fictional DEMO only. **No Merge / Deploy / automatic PR/Issue/TODO status updates.**
