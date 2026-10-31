# PC-00 — Discovery, Inventory and Evidence Protocol

Status: **DRAFT / DESIGN ONLY** · 2026-11-01 · Public-safe document.

## Purpose
Build an evidence-based inventory without another manually maintained roadmap. The authoritative project roadmaps remain in their own repositories; Compass holds references, metadata, verified snapshots, and decisions that cannot be reconstructed elsewhere.

## Source and verification rules
1. Discover the connected account's repository list (including authorized private repos) using authenticated, read-only GitHub APIs. Deduplicate by stable repository ID, not by display name.
2. For each repository, record visibility, default branch, exact HEAD SHA, active branch, open/draft/merged PRs, issues, milestones, workflow/check outcomes, and **explicit** source documents.
3. Determine a project's true canonical development branch from its README / governance documentation; it may differ from default `main`.
4. Read a project roadmap and current-state / acceptance notes before suggesting an action. Commit timestamps, green builds, merged PRs, and comments do **not** independently prove host deployment or user acceptance.
5. Evidence order: live authenticated GitHub metadata for Git facts; canonical source docs for roadmap intent; signed acceptance / independent host evidence for production; owner reports labeled REPORTED; inference labeled INFERRED. Contradictions remain visible; never resolve silently.
6. Capture `observedAt`, `sourceUrl`, `sourceRef`, `sourceSha`, and `confidence` per claim. When unable to check, use UNKNOWN or NOT VERIFIED, not false/zero.
7. Inventory of local Windows directories is **not verified** by GitHub access. A future local read-only agent may add signed local snapshots, never execute destructive commands.
8. Keep the entire authenticated inventory and internal conclusions **outside this public repository** unless individually reviewed and explicitly approved for publication.

## Minimal private inventory workflow
- Read-only source collection → immutable raw evidence (private) → normalizer → validity rules → reviewable status snapshots → action proposals.
- Maintain `sourceOfTruth` pointers instead of copying roadmaps.
- A project is not ACTIVE merely because it has commits. Mark a missing or non-canonical source clearly.
- Count PRs separately from logical work items; identify stacked PR chains and blocked parent merges.
- Detect apparent conflicts: same production host, same migration namespace, shared auth/SSO, or mutually dependent PR heads.
- Show changes from the previous verified snapshot as a diff, not as a newly invented status.

## Exit criteria
- Each targeted project has a repository identity + branch and SHA or explicit UNKNOWN.
- PR/issue inventories and their observed timestamps are recorded.
- Canonical roadmap pointer and next evidence-required action exist or are NOT VERIFIED.
- No user-machine paths, credentials, personal information, or internal project names have been committed publicly.
- Human review signs off the inventory's visibility boundary before any rollout.

**Not evidence of completion:** creation of a Compass document, GitHub PR, GitHub Pages URL, or CI success alone.
