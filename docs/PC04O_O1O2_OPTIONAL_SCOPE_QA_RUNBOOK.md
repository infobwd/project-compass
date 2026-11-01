# PC-04O O1–O2 — Optional Private Data Scope UX and Synthetic QA

**2026-11-01 Asia/Bangkok | Draft only, child of PC-04O design PR #32.**
**No real private files read, no real TODO, no Merge, no Deploy.**

## What was actually changed

1. `tools/private-ui/private-local.mjs` now uses the existing same-origin read-only fetch paths to distinguish `404` for absent **optional** owner Workplan and Saved Snapshot Delta data from a real error. Only after a paired session can the UI show a neutral **NOT_LOADED** explanation:
   - `Workplan`: this browser session did not load the encrypted owner workplan; do **not** infer zero tasks.
   - `Snapshot Delta`: no activated saved comparison loaded; do **not** infer no changes.
2. Optional cases are not new public requests or an additional login. The existing `GET /api/summary`, `POST /session/details`, `GET /api/projects` and `POST /session/logout` contract and server authorization stay unchanged. New status metadata on an already thrown browser fetch error is only used to recognize optional HTTP **404**; other errors do **not** become NOT_LOADED.
3. The indicator is inside the hidden private panel, never embedded with project names in static HTML. It clears on Logout/LOCKED. HTML/DOM data is assigned via textContent, never innerHTML, browser storage or URL query parameters.
4. Original visuals are maintained; a subtle neutral scope note is added with existing CSS and no remote font/assets/dependency.
5. `tests/pc04o-private-scope-ux.test.mjs` contains **four fictional-only** Node cases:
   - locked/no leaked fixture identifiers, note placeholder, script parser/DOM-safety, mobile CSS
   - 401 before pairing → 200 summary and 403 project details → 404 optional missing data
   - 403 before details → 200 after opt-in → Logout 204 → old-cookie API 401
   - explicitly provided empty fictional Workplan → optional workplan summary 200, no browser TODO-writer endpoints
6. Only synthetic in-memory projections are used by the new tests. Existing encrypted Workplan/Snapshot on the owner's Windows device are not accessed or changed by these GitHub edits.

## Evidence classification at authorship

- Connected GitHub read-back verifies the authored source and four new tests exist and the browser JS template passes a **syntax-only compile** (not live browser execution).
- **Previous PC-04L owner Windows 245/245 PASS applies to a different older HEAD.**
- **PC-04O Windows Node test suite, Vite build, public-dist scan and visual browser test are PENDING.** Full count predicted **249 tests** if the previous 245 remain and all new four are discovered, not confirmed.
- Prior M5 actual-read-only acceptance remains owner-observed/owner-reported with a separate paired-before-details HTTP 403 evidence gap; this code work does not retroactively close it.

## Owner Windows exact-HEAD QA — synthetic only

Save any local edits before switching. Inspect `git status --short`, then `git fetch origin --prune`. Do not `reset --hard`, `git clean`, Merge, Deploy or open the real encrypted Snapshot for this candidate.

```powershell
Set-Location '<OWNER_EXISTING_LOCAL_PROJECT_COMPASS_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04o-o1o2-private-snapshot-scope-ux-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If branch is already local, use `git switch feat/pc04o-o1o2-private-snapshot-scope-ux-20261101` instead of `--track`. Record `fail 0`, test count, exact SHA and any status-only failures. Static `BLOCKED_FOR_REAL_PRIVATE_DATA` remains a separate deliberate human acceptance gate.

## UX acceptance after tests, without owner data

Open only the existing fictional synthetic server / synthetic browser if interactive visuals are desired. Verify:
- `LOCKED` hides any private count, repository name, Workplan labels and note.
- After pairing, a Snapshot-only session shows `NOT_LOADED: Workplan, Snapshot Delta` and does **not** say 0 tasks or DONE.
- An explicitly Workplan-enabled fictional server does not label Workplan as not loaded; Saved Delta can still be not loaded.
- Same 401 → 403 → 200 → Logout 204 → 401 authorization gate, without optional note persistence after Logout.
- 390×844, 1024×768 and desktop show no horizontal scroll or bottom-clipped controls; keyboard Tab/Enter and focus indicators work.

**Stop** if an optional 404 is shown as `DONE`, any project name is displayed pre-step-up, a protected route returns 200 after logout, any source/build scan finds private data, or the test suite fails.

## Next work package (NOT yet implemented)

O3: after actual tests and owner synthetic visual feedback, add an authorized-after-step-up local-only project filter and refined priority/evidence hierarchy with its own regression; do not add browser writes or automatic priority. O4: separate owner choice and exact changed-head read-only actual Snapshot acceptance if needed.

## Promotion decision

This stacked private PR must not target `main`. The isolated public DEMO and its README-only PR #31 are a **different release lane**. No auto Merge/Deploy, owner TODO, real private data export, or release certification.
