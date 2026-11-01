# PC-04N — Evidence Ledger & Safe Promotion Gates

**Snapshot:** 2026-11-01 (Asia/Bangkok) · **Documentation-only stacked Draft** · No Merge / Deploy / host write / real TODO.
**Purpose:** consolidate the owner-observed PC-04K–M evidence, prevent accidental promotion of owner-private code into the Public DEMO, and define clear separate decisions before further use.

## 1. Evidence policy (source of truth, not inferred completion)

- GitHub PR metadata is **Git evidence**, not Windows test or Host acceptance.
- A user-provided Windows screenshot is **OWNER-OBSERVED** evidence, not independently reproduced CI. A short owner completion statement is **OWNER-REPORTED**, not necessarily a complete per-check terminal transcript.
- A saved encrypted Snapshot is a **time-bounded GitHub observation**, not a live status feed. Current GitHub `open` means observed open at query time, not merged, deployed, accepted or done.
- A fictional/synthetic pass is not real-private Windows browser acceptance. An M1 or M4 risk acceptance is a human decision, not technical remediation.
- No stage is marked DONE or ACCEPTED if its exact acceptance evidence is absent. Keep `OPEN`, `HOLD`, `NOT_VERIFIED` and `OWNER_REPORTED` distinctions visible.

## 2. Current project gate ledger (public-safe)

| Gate | Status | Evidence scope and remaining limitation |
| --- | --- | --- |
| PC-04K read-only exact saved-Delta + live GitHub GET | **OWNER-OBSERVED LOCAL PASS** | `PC04K_READ_ONLY_REVIEW`, exit 0, no task/write, encrypted Workplan SHA unchanged; no Host inference |
| PC-04K first cancellation | **OWNER-OBSERVED LOCAL PASS** | `PC04K_CANCELLED_NOT_REVIEWED`, no write, file list and digest unchanged |
| PC-04K final cancellation | **OWNER-OBSERVED LOCAL PASS** | `PC04K_CANCELLED_UNSAVED`, exit 0, no write, file list and digest unchanged |
| PC-04L fictional encrypted commit/backup/recovery regression | **OWNER-OBSERVED EXACT-HEAD PASS** | 245/245 Node tests, 0 fail, build/public-dist PASS, owner confirmed matching tested SHA; fictional only |
| PC-04M M1 historic Git path | **OWNER ACCEPTED RESIDUAL RISK; NOT REMEDIATED** | Historical commits/branches may remain publicly reachable; subsequent discovery of real secrets triggers separate incident handling |
| PC-04M M2 synthetic HTTP authorization | **OWNER-OBSERVED SYNTHETIC PASS** | Expected 401 → 403 → 200 → 401; logout 204; no actual private data |
| PC-04M M3 actual encrypted Snapshot-only browser | **OWNER AUTHORIZED AND USED (READ-ONLY SCOPE)** | No real Workplan/Delta browser load or real TODO write authorized by M3 |
| PC-04M M4 local/browser threat model | **SOURCE REVIEW + OWNER CONDITIONAL RISK ACCEPTANCE** | Trusted workstation/browser operational restrictions; hostile same-user process/extension and BFCache/ACL behavior not independently certified |
| PC-04M M5 actual encrypted Snapshot-only browser | **OWNER-OBSERVED PARTIAL / FINAL HOLD** | Screenshots show summary/details/projects 200, logout 204, LOCKED; owner later reported completion of post-logout/refresh/checksum instructions, but exact 401 and three immutable-file True/False lines were not supplied as distinct evidence; real paired-before-details 403 not separately observed |
| Real encrypted TODO commit from owner data | **NOT AUTHORIZED / NOT TESTED** | Fictional commit PASS and cancellations do **not** imply real owner write acceptance |
| Real Host/Production project acceptance | **NOT_VERIFIED** | No merged/deployed status inferred from GitHub metadata or private Snapshot |

**M5 exit criteria if the owner later wants the final security sign-off:** one redacted, status-only record containing actual local before-pair 401, paired/pre-details 403, post-step-up 200, logout 204, post-logout 401, refresh LOCKED; exact encrypted-file checks reported `Snapshot unchanged=True`, `Workplan unchanged=True`, `File list unchanged=True`, and tested local SHA. Do not copy logs, cookies, full URLs, project names, terminal output containing secrets or private paths. The owner may keep the underlying evidence on their trusted Windows computer. Do **not** reopen/refresh/activate a Stage or change a Workplan solely to satisfy this ledger.

## 3. Separate release lanes — DO NOT cross

