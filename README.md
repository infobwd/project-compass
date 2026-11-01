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


### PC-03D0/D1 — synthetic owner-local locked shell (DRAFT, no private data)
- [D0 privacy audit and D1 Windows acceptance runbook](docs/PC03D0_D1_AUDIT_AND_WINDOWS_RUNBOOK.md)
- `node tools/private-ui/locked-demo.mjs`: starts an **explicitly synthetic** locked page on IPv4 127.0.0.1 with a random local port. There is no real login, pairing or private data route. No snapshot is read.
- `node --test tests/pc03d1-locked-shell.test.mjs` plus `npm run test`, `npm run build`, `npm run check:public-dist` must pass on the exact new branch before Local Acceptance.
- The latest draft documents replace concrete Windows paths with placeholders. **Older public Git commit history still contains the prior examples**; historical exposure review is open and must not be treated as resolved by this change alone.
- D2 (browser authentication and use of encrypted private data) is **NOT AUTHORIZED, NOT IMPLEMENTED**.

Keep all PRs Draft. Do not merge, deploy, enable Pages, copy private snapshot into source, or expose any port on LAN.


### PC-03D2 — Synthetic-only local pairing pilot (Draft, no real data)
D1 locked synthetic shell remains available and unchanged. D2 introduces a **separate** opt-in local pairing pilot with fictional projects, in-memory session cookies, short-lived single-use terminal pairing code, expiry, logout, and explicit synthetic detail acknowledgement. It does NOT unlock private GitHub snapshots, load real project metadata, expose localhost to LAN or publish any web service.

- [D2 Security & Windows acceptance runbook](docs/PC03D2_SYNTHETIC_PAIRING_SECURITY_RUNBOOK.md)
- To test after checking out the D2 draft branch and passing tests:
  `node tools/private-ui/auth-synthetic.mjs`
- Use the URL and one-time code printed on your own local terminal; do not send codes, cookies or screenshots of the terminal code.
- Existing D0 historical public path metadata review remains OPEN; keep all PRs Draft and do not merge/deploy.


### PC-03D3A — synthetic five-axis evidence UI (Draft, read-only)
After D2 was administratively closed for synthetic Local Acceptance (with outstanding manual logout/SHA evidence exceptions), D3A introduces a **fictional-only** five-axis evidence view behind the existing one-time local pairing and detail-acknowledgement controls. See [D3A evidence contract and Windows acceptance runbook](docs/PC03D3A_SYNTHETIC_EVIDENCE_WINDOWS_RUNBOOK.md).

The axes are Development / Git / Deployment / Decision / Confidence. All source observations are intentionally null and the entire view is marked `FICTIONAL_FIXTURE`, not live project status. There is no encrypted Snapshot access, local private-file read, GitHub sync, remote access, publishing or production connection. D0 historical public path review and D2 evidence exceptions remain open. Any real-data browser connection needs a separate explicit security decision and human approval. **No Merge / No Deploy.**


### PC-03D3B-0 — offline evidence adapter and blocked real-data browser gate
D3A's five-axis fictional UI passed Local Acceptance by owner report. The next Draft branch adds [a strict **offline-only** evidence projection and security runbook](docs/PC03D3B0_OFFLINE_EVIDENCE_SECURITY_RUNBOOK.md), without opening real private data in any HTTP view. `tools/private-ui/offline-projection.mjs` uses the validated GitHub snapshot contract strictly in memory; `node tools/private-ui/security-preflight.mjs --check` examines source isolation and **always prints** `BLOCKED_FOR_REAL_PRIVATE_DATA` until separate owner security approval and evidence gates are satisfied. The D2/D0 exceptions remain open. **No Merge / Deploy / Production change**.


### PC-03D3B-1 — fictional-only hostile-origin security checks (Draft)
Following owner-observed PC-03D3B-0 **74/74 tests**, Build, Dist Scan and 5/5 source preflight PASS, the next branch adds six [synthetic-only adversarial security tests and an explicit D0/D3B gate register](docs/PC03D3B1_SYNTHETIC_SECURITY_GATES.md). The real private browser remains **BLOCKED**. No private Snapshot access, code merge, deploy, production changes or automatic historical Git rewrite is authorized.


