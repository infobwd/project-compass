# PC-03D3B-3 — Owner Windows QA update (partial evidence)

**Recorded:** 2026-11-01 (Asia/Bangkok). **Scope:** explicitly authorized OWNER-LOCAL private registry pilot only, never GitHub Pages or remote access.

## Grounded screenshot findings
- `npm run test`: **94 tests, 94 pass, 0 fail** — visible in owner's PowerShell screenshot.
- `npm run build`: **PASS**, Vite 7.3.7, 1580 modules transformed, successful build output — visible in screenshot.
- `npm run check:public-dist`: **command invocation visible; final result is NOT visible**. **Do not label PASS yet.**
- Private local paired browser displayed a real selected-snapshot summary and project details in a prior screenshot; **visual display PASS**, not full security acceptance.
- Exact `git rev-parse HEAD` on the owner's test checkout: **NOT VERIFIED** from screenshots.
- Private local runtime manual Logout → Refresh → unauthenticated `/api/summary` and `/api/projects` denied (HTTP 401): **NOT VERIFIED** in owner evidence.
- Shutdown, listener disappearance, browser cache/extension exposure and D0 historical PUBLIC Git path review: **OPEN / NOT VERIFIED**.

## Acceptance scope and next actions

**D3B-3 automated tests and build: PASS per Windows screenshot.**  
**D3B-3 full Local Acceptance: PENDING** while public scan result, manual logout/API 401, tested SHA and data-handling review remain open.

The latest test-count screenshot is not itself a code review or independent CI. Real project identifiers, raw snapshot data, workstation paths, browser screenshot and pairing credentials MUST NOT be copied into this PUBLIC repository.

1. On the owner's Windows terminal, run `npm run check:public-dist` and inspect the **final** PASS/FAIL line.
2. With the real local server already open and paired, click Logout, refresh, and verify both protected APIs return 401 without cookies. Never post cookies or pairing codes.
3. On the exact tested branch, `git rev-parse HEAD` and retain the result privately for evidence matching.
4. Press Ctrl+C and check the actual loopback listening port disappears.
5. Human review for old public Git history remains required before any merge.

**No Merge / Deploy / public or LAN access / live GitHub claim.**
