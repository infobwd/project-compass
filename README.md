# BWD Project Compass — Public Demo Release (GitHub Pages)

**Status (checked 2026-11-01): isolated PUBLIC DEMO PR #15 MERGED into `main` at `9944d7439f1eec958f58b8b676720252fdfeefb9`; GitHub Actions public CI SUCCESS and **manual Pages publish workflow SUCCESS** (run [#41277297509](https://github.com/infobwd/project-compass/actions/runs/41277297509), event `workflow_dispatch`). The actual live browser rendering/URLs were **not independently verified in this evidence check**, so do not infer visual acceptance. The public `main` does **not** include the separate stacked owner-private code/repositories.

## Public/private boundary
- GitHub Pages: **fictional portfolio demonstration ONLY** (React + TypeScript + Vite + Tailwind). The banner **DEMO MODE** is always visible; sample statuses, counts, dates and next actions are NOT live facts.
- Private selected registry (11 GitHub repositories), local Windows paths, private host checks, encrypted snapshots and passphrases: **NOT IN THIS BRANCH / NOT IN PAGES**.
- There is no login or connection to the owner-local private Node server in the public demo. Do **not** attempt to publish private data through `VITE_*`, static JSON, assets or GitHub Actions.
- The public site intentionally uses `noindex` until the owner decides how demo discoverability should work.

## Current release evidence and future owner-only procedure
- **Merged:** [isolated PUBLIC DEMO PR #15](https://github.com/infobwd/project-compass/pull/15) was merged to `main`. Verified commit `9944d743`.
- **CI:** Public Demo CI succeeded for that main commit (GitHub Actions run #41276893026).
- **Manual Pages publish:** [GitHub Actions run #41277297509](https://github.com/infobwd/project-compass/actions/runs/41277297509) concluded `success` on that same commit, triggered by `workflow_dispatch`. The workflow does **not** automatically deploy on `push` or PR Merge.
- **Browser verification:** independently opening and visually checking the actual deployed site is **still not verified by this repository audit**. Owner should inspect the [public DEMO](https://infobwd.github.io/project-compass/) on mobile, tablet and desktop, ensure fictional data and DEMO label only, no broken assets, and check accessibility; do not assert a browser PASS without evidence.
- **Historic public-path decision:** the owner accepted narrow residual historical Git path risk for the private work separately; it does not authorize publishing actual private records or historical secrets.
- **Do not merge private stacked PRs (#1–#14 and #16 onward) to public main.** Their local encryption/server source and historical paths are not the public demo and are subject to separate authorization.

For **future** public-only updates, create an isolated branch **directly from public main** and check the exact changed paths, `npm run check:public-source`, tests, build and dist scan, fictional UX, and owner approval. Only then should the owner manually merge the specific reviewed public PR. Publishing the update requires a **second separate owner action**: Repository Actions → `Publish PUBLIC DEMO to GitHub Pages (manual approval only)` → Run workflow on `main`. Verify completed workflow and actual website; follow the [PC-06 runbook](docs/PC06_PUBLIC_PAGES_RELEASE_CHECKLIST.md) for rollback.

## Local public demo QA (does not touch encrypted snapshots)
```powershell
npm install
npm run check:public-source
npm test
npm run build
npm run check:public-dist
npm run dev
```
Open the locally printed Vite URL. The configured Vite base is `/project-compass/` for a GitHub **project** Pages site. Tests and output scanners are public-only. Node 22 or a supported newer version recommended.

## Files included
- `src/` fictional portfolio UI and sample records
- `index.html`, `vite.config.ts`, `tsconfig.json`, `package.json`
- `tests/public-release.test.mjs`
- `tools/check-public-source.mjs` and `tools/check-public-dist.mjs`
- `.github/workflows/public-ci.yml`: CI on PR and main; **never deploys**
- `.github/workflows/pages-manual.yml`: **manual-only** Pages publisher, default main only
- `docs/PC06_PUBLIC_PAGES_RELEASE_CHECKLIST.md`: release/rollback checks

## Critical rules
- No new Merge or Deploy without explicit separate owner action after current evidence checks. The prior completed PR #15 merge and manual Pages action are historical verified facts, not future blanket approval.
- Never infer real project completion, current host acceptance or real PR numbers from fictional UI data.
- If any privacy scan fails, STOP; remove source leakage before considering release.
- Site is public, even if a later repository privacy setting changes. Private Registry stays on the owner's authorized local computer.