### PC-03D3B-2 — synthetic browser boundary QA and private-data security decision (Draft)
The owner reported the PC-03D3B-1 fictional authentication/logout checks PASS. D3B-2 adds six [browser boundary regression tests and an explicit real-data risk register](docs/PC03D3B2_BROWSER_BOUNDARY_RISK_REGISTER.md) without changing the synthetic HTTP server. It tests no-store/CSP/CORS, guessed private endpoints, CSRF state isolation, token disclosure, absolute expiry and server shutdown **with fictional data only**. Existing exact-head Windows test logs are still required. The real browser gate must remain `BLOCKED_FOR_REAL_PRIVATE_DATA` pending a separate risk review and explicit approval. No Merge, no Deploy and no production/private data changes.


### PC-03D3B-3 — explicitly authorized OWNER-LOCAL real encrypted Snapshot pilot (DRAFT)
The owner granted permission **only for private local use on their Windows computer**. [PC-03D3B-3 runbook and risk statement](docs/PC03D3B3_REAL_LOCAL_PRIVATE_PILOT_RUNBOOK.md). A separate `tools/private-ui/private-local.mjs` terminal-unlocks the existing encrypted selected Snapshot from the user-configured outside-Git private directory and presents a minimal read-only, paired loopback dashboard. It cannot be launched from public GitHub Pages or the synthetic frontend; it neither fetches GitHub live nor verifies deployment. Private project names are gated by a second confirmation.

The actual runtime/test branch is **not yet Windows-accepted**; do not confuse owner permission to pilot with an independently passed security audit. Loopback HTTP and browser extensions/local malware remain explicit residual risks; previous public path-history review is still open. The generic/source preflight still reports `BLOCKED_FOR_REAL_PRIVATE_DATA` for unreviewed general/public release. No automatic Merge, Deploy, data copy into Git or external access.


### PC-03D3B-4 — owner-local UX clarity and security regression (Draft)
Following an owner screenshot showing **94/94 Node tests and Vite build PASS** on the prior real-local pilot, D3B-4 improves the private detail-button state/ARIA and Bangkok observation-time labels. Five **fictional-only** regression tests cover pairing exhaustion, expiry, logout and locked static responses. [Runbook and acceptance gates](docs/PC03D3B4_PRIVATE_LOCAL_UX_REGRESSION.md). The prior screenshot did not show the final public-dist scan result or actual Windows HEAD, so those are still unverified. No merge, deploy, LAN exposure or public private data.


### PC-04A — Private owner workplan (not in Pages)
The public demo was published through a manually dispatched GitHub Pages workflow on `main`. PC-04A begins the private operational layer: a validated, owner-maintained project/action/decision workplan with **no assumed completions**. See [PC-04A private workplan and D-drive runbook](docs/PC04A_PRIVATE_WORKPLAN_RUNBOOK.md).

- Pure `tools/private-plan/workplan-model.mjs` derives only explicit owner-reviewed statuses and evidence-gated actions from the selected private registry scope.
- `tools/private-plan/encrypted-workplan.mjs` stores an independently encrypted `owner-workplan.enc.json` **outside Git**, create-only, no plaintext outputs or silent overwrites.
- `tools/private-plan/workplan-cli.mjs --check|--init|--summary` is an explicit local PowerShell workflow; no connection to the public React UI or live GitHub host state.
- The first-run workplan has UNKNOWN development, NOT_VERIFIED deployment and NEEDS_REVIEW decisions for every selected repo; actual actions are never invented from Git HEAD/PR count.
- PC-04B (owner-editing), PC-04C (local Dashboard overlay), PC-04D (morning evidence brief) are separate future gates. **No Merge, Deploy, auto-status promotion or public disclosure.**


### PC-04B — Owner-confirmed next action entry + encrypted revision (Draft)
The owner confirmed PC-04A `--check → --init → --summary` succeeded for an **existing** 11-project private workplan on Windows; do **not** run `--init` again. [PC-04B private action/revision runbook](docs/PC04B_OWNER_ACTION_REVISION_RUNBOOK.md).