| Lane | Allowed scope | Current governance |
| --- | --- | --- |
| **PUBLIC** `main` / manual Pages demo | Only fictional portfolio UI, public source/test/dist scanners, explicit `workflow_dispatch` Pages publishing | `main` already contains a documented public-only manual release workflow and PC-06 checklist. **Actual live Pages deployment and its browser acceptance are not asserted here**. Any future deployment requires a separate owner go decision and workflow review |
| **PRIVATE** stacked Draft chain | Offline encrypted Snapshot/Workplan, terminal-only owner actions, local loopback browser, real project observations on owner Windows | Never merge this chain into public `main` to “get features live.” A local Windows user can run individually authorized tools; this is not a production/private remote deployment |
| **HOST** separate project systems | Repo/host readiness and operational test evidence for each school system | Keep separate from BWD Compass portfolio metrics; owner or project-specific team must confirm actual Host acceptance independently |

Connected GitHub inspection on 2026-11-01 showed the *documentation-only* PC-04M PR stacked on PC-04L; both remain Draft/Open/Unmerged. The public `main` has a separate fictional-only README/release design. Actual branch protection/Pages settings and web deployment must be verified afresh before owner action.

**Danger:** GitHub PR base/target and feature history matter. The full private stacked branch may introduce private runtime source and historical path examples to a public default branch even when the newest PR only changes Markdown. Never use “Merge all” or retarget a private stacked PR to `main` by convenience.

## 4. Owner go/no-go decision matrix (manual actions only)

### A — Continue LOCAL PRIVATE read-only workflow
- **Prerequisites:** trusted personal Windows machine; M3 narrow authorization; M4 conditional risk policy; encrypted Snapshot present outside Git; use exact loopback URL and terminal-only passphrase.
- **Permitted:** read-only review, redacted evidence recording, stop server by Logout and Ctrl+C.
- **Prohibited unless separately approved:** real `--add-action` / `CONFIRM`, snapshot refresh or activation, host writes, remote sharing and public export.

### B — Consider real owner TODO write in the future
- **Prerequisites:** fresh explicit owner approval for a **single** intended real action; correct exact selected saved reference and current live GitHub GET; real reference review; backup recovery plan; checked protected local folder; separate REVIEWED and CONFIRM; post-write encrypted backup/digest audit.
- **Current decision:** **HOLD**. No implicit authorization from prior synthetic 245/245 or M3/M4 risk acceptance.

### C — Publish/modify PUBLIC DEMO
- **Prerequisites:** isolated public-only PR based directly on public main, public-source check, tests/build/dist scans on exact proposed commit, public-content and mobile/browser review, separate owner approval to merge, and another separate owner action to run the manual Pages workflow.
- **Current decision:** **HOLD** on any new merge/deploy. Do not include real project names, current internal data, host URLs or private APIs in the public build.

### D — Promote or refactor the PRIVATE stack
- **Prerequisites:** explicit choice of private distribution architecture, independent threat review, exact-head tests, Windows acceptance, rollout/rollback plan; never simply merge private stacked PRs into public main.
- **Current decision:** **NO PROMOTION AUTHORIZED**. Keep branches and encrypted owner data separate.

## 5. Next planned execution (non-destructive)

1. Keep PC-04M M5 as owner-reported partial until its precise remaining real-private status-only evidence is available; do **not** repeat the entire previous test suite by default.
2. Review this PC-04N public-safe evidence/decision ledger in Draft. Reconcile any stale README “pending” text in the stack based on evidence rather than retroactively marking tests as independently PASS.
3. For a user-friendly everyday project status page, design a private-only evidence delta view using existing encrypted Workplan/Snapshot; **no remote upload of owner data, no automatic TODO or DONE**, and no new scheduling until explicit owner intent.
4. Separately decide whether the current public fictional site needs any change; if not, do nothing to its deployment.
5. Before any future release or real action, record **owner-approved go/no-go and exact scope**; maintain a human-operated rollback path.

## 6. Windows operator notes (only if verifying source)

Use read-only Git metadata commands such as `git status --short`, `git branch --show-current`, `git rev-parse HEAD` and `git log -1 --oneline`. If local worktree has edits, do not force-switch, reset hard, clean or overwrite. Never paste local encrypted contents into GitHub or chatbot tools.

**This document is a governance/evidence artifact, not a release note saying that private work is complete.** It changes no HTTP behavior, no workflow trigger, no build or production code. There is **no automatic Merge, Deploy, TODO, GitHub status mutation, Stage activation or real-private write.**
