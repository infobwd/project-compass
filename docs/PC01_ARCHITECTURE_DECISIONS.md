# Project Compass — Architecture Decision Register

## ADR-001 — Public Dashboard + Private Registry

- **Decision:** APPROVED by project owner in ChatGPT conversation on 2026-11-01 (Asia/Bangkok)
- **Applies to:** PC-01 architecture; PC-02 public-safe prototype; PC-03 future authenticated sync
- **Choice:** the public GitHub Pages repository contains only static application code, synthetic examples and individually approved sanitized public metadata. The operational project registry and evidence snapshots containing private repository identifiers, working directories, service hosts, migrations and internal decisions must remain in authenticated private storage.
- **Security:** deny-by-default publication, no frontend credentials or private API tokens, no privileged operations from public browser JavaScript. Private registry must verify authorization server-side and must not rely on hiding values in a public bundle.
- **Data origin:** original project repositories remain authoritative; Compass stores links, snapshots and decisions rather than copying roadmaps as a second source of truth.
- **Approval scope:** approval of the architectural direction **is not** authorization to merge PRs, publish GitHub Pages, deploy, migrate databases, create external services or access the user's Windows directories.
- **Implementation sequencing:** PC-02 (fictional UI) may proceed in an isolated branch; PC-03 live sync is BLOCKED until private storage, identity, authorization, secret management and audit controls are reviewed.
- **Status:** ADR APPROVED, but PC-01 security implementation and acceptance remain OPEN.
- **Rollback:** this design can be superseded with a new dated ADR after privacy review. No production rollback exists because no backend has been deployed.

## ADR-002 — Reuse-First / Evidence-First

- **Status:** design principle carried from PC-01 proposal; operational validation pending.
- GitHub PR/Issues/Commits/Actions are Git evidence; canonical roadmap docs are planning evidence; host acceptance requires independent host/device evidence.
- Separate Development, Git, Deployment, Decision and Confidence axes. Unknown claims remain UNKNOWN; an opened or merged PR never implies a production PASS.

## ADR-003 — No automatic Merge or Deploy

- **Status:** enforced project policy.
- Every Merge, GitHub Pages publish, host release, schema change, data sync exposure and credential installation requires separate explicit owner approval and evidence review.