- `tools/private-plan/action-entry.mjs --add-action`: explicitly owner-entered `TODO` only, with selected project index, priority, responsible party, due date, next step and reason; **no write until user types CONFIRM**.
- `tools/private-plan/workplan-revision.mjs`: AES-GCM/scrypt encrypted backup before replacement, exclusive lock and SHA-256 stale file check, no silent overwrite. Real Windows file-system QA is required before acceptance.
- Six fictional-only regression tests. No automatic `DONE`, development acceptance, host verification, GitHub write or public Pages data.
- Local/private release only, on a stacked Draft PR separate from public `main`. No Merge or Deploy.


### PC-04C — Owner-private read-only workplan overlay (DRAFT)
After PC-04B dummy `--input-check` was reported PASS by the owner, this phase connects the **existing encrypted owner workplan** to the separately authorized local 127.0.0.1 viewer. The *old* `--ack-real-private-local` flag still reads Snapshot only. The *new* explicit `--ack-private-workplan-local` flag reads both the validated Snapshot and workplan from the owner's outside-Git private folder after a Terminal passphrase. No automatic edits.

- After pairing: only nonidentifying counts of owner-recorded open/overdue actions, pending decisions and owner reviews.
- After second detail authorization: minimized list of explicitly owner-recorded TODOs and other statuses, no local worktree/host links/raw evidence refs or encrypted file contents. Empty registry means **no task recorded**, not no real work pending.
- Eight fictional-only regression tests for unauthenticated 401, detail 403, logout 401, scope mismatch, hostile origin and no public React import.
- Full guide: [PC-04C owner-private Dashboard acceptance](docs/PC04C_PRIVATE_WORKPLAN_DASHBOARD_RUNBOOK.md).
- **Draft only; Windows exact-HEAD QA and any actual private TODO save remain separately unverified. No Merge, Deploy or private Pages content.**


### PC-04D — private evidence-first morning brief (Draft, no schedule)

- **PC-04D1 Thai Terminal QA:** Owner screenshot proved the manual concise report ran, but Thai glyphs were missing in PowerShell. A new **no-secret, no-private-data** `--thai-check` diagnoses terminal glyphs before any local private access; `--compact-ascii` provides an explicitly DISPLAY-gated English/ASCII-only fallback (Thai task text becomes `?`). See [Thai Windows terminal QA runbook](docs/PC04D1_WINDOWS_THAI_TERMINAL_QA_20261101.md). Exact Windows QA for these flags remains OPEN.
- **PC-04D1 readability update:** `--compact` shows a concise Thai owner-only report (still requires passphrase and typed `DISPLAY`), instead of repeating long five-axis technical flags for each project. `--summary` remains nonidentifying counts and `--details` remains the full private audit view. See PC-04D runbook for test instructions and privacy restrictions.

After owner-reported PC-04C responsive visual acceptance, PC-04D introduces a **manual terminal-only read-only morning brief** derived from the validated selected encrypted Git Snapshot and owner-encrypted workplan. [Private PC-04D runbook](docs/PC04D_PRIVATE_MORNING_BRIEF_RUNBOOK.md).

- `node tools/private-plan/morning-brief-cli.mjs --summary` prints only nonidentifying counts, observation timestamp, freshness and Bangkok local date.
- `--details` requires typing `DISPLAY` before showing private repository/task text **in the owner's terminal only**; never in GitHub Pages, Actions logs, browser, or automatically exported files.
- Review prompts are marked `NOT_VERIFIED`; only owner-entered TODOs are listed as tasks. Zero recorded tasks does not mean zero real backlog; Git default HEAD is not host deployment proof.
- Nine fictional-only tests cover data-source separation, Bangkok date boundaries, task priorities, owner evidence gating and no live GitHub/file writes.
- No automated 07:00 scheduler was installed. Any cloud/local morning automation requires a separate approved privacy design and cannot presume access to D: encrypted files. No Merge / Deploy.


### PC-04D2 — Thai Morning Brief in private local browser (Draft)
Owner prefers a readable Thai summary in the **127.0.0.1 paired local dashboard** rather than diagnosing Thai glyph rendering in PowerShell. This is the explicitly authorized **PRIVATE workplan** viewer only, not the public Pages site.

