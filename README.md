# BWD Project Compass — Public Demo Release (GitHub Pages)

**Status: PROPOSED RELEASE — NOT MERGED / NOT DEPLOYED.** This branch is made **directly from the existing public `main`** (README-only baseline), not from a stack of private-data research branches.

## Public/private boundary
- GitHub Pages: **fictional portfolio demonstration ONLY** (React + TypeScript + Vite + Tailwind). The banner **DEMO MODE** is always visible; sample statuses, counts, dates and next actions are NOT live facts.
- Private selected registry (11 GitHub repositories), local Windows paths, private host checks, encrypted snapshots and passphrases: **NOT IN THIS BRANCH / NOT IN PAGES**.
- There is no login or connection to the owner-local private Node server in the public demo. Do **not** attempt to publish private data through `VITE_*`, static JSON, assets or GitHub Actions.
- The public site intentionally uses `noindex` until the owner decides how demo discoverability should work.

## Fastest manual release (owner action REQUIRED)
1. Review this isolated Draft PR against `main`: it should contain only the fictional frontend, two public scanners, a public test, and two workflows. **Do not merge any private stacked PR (#1–#14) as a shortcut.**
2. Run `npm install`, `npm run check:public-source`, `npm test`, `npm run build`, `npm run check:public-dist` locally (or review PR CI). Inspect `dist/` and expected DEMO banners; verify 390×844/1024×768/desktop UI.
3. Review previous PUBLIC Git history and Draft PR examples with Windows local paths; decide whether limited-path risk is accepted or remediation is required. This independent decision is NOT bypassed by this public-source-only branch.
4. **Only after the above gates and an explicit owner go-ahead**, merge this public-only PR to `main` manually. (No automatic merge performed by the assistant.)
5. Repository **Settings → Pages → Build and deployment → Source: GitHub Actions** (set it if not yet configured).
6. Repository **Actions → Publish PUBLIC DEMO to GitHub Pages (manual approval only) → Run workflow → Branch: main → Run workflow**. The workflow contains **only `workflow_dispatch`**, so a mere merge does NOT trigger deployment. The job checks source, tests, builds, scans, and uploads **dist only**, then invokes the Pages deploy action.
7. Check the completed Action run. Then inspect `https://infobwd.github.io/project-compass/` on mobile, tablet and desktop. **Do not call the site LIVE until the actual Pages deployment and URL are verified.**

If Pages reports "not configured" or the manual workflow doesn't appear, ensure this branch was actually merged into default `main` and Pages Source is GitHub Actions. You can consult [GitHub's official Pages source guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

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
- No Merge or Deploy without the owner's explicit separate action.
- Never infer real project completion, current host acceptance or real PR numbers from fictional UI data.
- If any privacy scan fails, STOP; remove source leakage before considering release.
- Site is public, even if a later repository privacy setting changes. Private Registry stays on the owner's authorized local computer.
