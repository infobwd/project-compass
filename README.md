# BWD Project Compass

**One Dashboard, All Projects, Clear Next Steps**

## Status: PC-01 approved direction · PC-02 synthetic prototype (DRAFT)

> **Not deployed. No live status sync. No private registry or authentication implemented.**

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