- `--ack-private-workplan-local` continues to load the validated encrypted selected Snapshot and owner workplan only on the user's trusted Windows machine, in memory.
- After pairing: `/api/morning/summary` returns nonidentifying owner-recorded TODO counts, Bangkok date and saved Git freshness; unpaired requests get HTTP 401.
- After the existing detail step-up: `/api/morning/details` returns minimized owner-entered tasks and separate clearly marked **unverified review prompts**; before step-up returns HTTP 403.
- Thai text is rendered in the local UTF-8 browser DOM; no exports, internet access, task mutation, owner approval promotion or external fonts. Logout revokes the morning routes.
- Snapshot-only mode does not load the morning brief; public GitHub Pages remains fictional DEMO data.
- Eight synthetic-only HTTP/security regression tests; owner Windows QA and actual Thai browser rendering still **NOT VERIFIED**.
- [PC-04D2 private web morning runbook](docs/PC04D2_PRIVATE_WEB_MORNING_QA_20261101.md). **No Merge / Deploy / 07:00 scheduling.**


### PC-04E — Evidence-backed PR/Issue review proposals (Draft)
After owner-reported PC-04D2 Local Acceptance, this phase shows **suggested reviews only** for PR/Issue numbers that are **fully enumerated in the saved encrypted selected Git Snapshot**. It is not a live GitHub feed and does **not** auto-create TODOs or assign priorities. [PC-04E owner-private runbook](docs/PC04E_EVIDENCE_REVIEW_CANDIDATES_RUNBOOK.md).

- Paired owner-local `/api/candidates/summary`: nonidentifying totals only; unpaired 401.
- After the existing detail step-up, `/api/candidates/details`: minimized PR #/Issue # review candidates grouped in collapsed project cards, with missing-evidence warnings; paired without step-up 403.
- Only verified, complete selected collections produce candidates. Incomplete collections generate **no fabricated references**, and the view never implies tasks are complete or ready for Merge/Deploy.
- Proposals are `NOT_ASSESSED`, `ownerConfirmed:false` and `ownerTasksAdded:0`. The separately encrypted owner workplan is not modified; an owner must inspect PR/Issue state and independently use the existing `--add-action` / `CONFIRM` flow.
- Adds 15 fictional-only regression tests. Windows exact-HEAD acceptance required; no public `src/` code, GitHub Pages data, autonomous snapshot refresh or 07:00 schedule change. No Merge / Deploy.


### PC-04F — Unsaved Owner Review Worksheet (Draft)
After the owner screenshot demonstrated PC-04E candidate grouping and Thai labels, the protected owner-local browser now lets the owner select **one already authorized PR/Issue candidate** for a temporary evidence checklist (current GitHub state, branch/test dependencies, Host proof, owner next-action decision). [PC-04F manual Windows runbook](docs/PC04F_OWNER_REVIEW_WORKSHEET_RUNBOOK.md).

- This worksheet appears only after existing Pairing + Detail authorization; no new backend write endpoint or browser storage.
- Checkboxes and selection are **ephemeral DOM-only**, cleared when closed/changed/logout; **not a signed owner review, not a saved task, not a DONE marker**.
- If a real next action is warranted, the owner must separately invoke the encrypted terminal `action-entry.mjs --add-action` and explicitly enter `CONFIRM` for backup+revision. No automatic conversion.
- Adds 5 fictional-only local security/UX tests. Windows exact-head acceptance pending; no `src/` changes, no merge/deploy or real data on public GitHub Pages.


### PC-04G — Staged encrypted Snapshot refresh with explicit owner activation (Draft)
The existing selected GitHub Snapshot is a saved observation, and the previous `sync.mjs --collect --selected` flow may directly replace the active encrypted file. **Do not rerun that older command against the owner's existing selected Snapshot.** [PC-04G private Windows runbook](docs/PC04G_SAFE_SNAPSHOT_REFRESH_RUNBOOK.md).

- New owner-local CLI: `tools/private-sync/staged-refresh-cli.mjs --stage` uses GitHub **read-only GET** to collect selected metadata, validates exact owner/workplan scope and complete PR/Issue enumeration, and stores only a **new AES-GCM encrypted stage** outside Git. Active Snapshot remains unchanged.
- `--inspect --stage-id ID` prints nonidentifying old/new counts and dates; no writes.
- `--activate --stage-id ID` requires a new passphrase prompt plus explicit exact **ACTIVATE** consent. After a fresh under-lock digest/scope check, it creates a unique encrypted **backup of the previous selected Snapshot** and replaces only the active encrypted Snapshot. The separately encrypted owner workplan is not changed.
- Eight fictional-only Node tests use disposable private temp folders and verify staging, nonwriting inspection, confirmation gate, stale/invalid data rejection, encrypted backup and preserved owner plan.
- No new public `src/` UI, private browser POST, GitHub writes, automatic refresh/07:00 job, Merge, Deploy or PUBLIC real-data upload. Windows exact-HEAD QA remains required before the owner's first real Stage/Activate.


