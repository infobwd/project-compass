# PC-04D2 — Owner Morning Brief Web Visual QA and concise review list

**Date:** 2026-11-01 (Asia/Bangkok). **Evidence source:** owner-supplied screenshot of the paired owner-private browser. **Privacy:** screenshot itself not attached to this PUBLIC GitHub repository.

## What is verified from the screenshot
- Thai **Morning Brief** text is legible in the local paired browser. This resolves the owner's practical presentation preference without requiring Thai glyph support in PowerShell.
- Morning summary shows **zero owner-recorded TODOs** and **zero overdue recorded TODOs**. This only means the owner's encrypted workplan had no registered actions at the observed moment; it **does not prove any actual project is complete**.
- Owner-review and evidence-review queues are displayed for the full selected registry scope, with explicit NOT VERIFIED warnings. Project identifiers from the screenshot are not repeated here.
- The screenshot shows the detailed project-review list and retained Git snapshot date/freshness; it is NOT evidence of a real-time GitHub or host query.
- **Visual Thai rendering PASS** for the owner-local web display. **Full PC-04D2 acceptance remains pending**: exact Windows Test/Build/Public Scan, unauthenticated HTTP 401, pre-step-up 403, post-Logout 401, listener shutdown and independent security review are not visible in this screenshot.

## Owner UX problem observed
- Owner workplan and Morning Brief repeat the same owner-entered TODO list, especially the empty-list message.
- Many reviews show the same five missing evidence labels in full, creating a long scroll and hiding the immediate next decision.

## Small UI-only refinement on this Draft branch
- On the owner-private page, if the Morning Brief is present it is the sole display of the actual owner-entered TODO list. The Workplan aggregate summary remains visible; Snapshot-only / older Workplan fallback remains intact.
- When there are **zero** recorded TODOs, a single short note is shown in the Morning detail section instead of duplicating another full task heading.
- Under **“สิ่งที่ควรตรวจสอบ — ยังไม่ใช่งานที่รับรองแล้ว”**, each project becomes a native **collapsed `<details>` / `<summary>`** control, showing only repository identifier and count of missing evidence points by default. Touch/keyboard expands the Thai checklist for that project. This changes only the UI presentation, not the authoritative evidence or owner status.
- Adds CSS for accessible focus indication and minimum 48px touch targets. All repository/task strings remain safely inserted with `textContent`. No raw HTML from private data.
- Two synthetic-only regressions verify nonduplicate Morning TODO rendering, optional legacy fallback, native disclosure and no pre-pairing private content. Existing API authorization/response fields are unchanged.

## Windows owner action
After confirming the local worktree is clean, fetch/fast-forward `feat/pc04d2-private-web-morning-brief-20261101`, record HEAD, and rerun `npm run test`, `npm run build`, `npm run check:public-dist`, and `node tools/private-ui/security-preflight.mjs --check`. The immediately prior screenshot showed **160 pass / 1 fail**, but that stale CLI source-inspection test was updated on this branch; it has **not yet been proven as 161/161 on Windows**. Two new synthetic UI tests raise the theoretical total to **163**, not a confirmed result.

Restart the trusted local owner-private browser with `--ack-private-workplan-local` only after tests pass. Check Thai rendering, hidden disclosure detail by default, tap/keyboard to expand each project, single TODO detail list, mobile width 390px and desktop, logout re-lock/HTTP 401. Do NOT paste real project identifiers, cookies or passwords into PUBLIC GitHub.

**No Merge / Deploy, no GitHub Pages real data, no owner task creation, no change to host acceptance.**
