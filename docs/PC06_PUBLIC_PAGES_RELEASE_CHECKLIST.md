# PC-06 — Public GitHub Pages fast-release readiness (manual deployment)

**Decision:** public **DEMO-only** MVP first; owner-private live evidence remains strictly outside Pages.  
**Latest branch scope:** new release branch created directly from the README-only `main`; it does not inherit stacked experimental commits containing private runtime designs.

## Evidence matrix before release
| Gate | Verification state now | Required proof |
| --- | --- | --- |
| Public repo exists, default branch main | VERIFIED via GitHub repository metadata | GitHub connector |
| Public frontend source from previously Windows-built PC-02 stack | SOURCE COPIED / NOT YET NEW-HEAD QA | Compare public files; build exact isolated release |
| Vite project base path `/project-compass/` | VERIFIED IN SOURCE | `vite.config.ts` |
| Public-only fixture names and demo ribbon | VERIFIED IN SOURCE, static scan pending execution | test + mobile visual |
| No private registry runtime copied | VERIFIED IN TREE / HUMAN REVIEW REQUIRED | explicit file list plus source scanner |
| Public Build / tests / source scan / output scan | **NOT YET VERIFIED ON THIS BRANCH** | local commands or completed PR CI |
| Old public Git history with user workspace-path examples | OPEN HUMAN RISK DECISION | risk acceptance / approved remediation |
| Pages configuration, deployment workflow and live site | **NOT VERIFIED** | Settings + manual workflow success + HTTP URL |
| Production acceptance | N/A for fictional demo | Do not confuse with private app |

## Why a direct-to-main public release branch
The original `main` contains only public README. Several earlier PRs include encrypted private local tooling, private-session endpoints and Windows-path examples in their **history**. Combining or merging those stacked PRs directly would complicate a rapid public Pages release. This PR instead carries the minimum fictional frontend, public-only scanners and explicit manual workflow, all created directly from `main`.

**This does not erase previously visible public branches/commit history** and does not by itself accept the older-path risk. It avoids *introducing private-runtime files or that stacked branch history to main*.

## Operator acceptance (Windows D: checkout)
```powershell
Set-Location '<LOCAL_PUBLIC_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/release/pc06-public-pages-demo-main-isolated-20261101
git rev-parse HEAD
npm install
npm run check:public-source
npm test
npm run build
npm run check:public-dist
npm run dev
```
Use `git switch release/pc06-public-pages-demo-main-isolated-20261101` instead if the branch exists locally. Preserve any untracked/modified files; **do not** use `reset --hard` or `git clean`. Open the Vite local URL and check Overview / Projects / Next Actions / Timeline / Daily Brief. All data must show DEMO and fictional names. Check 390×844, 1024×768, desktop, keyboard drawer, dark mode and missing search results. No client network requests for private API endpoints.

## Explicit owner-go release procedure
1. Review file diff and CI; if any scanner failed, STOP.
2. Review/remediate or formally accept public Git history's old local-path disclosure risk; do not perform force pushes automatically.
3. Owner separately approves and **manually merges the isolated public-only PR to main**. The assistant will not do it.
4. Open `https://github.com/infobwd/project-compass/settings/pages` and set **Source → GitHub Actions**.
5. Open `https://github.com/infobwd/project-compass/actions/workflows/pages-manual.yml`; press **Run workflow** with branch **main**, after approving public fictional content.
6. Confirm Actions BUILD+DEPLOY success and then visit `https://infobwd.github.io/project-compass/`. Do not assume it is live before verifying.
7. On the public site confirm assets load at `/project-compass/assets/...` and no Private Registry URLs/identities; inspect network and Console for 404, horizontal overflow and broken buttons.

**No automatic deploy:** The Pages workflow is `workflow_dispatch` ONLY, no `push`/scheduled trigger. Separate public-ci workflow is build/test only.

## Rollback
- Before owner merge: close the Draft PR; `main` unchanged.
- After owner merge but before manual workflow: Pages remains at its previously deployed version, if any.
- After owner deploy: use Actions to manually deploy a reviewed earlier safe commit/artifact (requires an approved workflow on that revision), or a reviewed public-only revert PR followed by another manual Pages workflow. Do not delete or force-rewrite shared Git branches automatically.
- If unexpected data exposure occurs: immediately disable further publishing, review exposure, and plan manual remediation with owner. An old artifact or Git commit may remain accessible; source deletion alone cannot guarantee revocation.

## Future PC-04 split
- Public Pages: informational fictional UX, and later only separately approved **explicitly public** content.
- Private D: registry: evidence-first actual GitHub snapshots, source timestamps, project roadmaps, decisions, next actions, owner-only host checks.
- Any future real authenticated private remote dashboard requires a **separate backend and security design**, not a Pages static client populated with private JSON.