### PC-04H — Complete saved PR/Issue review in private local pages (Draft)
After owner-reported PC-04G encrypted Snapshot activation and post-activation verification, the paired owner-private dashboard can page through **all complete verified numeric PR/Issue references in the saved Snapshot**, rather than showing only two per project. It remains **NOT GitHub Live** and is never deployed to the public Pages app. See [PC-04H private owner Windows QA](docs/PC04H_PRIVATE_CANDIDATE_PAGINATION_RUNBOOK.md).

- Existing pairing + explicit detail authorization required; new fixed-shape `GET /api/candidates/page/{index}/{PR|ISSUE}/{page}` returns **10 references maximum**, with no sensitive host/worktree notes or branch SHAs. Old Snapshot-only mode returns HTTP 404.
- Incomplete/invalid numbers **fail closed**; a project with a complete enumeration shows "ดู PR/Issue ทั้งหมดจาก Snapshot" only when the short preview omits entries. Prev/Next is numerical lookup, not priority or approval.
- An owner may select any displayed number for the existing **ephemeral, unsaved** PC-04F worksheet. No new file write, task creation, GitHub API call, 07:00 automatic refresh, Merge, Deploy or real private data in public Pages.
- Eight fictional-only tests. Exact Windows regression, Build/Public Scan, 401/403 and Logout QA **PENDING**; PC-04G local acceptance is OWNER-REPORTED, not independently host-verified.


### PC-04I — Saved GitHub Snapshot delta (Private Local Draft)
Following owner-reported PC-04H PASS, use **exact activated encrypted current Snapshot vs exact previous encrypted backup**, verified against the Stage SHA-256 digests and selected owner/workplan scope. Review PR/Issue numbers newly seen **OPEN** and numbers no longer seen **OPEN**, default-head changes where verified, and PR Draft/HEAD changes. These are **two stored GitHub observations, not live status or Merge/Deploy evidence**. [Full owner-local Windows QA and confidentiality runbook](docs/PC04I_PRIVATE_SNAPSHOT_DELTA_RUNBOOK.md).

- `node tools/private-sync/snapshot-delta-cli.mjs --summary --stage-id ID`: safe aggregate-only summary with hidden terminal passphrase, **no network/file write**; `--details` requires separately typing `DISPLAY` to show private names and numeric references locally.
- `node tools/private-ui/private-delta-local.mjs --ack-private-workplan-local --delta-stage-id ID`: new **explicitly opt-in** paired 127.0.0.1 browser view, with Thai delta aggregate section and per-project details **only after separate step-up authorization**. Existing private viewer without opt-in returns HTTP 404 for the new endpoints.
- Compare refuses absent/changed encrypted old backup, nonmatching current active Stage, changed selected configuration, wrong passphrase, incomplete/duplicate PR/Issue enumerations, or owner workplan scope mismatch. It does **not** refresh Snapshot, mark work complete, create TODO or write host/GitHub data.
- 16 synthetic-only regression tests added; Windows full tests/build/public scan/manual browser acceptance **PENDING**. Public `src/` and Pages unchanged; no Merge/Deploy or real private data in public Git.


### PC-04J — Owner-private review of saved OPEN-list changes (Draft)
Following **owner-reported PC-04I Local PASS**, the paired/step-up-only private Snapshot Delta page can show **all changed PR/Issue numbers**, rather than only the 12-number short preview, in bounded 10-item pages. Each number opens the existing **unsaved PC-04F evidence worksheet** for manual review. [PC-04J local Windows runbook](docs/PC04J_PRIVATE_DELTA_REVIEW_QUEUE_RUNBOOK.md).

