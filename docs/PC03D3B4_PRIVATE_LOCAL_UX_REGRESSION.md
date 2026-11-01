# PC-03D3B-4 — Owner-local Private UI UX & Session Regression (Draft)

**Scope:** Improve the owner-local read-only UI and add security regression tests with **fictional encrypted Snapshot metadata only**. **No merge, no deploy, no remote network, no real Snapshot in repo or CI.**

**Acceptance update:** PC-03D3B-4 Owner Local Acceptance was reported PASS and visual/denial evidence was inspected on 2026-11-01. See [sanitized acceptance record](PC03D3B4_OWNER_LOCAL_ACCEPTANCE_20261101.md). Full independent network-status/exact-head attestation and D0 historical exposure review remain OPEN. This is a local pilot, not a public security release.

## Latest evidence
- PR #13 (D3B-3) local Private Registry screenshot visibly confirms a paired private local view and five-axis details. **Visual display PASS only**.
- Owner's subsequent PowerShell screenshot confirms `npm run test`: **94/94 PASS**, and `npm run build`: **PASS**.
- In that screenshot the `npm run check:public-dist` command appears, but **its final result is not visible**: still **NOT VERIFIED on D3B-3**.
- D3B-3 browser Logout→Refresh→unauthenticated API 401 and exact Windows-tested commit SHA have not yet been evidenced independently.
- PR #13 and its ancestors remain **Draft**, source is not deployed; historic public commit Windows-path disclosure decision remains OPEN.

## What changed in D3B-4
1. After explicit details acknowledgement, the previously disabled button now says **กำลังแสดงรายละเอียดรายโครงการ**, with `aria-expanded=true`.
2. If the browser becomes LOCKED, the detail button state is reset and `aria-expanded=false`.
3. Observation timestamps are formatted in **Asia/Bangkok**, alongside a clear `RECENT / AGING / STALE / CLOCK_SKEW` description. **STALE cannot be represented as current/live GitHub evidence**.
4. Added **five fictional-only** Node regression tests for locked anonymous responses, UI state/format, exhausted pairing attempts, expired pairing, and logout/access denial after details. These tests cannot exercise the owner's actual encrypted file or private project names.
5. The real-data Node runtime and its private origin/session/summary projection architecture remain local-only. It must not be bundled into `src/` or `dist/`, and **no GitHub Pages private data route is implemented**.

## Windows local test — no private data until synthetic tests pass
The owner should stop any previous local node server using Ctrl+C, check local git state without deleting files, then:

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc03d3b4-private-local-ux-and-regression-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If branch exists, use `git switch feat/pc03d3b4-private-local-ux-and-regression-20261101`; if local modified files conflict, STOP, do not `reset --hard` or `clean`.

Expect **99 tests** only if the previously observed 94 have not changed plus these five; `fail 0` is the real criterion. `check:public-dist` needs the **final PASS line**. Generic security-preflight must continue to say `BLOCKED_FOR_REAL_PRIVATE_DATA` for public/unaudited release; this is intentionally distinct from the owner-approved isolated local pilot.

## Optional owner-local browser retest (ONLY after all tests pass)
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-real-private-local
```

The terminal prompts for the existing PC-03B selected Snapshot passphrase, without echo. Open only the printed `http://127.0.0.1:PORT/` on the **same trusted Windows machine**, pair with the new one-time code, and verify that the snapshot label uses Thai time, freshness remains evidence-based, and the details button changes label after step-up.

While on the trusted machine, click **Logout**, refresh, and verify `/api/summary` and `/api/projects` deny unauthenticated requests with HTTP 401. Press Ctrl+C to stop; verify no listener on the actual formerly used port. Do not share raw private data, screenshots with repository names, cookies, pairing codes, passphrases or Snapshot files.

## Known remaining limitations / decisions
- Loopback HTTP is **not TLS**; same-machine untrusted processes/extensions can still compromise access. The UI is not remotely accessible or approved for LAN/mobile routing.
- In-memory plaintext JS strings cannot be guaranteed securely erased; no file export or persistent browser storage is intentionally implemented.
- D0 prior PUBLIC Git history may still include Windows path examples. This requires owner disposition before Merge (documented limited-risk acceptance vs reviewed remediation).
- The owner's exact local tested SHA and complete manual auth/browser QA must be reconciled before D3B-4 full Local Acceptance.
- Host Deployment, Project Acceptance, and Development remain UNKNOWN/NOT_VERIFIED absent separate recent evidence. GitHub default branch must not be treated as production branch.

**No Merge. No Deploy. No Production changes.**
