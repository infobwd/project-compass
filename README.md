# BWD Project Compass

**One Dashboard, All Projects, Clear Next Steps**

> **Status: PC-00/PC-01 DOCUMENTATION PILOT ONLY.** No dashboard, automated sync, Pages deployment, production access, or private registry has been enabled.

Project Compass is intended to summarize evidence-backed development status from existing GitHub repositories without replacing their canonical Roadmaps, testing processes or deployment acceptance. Work begins with a private inventory and a **public-safe documentation branch**.

## Document map
- [PC-00 discovery and evidence protocol](docs/PC00_DISCOVERY_PROTOCOL.md)
- [PC-01 architecture / security boundary and ADRs](docs/PC01_ARCHITECTURE_SECURITY.md)
- [PC-02 dashboard UX design](docs/PC02_DASHBOARD_UX_SPEC.md)
- [PC-00 through PC-06 acceptance and rollback](docs/PC_ROADMAP_ACCEPTANCE.md)
- [ChatGPT / Work handoff and daily brief](docs/PC05_CHATGPT_HANDOFF.md)
- [Strict public record JSON schema](schema/public-project.schema.json)
- [Invented, public-safe demo records](fixtures/demo-public-projects.json)

## Privacy-first rule
**This repository is public.** Do not commit private repository inventories, internal service or database addresses, local filesystem paths, secrets, student/teacher/personal records or production evidence here. The examples in `fixtures/` are entirely fictitious.

A future public GitHub Pages UI may render **only approved public summaries or synthetic fixtures**. An authenticated private backend/store is required for the internal project inventory. A public Pages site is **not** access control.

## Current state and approval
The design and source boundaries are for review. No automatic merges, no deployment, no source-repository changes and no external scheduler were initiated by these documents. GitHub pull requests and source-specific roadmaps remain authoritative. Obtain explicit owner approval for any future merge or release.
