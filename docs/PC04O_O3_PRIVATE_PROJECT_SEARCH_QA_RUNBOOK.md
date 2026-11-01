# PC-04O O3 — Post-Step-Up Local Project Search (Synthetic QA Runbook)

**2026-11-01 Asia/Bangkok · PRIVATE experimental Draft · no Merge / Deploy / real data write.**

## Scope & intended safety

- Child of [PC-04O O1/O2 Draft PR #33](https://github.com/infobwd/project-compass/pull/33), **not** PUBLIC `main`.
- Small change in existing `tools/private-ui/private-local.mjs`: a Thai local search field for already authorized project cards.
- Filter element is **hidden until the owner pairs and separately approves** `POST /session/details` and the existing `GET /api/projects` returns the validated `PRIVATE_LOCAL_DETAILS` payload.
- After step-up, client-side search works only on that already authorized in-memory project array. No additional route, GitHub query, network request per keystroke, URL query, localStorage, sessionStorage, cookie reading, persistent history, priority inference or browser TODO writer.
- On `LOCKED`/Logout it clears the project array, input and cards and hides the filter. Zero matches displays **no matching project in loaded data**, not `DONE` or `no work remains`.
- Snapshot freshness, Git vs Development vs Deployment vs Owner review evidence, Workplan/Delta optional 404 `NOT_LOADED` semantics and the complete pre-existing pairing/Origin/CSRF/session gates are unchanged.
- Generic project identifiers are shown **only after step-up** in a locally opened user-trusted browser. Never copy raw names or screenshots to public GitHub.
- CSS input width is 100%, text wraps naturally; test mobile 390×844, tablet 1024×768 and desktop 1440×900 manually, including safe area and keyboard focus.

## Source changes / test coverage

1. `tools/private-ui/private-local.mjs` — hidden search input, no-extra-request local filtering, count message, zero-match neutral text, logout reset.
2. `tests/pc04o-o3-project-filter.test.mjs` — three synthetic-only tests:
   - locked static HTML/JS/CSS hides project IDs, status note, query and avoids client storage
   - paired-but-not-details API 403, authorized 200, logout 204 and old-cookie 401
   - synthetic DOM interaction confirms search is hidden before details, only after step-up filters two fictional cards, unmatched term is neutral, all memory/UI cleared on Logout.
3. README and this runbook only. No public `src/`, workflows, real encrypted files, Host or migrations.

## Evidence status

The earlier O1/O2 owner Windows screenshot reports **249 tests / 249 PASS / 0 FAIL**, Build PASS, Public Dist Scan PASS and structural preflight PASS. **That is the earlier Draft PR #33 result**, not this O3 SHA; exact O1/O2 tested SHA was not visible in the screenshot. The static real-private-browser preflight continues to show `BLOCKED_FOR_REAL_PRIVATE_DATA` for its separate human gates; it is not a failure of fictional tests.

GitHub read-back and the authored browser JavaScript syntax check are **source-level only**; **O3 actual Windows Node test/build/browser screenshots remain PENDING**. Expected suite count if all test files are discovered: **252** (249 prior + 3 new) — expectation, **not a pass claim**.

## Owner Windows steps — synthetic, no real private browser required

Before switching, `git status --short`. If dirty, preserve existing work; no `reset --hard` or `git clean`. Use existing trusted checkout, not a new private directory.

```powershell
Set-Location '<OWNER_EXISTING_PROJECT_COMPASS_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04o-o3-private-project-search-20261101
git branch --show-current
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the branch already exists locally, use `git switch feat/pc04o-o3-private-project-search-20261101` instead of `--track`. Compare exact SHA with this Draft PR's current HEAD before attributing acceptance. Synthetic tests should exit 0 with 0 failed cases.

For optional visual QA, use **only** the existing synthetic local server, not the real encrypted Snapshot. Pair, confirm no search before details, click details, filter fictional names, clear term, no match, then Logout; check controls at 390×844, 1024×768 and desktop. Any names before step-up, stale filter after Logout, API write route, network per keystroke or private fixture in public dist = **STOP/HOLD**.

## Promotion

O3 is an optional read-only local UX improvement, not a reason to merge stacked PRIVATE PRs into PUBLIC `main`. Owner manual review and explicit private architecture/release decision remain separate. No automatic Merge, Deploy, actual TODO, data export, live GitHub write, Snapshot refresh/activation or real-private acceptance.
