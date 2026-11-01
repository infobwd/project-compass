# PC-03D3B-0 — Offline Evidence Adapter & Real-Data Browser Security Gate

**STATE: CODE PILOT / LOCAL QA PENDING — REAL PRIVATE BROWSER DATA REMAINS BLOCKED.**  
**Scope:** Only a pure, offline evidence projection and a source-level preflight; neither decrypts files nor creates a new web endpoint. Owner's instruction to continue D3A authorizes safe follow-on work, not an implicit release or private-data browser unlock.

## Latest grounded evidence (2026-11-01 Asia/Bangkok)
- PC-03D3A: owner supplied screenshot showing fictional five-axis view and reported the remaining checks passed. D3A Local Acceptance is **OWNER_REPORTED PASS**; exact tested Windows SHA and full independent test logs were not provided.
- PC-03D2: administratively closed for synthetic-only local use, **with exceptions** for exact Windows SHA and manual Logout → Refresh → direct API 401 evidence.
- PC-03D0: targeted source-path redaction on latest branch done; historic Git commits in this PUBLIC repository still contain prior Windows path examples. Risk disposition or approved remediation is **OPEN**.
- All previous PRs remain distinct GitHub proposals; no host or production release is inferred.

## What D3B-0 actually implements
- `tools/private-ui/offline-projection.mjs`: pure function `projectOfflineEvidence(snapshot,selectedNames,clock)` uses the existing strict PC-03C `buildEvidenceSummary` validator. It does not open files, read passphrases, fetch GitHub or serve HTTP.
- The projection is marked `OFFLINE_NODE_ONLY_NOT_FOR_HTTP_OR_PAGES` and contains **private repository identifiers if real private data are supplied to the function in another, separately approved future phase**. Never serialize this projection to Pages, GitHub Actions logs, issue comments, public UI or an HTTP response under this D3B-0 phase.
- Git head is `OBSERVED_DEFAULT_HEAD` only when validated in a snapshot, not necessarily deployed. Open PR/Issue collections preserve `null` for `UNKNOWN`, not false zero. Five independent axes: Development=UNKNOWN, Git=OBSERVED_DEFAULT_HEAD/UNKNOWN, Deployment=NOT_VERIFIED, Decision=HUMAN_REVIEW_REQUIRED, Confidence=OBSERVED_GIT_ONLY/PARTIAL_GIT_EVIDENCE/EVIDENCE_AGING_OR_STALE.
- `projectionHealth()` offers minimal nonidentifying health/count state **for offline QA only**; does not release a real-data browser view.
- `tools/private-ui/security-preflight.mjs --check`: scans committed code boundaries only (not snapshots) and prints 5 automatable source checks plus an unconditional `BLOCKED_FOR_REAL_PRIVATE_DATA` and explicit human follow-ups. A `PASS` here is **not authorization** to connect real data.
- Regression tests use fictional names/commits and check null vs zero, order/coverage denial, stale evidence, independence of five axes, and absence of offline adapter imports in the synthetic HTTP/public React source.

## Privacy / threat model
**Dangerous boundary:** encrypted Snapshot → plaintext memory → private HTTP response → browser storage/extensions/dev tools/network. D3B-0 stops before the HTTP boundary and does not call PC-03C decrypt from a server.

```text
PC-03C validated object (in future owner-only Node process)
      | pure function, offline, in-memory
      v
Five-axis offline private projection
      X  NO HTTP response, browser, public dist or GitHub Pages
```

The existing synthetic HTTP server is left synthetic-only. No `readFileSync` of selection/snapshot, no `decryptSnapshot` and no secret or repo token in frontend.

## Windows operator QA (on the exact D3B branch)
**Do not delete or commit unrelated untracked files.** D: project path below is local operator instruction; **do not commit the actual path into the PUBLIC repository**.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc03d3b-offline-evidence-projection-gates-20261101
git rev-parse HEAD
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the branch already exists locally, `git switch feat/pc03d3b-offline-evidence-projection-gates-20261101` is enough; never force-reset or clean a dirty worktree. After all checks PASS, observe a line that **must remain**:
```text
REAL PRIVATE BROWSER GATE: BLOCKED_FOR_REAL_PRIVATE_DATA
Outstanding human security gates: 5
```
This BLOCKED label is intentional and the correct result for D3B-0. No new browser server is needed for this phase; D3A's synthetic web app may be used for separate visual regression only.

Expected test total if prior suite still comprises 62 and this branch added 12: **74, fail 0**; expectation is NOT an observed run. Do not claim Local Acceptance until Windows tests and commit are reported.

## Non-negotiable real-data gate: still not open
Before any authorization to connect the selected encrypted Snapshot to a local browser, require:
1. **Human decision on historic public-path exposure**, risk acceptance or reviewed remediation; do not rewrite history unilaterally.
2. **Exact Windows commit SHA**, manual Logout→Refresh and unauthenticated `/api/summary`, `/api/projects`, `/api/evidence` returning 401, verified with server running, plus post-shutdown port check. Do not send codes or cookies.
3. **Explicit owner approval for actual private browser data**, distinct from this D3B-0 development approval.
4. Independent, threat-driven testing of localhost cross-origin/Host/DNS rebinding, CSRF, session lifecycle and browser cache, including user-originated hostile sites and local processes. Loopback alone is insufficient.
5. Separate acceptance of terminal-only unlock, secrets handling, least-privilege output projection, private browser detail step-up, public dist isolation, source history and no unnecessary persistence.

Only after these gates can a separate D3B-1 implementation PR be considered. Do not treat a passing preflight scanner as security certification.

## Operator steps and rollback
- Existing PC-03C terminal reader remains the supported way to inspect actual encrypted private data locally.
- This branch adds **no** real-data browser runtime or auto-refresh, and does not alter Windows private snapshot files.
- To roll back, stop any synthetic Node process using Ctrl+C and switch safely back to the earlier D3A branch. Never purge or rewrite Git history without a separate decision.
- No Merge, Deploy, Pages private data or Production change.
