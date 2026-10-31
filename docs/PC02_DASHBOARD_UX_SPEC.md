# PC-02 — Mobile-first Dashboard UX Specification

Status: **DESIGN PROPOSAL ONLY**. No UI or real-data connection is implemented.

## Identity
Name: **BWD Project Compass — One Dashboard, All Projects, Clear Next Steps**.
Visual direction: minimal, readable, blue/navy + warm yellow accent. Google Sans for headings with lawful available font fallback; Kanit for Thai text. No font files should be redistributed without license review.

## Information architecture
1. **Overview:** counts with evidence scope, recent changes, blocked/deployment/approval queues, and "Today — What Should I Do Next?" (3–5 ranked items including reason and evidence age).
2. **Projects:** responsive cards/list, text search, status/priority/type filters, private-only indicators where authenticated.
3. **Project detail:** phase, latest accepted milestone, proof link, roadmap pointer, planned next step, branch/Git/host axes, dependencies, local workspace (authenticated only), chat/handoff links.
4. **My Next Actions:** human-only work (FTP, device/host checks, approval) versus tools-permitted safe read/research actions.
5. **Timeline & Decisions:** immutable milestone, verification and approval entries with timestamps and source links.
6. **Daily Brief:** changes since previous snapshot, stale claims, urgent blockers and 07:00 ICT brief preview; scheduler not set by creating this document.

## Layout
- Mobile 390×844: top project context; summary; prioritized Today section above secondary charts; full-width cards; 44px+ targets; bottom safe-area padding; persistent primary navigation.
- Tablet 1024×768: 2-column metrics, list/detail side-by-side when adequate; landscape/split view overflow checks.
- Desktop: collapsible left navigation; 3–4 summary columns; searchable table plus expandable evidence view.
- Loading, stale, permission-denied, and unknown states explicitly differentiated.
- Never show confidence as a disguised test pass. Date/time is Asia/Bangkok with unambiguous timezone label.

## Interaction contracts
- User can open the source evidence link and view its observation time.
- Priority explanation uses impact, urgency, blocker removal, approval requirements and staleness; not raw commit recency.
- User can copy a **Handoff Summary / Resume Prompt**, carrying confirmed SHA, current phase, unresolved gates, and a no-merge/no-deploy safety line.
- Access-denied private cards must not leak names, counts or titles through tooltips, search autocomplete, static HTML or network payloads.
- No destructive buttons until an audited authorization model exists. Work proposals are not commands.

## Prototype fixtures
Use invented project names and sample PR numbers only; no actual internal registry, paths, school records, health information or customer data on a public Preview. A sample fixture is not a verified task status.
