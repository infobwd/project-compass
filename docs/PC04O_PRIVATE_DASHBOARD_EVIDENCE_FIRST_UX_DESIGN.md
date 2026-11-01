# PC-04O — Private Dashboard Evidence-First UX Design Spec

**2026-11-01 · DESIGN ONLY · stacked on PC-04N Draft PR #30 · NO UI source changes, real data, Merge, Deploy or automatic TODO.**

## 1. Goal and explicitly excluded outcomes

Enable the owner to answer, on their trusted Windows device: **Which projects are in scope? What is the last evidence observed? What owner-recorded next action exists? What is blocked/unverified? What should I personally review next?** Do not turn an open GitHub PR, a successful build, or a saved Snapshot into a claim that work is finished or deployed.

This is an improvement to the **existing Private localhost browser** and **existing encrypted Snapshot/Workplan** workflow. No new cloud backend, additional external provider, remote database, public JSON export, GitHub write, automatic task creation, auto-priority, background sync, Merge, Deploy or student data. Private names and worktree paths never enter Pages.

## 2. Verified baseline and reuse-first architecture

Inspected current `tools/private-ui/private-local.mjs` on the private design ancestry:

- The existing one-time pairing / real local server binds **127.0.0.1**, renders a locked shell, returns `/api/summary` after pairing, and gates `/api/projects` behind a separate `POST /session/details` approval.
- The browser already supports optional sections: Workplan, Morning Brief, PR/Issue candidates and Saved Delta. It uses a read-only API. A successful `GET /api/summary` alone never proves Host/Production.
- **Snapshot-only mode** (`--ack-real-private-local`) deliberately does not load an owner Workplan or Snapshot Delta: optional `/api/workplan/summary`, `/api/morning/summary`, `/api/candidates/summary`, `/api/delta/summary` return 404 **after** authentication. This is an intentional **NOT_LOADED** state, not application failure.
- Workplan model in `tools/private-plan/workplan-model.mjs` already represents `development`, `deployment`, `decision`, `actions`, `blockers`, `evidence` and `lastReviewedAt`, and distinguishes `DONE_BY_OWNER` from ordinary TODO.
- Existing `/api/summary`, `/api/projects` and optional owner-summary endpoints should be reused with their existing provenanced contract. Use existing server authorization and redacted projection. **Never silently enable the richer Workplan/Delta mode** during Snapshot-only use.
- Synthetic fixture security/UX tests already cover the locked/pairing/logout/step-up boundaries; the owner reported 245/245 on the previous PC-04L HEAD. This number is historical evidence, **not a test result for PC-04O**.

## 3. Proposed information architecture

### Screen 0 — LOCKED, before pairing
- No project identifiers, private counts or last-retrieved actual evidence in HTML/JS.
- Pairing input in trusted browser from terminal one-time code; no password box or storage of code.
- Plain explanation of mode, local-only, source limits, session expiry and Logout.
- Keyboard accessible; 44px minimum tap targets; Thai text wraps naturally.

### Screen 1 — Paired summary, BEFORE detail step-up
- Only existing authenticated aggregate counts: selected repositories, HEAD coverage, open PRs/issues, Snapshot observation time and **evidence freshness**.
- Clear status texts: `SAVED SNAPSHOT · NOT LIVE`, `HOST NOT_VERIFIED`, `OWNER ACCEPTANCE NOT_VERIFIED`.
- `Show project details` is a distinct owner intent gate. Do **not** reveal names in a dropdown, `aria-label`, DOM attributes or analytics before permission.
- Summary zero counts are **evidence counts**, not proof of no unfinished work.

### Screen 2 — Explicitly approved project list
- After `POST /session/details` success only, display user-local project names. List by saved selection order, **not** "highest risk" unless owner-authored priority is present.
- Each project row: **Development**, **Git snapshot**, **Deployment**, **Owner decision**, **Confidence** (if the response carries it), last Snapshot observation and missing-evidence banner.
- Never show `DONE` or green verification solely because a PR is closed, an open count is zero, HEAD is observed or tests pass.
- Read-only local filter/search by name AFTER step-up; no persistence, export, telemetry or URL query string. Clear UI and in-memory filter on logout.
- Distinguish **"No owner task recorded"** from **"No work remaining"**.

### Screen 3 — Optional Workplan mode (only when owner explicitly launches a Workplan-enabled local CLI)
- Separate owner-recorded TODO/IN_PROGRESS/BLOCKED/DONE_BY_OWNER counts and personal next actions; keep Git PR/Issue "review candidates" in a **different section**, never auto-convert them to TODOs.
- Missing Workplan is a neutral state: `NOT LOADED (Snapshot-only)`, not an error or implicit zero.
- Display P0–P3 ONLY where owner stored priority; no invented deadlines, assignees or statuses. Show source provenance and last owner-review time where available.
- For a task flagged completed by owner, show owner-review evidence type only from existing validated model (no inferred acceptance).

