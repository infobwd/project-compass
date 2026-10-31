# PC-03A — Local read-only encrypted registry pilot

**Status: DRAFT, NOT PRODUCTION ACCEPTED.** The owner approved ADR-001 (Public Dashboard + Private Registry) but did not approve a merge, GitHub Pages deployment or private data publication.

## Architecture
- Public Dashboard remains fictional fixtures only. GitHub Pages is public and cannot host an access-controlled private registry.
- On an authorized Windows user account, GitHub CLI (\`gh\`) authenticates with GitHub through its own browser flow. The script makes only explicit GitHub API GET requests.
- In-memory collected repository/branch/open PR/open Issue metadata is encrypted with AES-256-GCM and scrypt using a user-entered passphrase, then saved **outside any Git working tree** in the current user's OS application-data directory.
- There is no local HTTP listener, production server, automatic scheduler, private API or frontend integration in PC-03A.
- The collector does not request a Personal Access Token; GitHub CLI handles authentication. Never commit or paste a token or encryption passphrase.
- No PR titles or bodies, source code, student names, health data or host URLs are extracted by this pilot.
- \`coverage\` is PARTIAL when only some repositories are inspected. API failures are UNKNOWN rather than zero or complete. A commit SHA is Git evidence, not host deployment or acceptance evidence.
- Encrypted storage protects only at rest. A compromised Windows session can still expose data; use a trusted machine, private account and full-disk encryption where available. Keep the passphrase safe; if lost, re-run the collector.
- The pilot overwrites its latest encrypted snapshot rather than keeping audit history. Later phases require append-only evidence and freshness detection.

## Non-goals and limitations
- This is **not yet** an authenticated shared backend, live private dashboard, scheduled automatic sync, host check, CI check or local worktree inventory.
- The code must not bundle a snapshot in \`src\`, \`public\`, \`dist\`, a PWA cache or Pages assets. Generic scanner results do not replace human privacy review.
- Never run GitHub write operations, merge, deploy, migrate a database, or grant permissions from this pilot.
- PC-03B requires separate approval: authenticated server-side private registry, least privilege GitHub App credentials, strict user/school scopes, audit history, and allowlisted public projection.

## Gates
1. Exact PR HEAD tests on Windows; use only fictional fixtures for automated tests.
2. \`npm run build\` then \`npm run check:public-dist\` (must not expose private metadata).
3. Owner runs small local read-only pilot and checks only encrypted output/coverage. Do not send the encrypted snapshot to chat.
4. Host/production and real-device QA stay NOT VERIFIED until separately checked.
5. Human code/security review and explicit approval are needed before any merge or deployment.

## Rollback
Stop running the script; no production change exists. The owner may delete the local encrypted snapshot after backup/audit review. Revert the isolated Draft PR if required.
