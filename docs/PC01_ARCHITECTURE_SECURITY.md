# PC-01 — Architecture, Security and Data Flow

Status: **PROPOSED / NOT IMPLEMENTED** · 2026-11-01.

## Decision proposal: split public and private surfaces (ADR-001)
**Choose a public-safe presentation shell plus an authenticated private project registry.**
A public GitHub Pages build can hold static assets, fictitious demo fixtures, and manually approved non-sensitive summaries only. It is never an authenticated gateway to private GitHub data.

```text
GitHub repositories (public/private, read-only)
             |
Authenticated server-side collector / approved Work session
             |
  private evidence + scoped normalized registry
             |
  rules engine: staleness, cross-repo dependencies, next actions
             |
   +--------------------------+
   |                          |
Private authenticated API   Public release sanitizer (deny by default)
   |                          |
Private dashboard / chat    Approved static JSON + GitHub Pages
```

## Security boundary and threat model
- Treat repo names, PR bodies, internal deployment URLs, local paths, school operations, credentials, student/teacher records, personal health, and welfare account details as **private by default**, even if a subset is exposed elsewhere.
- Frontend must not contain PATs, GitHub App private keys, refresh/access tokens, secrets, service-account JSON, or server-to-server credentials.
- A build-time snapshot sourced from private repositories is **still leaked** if bundled into a public JS asset, source map, HTML, PWA cache, or downloadable JSON. Obfuscation, `robots.txt`, and hidden UI do not provide access control.
- Never expose private data with the `VITE_*` environment prefix, client environment variables, unprotected GitHub Actions artifacts, workflow logs, or public Pages commits.
- Private collection requires short-lived scoped credentials, least privilege, audited access, server-side authorization and proper secret storage. No user credentials are forwarded by the browser.
- Scrub HTML/Markdown and malicious untrusted issue/PR text before display. Treat model-generated action suggestions as untrusted until reviewed.
- Default to fail-closed on permission failure, schema mismatch, expired evidence, and missing approval.
- Preserve school, tenant, and role boundaries. Avoid directly linking sensitive record IDs from public pages.
- Public PWA may cache only approved public fixtures/assets. Authenticated private pages must enforce strict cache and storage rules, including sign-out behavior.
- Maintain a release allowlist and a CI/static scanner that rejects sensitive key patterns, internal URLs/paths and any unapproved registry fields before publication.

## Private registry design (non-public storage)
`Project`: stable ID, title, repo ID, visibility, canonical branch, active branches, local workspace (optional), host/staging (optional), stack, DB/migration pointers, roadmap URL.
`Evidence`: claim ID, scope, origin, URL, SHA, observation time, validity, exact supporting text reference.
`WorkItem`: owner, development/git/deployment/decision states, priority, dependencies, blocking evidence, acceptance.
`StatusSnapshot`: per-project states with an immutable observation time, source list and completeness.
`Decision`: what was authorized, by whom, why, effective time, superseding decision, evidence.
`Handoff`: chat/project context pointer, next safe action, forbidden actions and outstanding approvals.

Use an append-only change log to retain why status changed. Keep project-local source documents in their source repositories.

## Independent status axes
- Development: PLANNED, DESIGNING, IMPLEMENTING, TESTING, REVIEW, ACCEPTED
- Git: LOCAL_ONLY, PUSHED, PR_OPEN, MERGED
- Deployment: NOT_DEPLOYED, STAGING, DEPLOYED, HOST_VERIFIED
- Decision: READY, BLOCKED, WAITING_USER, NEEDS_APPROVAL
- Confidence: VERIFIED, REPORTED, INFERRED, STALE, UNKNOWN

Each status supports UNKNOWN as a missing observation, and records its own `observedAt` and evidence. A merged PR is not a `HOST_VERIFIED` deployment. A prior HOST_VERIFIED snapshot may become STALE with age or conflicting evidence.

## Sync options and authorization
A. **MVP:** Read-only GitHub collector operated in an authenticated tool session, exports private snapshots to a protected store; public Pages uses synthetic fixtures.
B. **Later:** Server-side GitHub App installation with scoped read permissions and private API authentication; a scheduled job updates snapshots.
C. **Public-only safe view:** Publish allowlisted, explicitly approved aggregates via deterministic sanitization after inspection.
A private repo cannot be made safe by merely pointing a public Pages frontend at it.

## ADR-002: Reuse-first
GitHub PRs, Issues, Actions and the per-repo Roadmaps remain authoritative; do not invent a second manual board. Compass only maintains enrichment, evidence, decisions, sync metadata and user-facing views.

## ADR-003: Local inventory
Opt-in Windows CLI tool, read-only by default, emits a private signed manifest of local path, branch, HEAD, dirty state and remote comparisons. Never upload local paths to public Pages. No delete/reset/checkout/push actions without separate approval.

**Production write policy:** Compass PC-00/01/02 never deploys, merges, migrates, changes permissions, or modifies another project.
