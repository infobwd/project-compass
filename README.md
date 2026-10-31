# BWD Project Compass

**One Dashboard, All Projects, Clear Next Steps**

## Status: PC-01 approved direction · PC-02 fictional UI · PC-03A local encrypted collector (DRAFT)

> **Not deployed. No live private dashboard/backend is implemented. PC-03A only proposes an opt-in, manually run, encrypted local inventory.**

The owner approved **Public Dashboard + Private Registry** on 2026-11-01, recorded in [ADR-001](docs/PC01_ARCHITECTURE_DECISIONS.md). Approval of the direction is **not** permission to merge or deploy.

### PC-02 preview source

This branch adds a React + TypeScript + Vite + Tailwind CSS v4 UI using only fictitious projects. The **DEMO MODE** banner is deliberately always visible. No private repository names, local Windows directories, internal hosts or credentials are used as sample content.

To try it locally from this exact branch:

```bash
npm install
npm run test
npm run build
npm run dev
```

Open the local Vite URL shown by the terminal. Building and device QA have not yet been confirmed on this exact PR head. **Do not deploy to public Pages until source, built artifact and devices pass acceptance.**

### Screens

Overview · Projects (search, filter, card/list) · Project Detail · Next Actions (Owner / AI) · Timeline & Decisions · Daily Brief (demo, not automated).

### Documents

- [PC-00 Discovery Protocol](docs/PC00_DISCOVERY_PROTOCOL.md)
- [PC-01 Security Architecture](docs/PC01_ARCHITECTURE_SECURITY.md)
- [PC-01 Approved ADR](docs/PC01_ARCHITECTURE_DECISIONS.md)
- [PC-02 UX Spec](docs/PC02_DASHBOARD_UX_SPEC.md)
- [PC-02 Source/Acceptance](docs/PC02_SOURCE_IMPLEMENTATION.md)
- [PC-00–PC-06 Roadmap](docs/PC_ROADMAP_ACCEPTANCE.md)
- [ChatGPT/Work Handoff Contract](docs/PC05_CHATGPT_HANDOFF.md)

### Security boundary

GitHub Pages is public. Private project registry and evidence snapshots must use a separately authenticated, authorized store/API; private data cannot be hidden inside a client bundle, public JSON, JavaScript source map, service worker cache, or static asset. Source repositories remain the source of truth.

No automatic merge, Pages deployment, private-data sync, database migration or production modification.


### PC-03A local-only GitHub collector (Draft PR #3)

**Do not run in GitHub Pages or in the browser.** The collector makes GitHub GET requests through the owner's existing GitHub CLI login, then encrypts metadata locally outside the Git checkout. This is a pilot **not** a production private registry API.

1. [Windows step-by-step runbook](docs/PC03A_WINDOWS_LOCAL_RUNBOOK.md)
2. [Security boundaries and acceptance](docs/PC03A_PRIVATE_SYNC_SECURITY.md)

After clean checkout and successful tests on Windows:

```powershell
node tools/private-sync/sync.mjs --check
node --test tests/pc03-private-sync.test.mjs
npm install
npm run test
npm run build
npm run check:public-dist
```

Then, only if the owner wishes to perform read-only collection using the local GitHub CLI browser session:

```powershell
gh auth status
node tools/private-sync/sync.mjs --collect --owner infobwd --limit 3 --ack-private-local
```

By default the encrypted snapshot is saved in the user's private application-data area, not this repo. On Windows it can instead use a separately protected absolute directory on D: via `BWD_COMPASS_PRIVATE_DIR`; see the [runbook](docs/PC03A_WINDOWS_LOCAL_RUNBOOK.md). Keep it outside every Git worktree. **Do not commit the snapshot or share the passphrase.** The collector is manual; it does not yet expose private data in the Dashboard and does not run in the scheduled Morning Brief.

No merge, no deploy and no production modifications are authorized by this pilot.

### PC-03B explicit private project scope (Draft PR #4)
The prior `--limit N` selects the first N alphabetically, not particular projects. PC-03B adds `--selected`, requiring a strictly validated private selection file outside the checkout; see [scoped-sync protocol](docs/PC03B_SCOPED_LOCAL_SYNC.md). The selected encrypted file is written separately from the earlier three-repository pilot. Real project names and private configuration remain on the owner's Windows D: drive only. This is **not** a live authenticated backend and does not verify any host deployment.


### PC-03C encrypted private evidence reader (Draft PR #5)
Read the owner's PC-03B encrypted 11-project snapshot entirely **offline** in a local terminal. Counts, evidence freshness and independently UNKNOWN deployment/acceptance states are displayed without exporting plaintext. Project names appear only on an explicitly acknowledged local detailed command. [PC-03C Windows runbook](docs/PC03C_OFFLINE_PRIVATE_READER.md).

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
node tools/private-sync/read.mjs --summary
# Optional only on a private local terminal:
node tools/private-sync/read.mjs --details --ack-private-terminal
```

PC-03C does not read GitHub live or connect a private backend to the public dashboard; all review, merge and deploy gates remain separate.


### PC-03D owner-local private dashboard — security design only (proposed)
The owner reported PC-03C local Node tests, build, public scanner, and 11/11 encrypted summary PASS. These are **owner-reported Local Acceptance**, not independent CI or Production Acceptance.

Before starting an actual private-data browser UI, review:
- [PC-03D architecture and local browser threat model](docs/PC03D_LOCAL_PRIVATE_DASHBOARD_ARCHITECTURE.md)
- [PC-03D implementation phases, security tests and acceptance](docs/PC03D_IMPLEMENTATION_TEST_MATRIX.md)

This proposal does **not** implement a server, login, pairing code, private web API or authenticated page; nothing is deployed or merged. Prior public draft documentation containing concrete Windows path examples also needs privacy review before merge. The existing offline CLI remains the safe fallback.