- Four strictly descriptive categories per selected project: PR/Issue **NEW_OPEN** and **NO_LONGER_OPEN** *between two saved snapshots*. Neither category proves a PR was merged, an issue closed, work completed, or a host deployed. No automatic priority/TODO.
- `GET /api/delta/review/{index}/{PR|ISSUE}/{NEW_OPEN|NO_LONGER_OPEN}/{page}` is private `127.0.0.1` read-only, **401 before pairing**, **403 before explicit detail authorization**. Bad/out-of-range/POST routes **404**. Logout invalidates access. Model independently validates selected owner workplan and change lists before returning at most 10 saved numbers.
- Checklist checkboxes are **DOM-only**, not owner-confirmed changes, and have no POST, encrypted workplan save, clipboard export, GitHub query, or public UI linkage. To create a real task, owner independently rechecks GitHub and uses separate encrypted terminal `action-entry.mjs --add-action` with explicit `CONFIRM`.
- **12 synthetic-only new tests**; actual Windows full regression, Build/Public Dist, browser 401/403/Logout and mobile visual acceptance **PENDING**. Public Pages stays fictional DEMO. No Merge/Deploy or real private data in Git.


### PC-04K — Explicit owner-reviewed saved Delta → encrypted next action (Draft)
Building on **owner-reported PC-04J Local PASS**, the separate owner-private CLI can first do a **live GitHub GET-only** status check for an *exact validated* PR/Issue saved Delta reference, and optionally create a **new encrypted owner TODO** only after the human has independently checked GitHub and typed **REVIEWED**, entered all task/priority details, inspected the preview, and separately typed **CONFIRM**. [PC-04K safe local Windows runbook](docs/PC04K_OWNER_REVIEWED_DELTA_ACTION_RUNBOOK.md).

- `node tools/private-plan/delta-action-cli.mjs --review-only --stage-id ID --project-index N --kind PR|ISSUE --change NEW_OPEN|NO_LONGER_OPEN --number N`: validates exact selected saved Delta, private encrypted workplan, and reference identity, then calls **`gh api -X GET` only**. Read-only result is current GitHub reference state at query time; not Host/Production evidence, and does not write files.
- Optional `--add-action` invokes the **same** protected check but requires **REVIEWED** + explicit **CONFIRM** before the existing backed-up encrypted workplan revision writes exactly one `TODO` with owner-review evidence. No automatic priority, completion, merge or deployment state change.
- **9 fictional-only tests**, covering current GitHub response validation, exact scope matching, issue/PR distinction, cancellation gates, owner evidence and duplicate rejection. Windows complete test/build/public scan/owner review **PENDING**. The browser remains read-only, public `src/` unchanged, and no private information goes to GitHub Pages.


### PC-04L — Fictional encrypted TODO save and recovery regression (Draft)
After owner-observed PC-04K Read-only and both cancellation PASS gates, PC-04L tests the *existing* encrypted owner-workplan transaction against **fictional, disposable OS temp fixtures only**. Seven new Node cases cover successful single TODO + OWNER_REVIEW evidence + encrypted backup, cancellation/no confirmation, stale digest, duplicate refusal, incorrect Stage, and a temporary-only recovery rehearsal. No production restore feature or real TODO write is authorized. See [PC-04L test runbook](docs/PC04L_FICTIONAL_ENCRYPTED_TODO_RECOVERY_RUNBOOK.md). PC-04K Windows 238/238 is a previous owner-reported result; PC-04L full Windows suite (approximately 245 expected) remains **PENDING**, not claimed PASS. Draft only, no Merge/Deploy/public private-data export; separate human browser/security gates remain open.


### PC-04M — Human security acceptance and public Git-history review (Draft)
Following owner-confirmed exact-HEAD PC-04L Windows 245/245 PASS, the next release/security dependency is **not another synthetic test**. [PC-04M runbook](docs/PC04M_HUMAN_SECURITY_ACCEPTANCE_RUNBOOK.md) records source-observed controls and **five unresolved human gates**: (M1) historical public Git disclosure, (M2) owner Windows logout/refresh/HTTP 401, (M3) distinct real-private browser authorization, (M4) local hostile-process/DNS rebinding/CSRF/session/cache threat review, and (M5) authorized real-private UI acceptance. The source's `BLOCKED_FOR_REAL_PRIVATE_DATA` remains intentional. This is docs-only, not a security PASS or release approval; no Merge/Deploy, real task write or history rewrite.
