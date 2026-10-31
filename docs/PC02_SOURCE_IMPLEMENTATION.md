# PC-02 — Synthetic Dashboard Implementation (review-only)

Date: 2026-11-01. Stacked on PC-00/PC-01 Draft PR #1. **NOT DEPLOYED.**

## Scope
Public-only React / TypeScript / Vite / Tailwind v4 source. Demo Overview, project list search/filter, detail panel, separated next actions, decision timeline, illustrative daily brief, light/dark themes, mobile bottom navigation. All four example projects are invented. No connection to GitHub, Windows worktrees, private registry, database, host, or automation.

## Test matrix and acceptance
- Static public contract tests: run `npm run test`
- Install and build on a network-connected local machine: `npm install`, `npm run build`, `npm run dev`
- Real browser 390×844, 1024×768, desktop 1440×900; zoom 125%, 150%, 200%; keyboard navigation, dialog focus/close, no horizontal overflow, safe-area and dark-mode visibility.
- Review final dist for secret/internal strings, source maps and unexpected network calls.
- Server-backed private registry, authorization and sanitized publishing are separately blocked in PC-03.
- PWA offline/service worker is **not** part of this prototype.
- Initial tests are source-only; TypeScript/Vite build and browser device acceptance are **NOT VERIFIED** until run at this exact head.

## Risks / rollback
No Pages publishing workflow or deployment command is present; PR remains Draft. Drop the isolated branch to roll back. Do not merge, deploy, migrate, copy confidential data into fixtures, or enable scheduled tasks without separate explicit owner authorization.