### Screen 4 — Optional Saved Delta mode (separately authorized)
- Only compare two already-validated saved Snapshot intervals and show `NEW_OPEN` / `NO_LONGER_OPEN` without claiming Merge, Deploy or DONE.
- Review workflow is read-only; `--add-action` stays a separate trusted-terminal REVIEWED + CONFIRM flow, **not a browser action**.
- If no valid activated Stage or optional Delta not loaded, show `NOT LOADED` and a human-run next-step suggestion, never attempt refresh/activate.

## 4. Visual design and responsiveness

Reuse existing BWD navy/blue and yellow accents with clear neutral statuses (not decorative success), Thai legibility, and the current simple CSS/DOM implementation first. No Tailwind migration is required for the private local pilot. Avoid new dependencies or Google Fonts network requests. Current source has one embedded HTML/CSS/JS string inside `private-local.mjs`; make staged, testable changes rather than a wholesale rewrite.

| Viewport | Acceptance |
|---|---|
| Mobile 390×844 | Single-column details; 44px touch controls; no horizontal overflow or controls touching the bottom safe area; predictable scroll position; Logout visible and reachable |
| Tablet 1024×768 | Two-column project cards if content fits, otherwise natural stacking; never truncate privacy or freshness labels |
| Desktop 1440×900 | Comfortable max-width, stable overview + project cards, keyboard access, visible information hierarchy |
| All | Thai wrapping, screen-reader labels, high contrast, `focus-visible`, meaningful empty/loading/error states, readable timestamps in Asia/Bangkok |

Prefer an evidence status line under each status rather than a mass of colorful badges. On phones, put the **main owner next action** near the top only if an owner-recorded action exists; otherwise show a neutral `Review needed / no owner action recorded`.

## 5. Data provenance mapping (strict)

| Display | Existing source | Allowed inference | Forbidden inference |
|---|---|---|---|
| Scope, open PR count, HEAD seen | Encrypted saved Snapshot `/api/summary` | Observed in the saved interval | GitHub currently open/merged, Host passed |
| Per-project Git | Post-step-up `/api/projects` | Observed HEAD and coverage at Snapshot time | Current deployment |
| Development/Decision/Deployment | Explicitly selected Workplan and validated evidence projection | Owner-recorded/verified with its evidence | Automatically DONE or APPROVED |
| TODO/priority/due date | Owner-created Workplan action | Display only recorded field | AI-added priority/task/deadline |
| Candidate review | Saved Snapshot or Delta | Needs human verification | New TODO or a confirmed merge |
| Optional API 404 | No Workplan/Delta in Snapshot-only mode | `NOT_LOADED` | Data loss or all tasks finished |

## 6. Proposed work packages and review gates

**O0 — This Design Spec:** owner reviews proposed information hierarchy and mode boundaries; no code.

**O1 — Synthetic visual fixture + baseline tests:** add no-real-data tests for locked state, paired summary before step-up, optional endpoints missing, evidence provenance labels, no empty-workplan-as-DONE, and clean logout/refresh. Collect screenshots at 390×844, 1024×768, 1440×900 using fictional fixtures only.

**O2 — Small private-only UI implementation in isolated branch:** preserve the HTTP contract, permissions, methods, security headers and temporary session semantics. Add progressive disclosure and clearer empty/state labels; avoid touching public `src/` or build chain. No browser write endpoints.

**O3 — Regression and browser QA:** run full Node suite on exact changed SHA and source/preflight checks, then owner Windows fictional local browser acceptance (401/403/200/204/401 + Refresh locked); test keyboard, scrolling and mobile safe areas.

**O4 — Optional real Snapshot-only read-only acceptance:** requires separate owner awareness of changed code / risk; verify only redacted statuses and file digests. No Workplan/Delta auto-load, no real write; source-level M4 and owner M5 historical state are not silently promoted to PASS.

**O5 — Decision for continued private-only distribution:** private branch/owner local setup only. Public release and manual Pages promotion remain a separate completely isolated lane.

## 7. STOP / rollback and non-goals

- If a change exposes project names pre-step-up, creates a browser write route, adds a public `VITE_*` environment bridge, caches private data, changes Host/Origin/cookie policies, or alters encrypted file bytes without explicit approval, **STOP** and restore the prior safe private branch (no `reset --hard` or `git clean`).
- Any code implementation requires a new exact-head QA report; prior 245/245 result cannot be carried forward as new-head QA.
- Historic public-path M1 risk accepted by owner but not erased; M2 synthetic owner-observed PASS; M3 narrow Snapshot-only local browser authorized; M4 conditional risk accepted; M5 owner local steps observed/reported but retains missing exact real-private 403/integrity evidence per PC-04N. No inference of overall private production readiness.
- Private-only work remains stacked separate from **PUBLIC main**. Do not Merge or Deploy automatically; actual owner-reviewed merge/release needs another explicit, scope-specific decision.

**Deliverable:** Design Spec only in a Draft PR. No private data, source code refactor, browser launch or online deployment in this phase.
