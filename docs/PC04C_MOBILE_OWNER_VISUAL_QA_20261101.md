# PC-04C — Owner Private Local Browser Visual QA (sanitized) and mobile fix

**Date:** 2026-11-01 Asia/Bangkok.  
**Verdict:** owner-local **WORKPLAN SUMMARY VISUAL PASS** with **mobile responsive refinements pending exact-HEAD Windows retest**.

## Grounded owner evidence
- In the previously supplied terminal screenshot, PC-04C Node tests **134/134 passed**, Vite build PASS, public distribution scan PASS and five source-preflight checks PASS.
- In the latest privately shared screenshot, the owner-local private browser visibly shows the owner-managed workplan summary, explicitly distinguishes **recorded actions** from actual project backlog, and displays registered project cards and five-axis source status.
- The workplan had **no owner-recorded tasks** at the time of screenshot; outstanding owner decisions remain. This is not evidence that real software or school tasks are all complete.
- A narrow viewport shows the long Git-state identifier breaking awkwardly across rows, and the explanatory zero-actions warning occupying a narrow column inside the metrics grid.
- The screenshot includes actual project identifiers; **DO NOT COMMIT THE SCREENSHOT OR REAL IDENTIFIERS/COUNTS TO THE PUBLIC REPOSITORY**. This record deliberately omits them.

## Review / fix added to this same Draft branch
- At mobile viewports (up to 600px), status axes now use **one column**, retaining the full Git status identifier and readable confidence/deployment states. Summary metric tiles can still use two columns.
- Mobile action buttons take full available width for easier touch targeting.
- The explanatory **no recorded actions does not mean no real backlog** warning now appears in its own full-width paragraph outside the metric grid.
- Locked/logout state also clears the warning and owner summary details.
- Two added **fictional-only** regressions exercise the CSS/HTML warning placement and the meaning of an empty owner workplan; no real registry or host checks performed.

## Evidence gaps and owner actions
- **NOT VERIFIED on new mobile-fix HEAD:** full Node suite (previous observed count 134, plus 2 new synthetic tests = expected 136), exact Windows-tested Git SHA, Vite Build, public-dist scan, and mobile screenshot after fix.
- Real logged-out **HTTP 401 status** for both private workplan routes and terminal listener shutdown are not shown in this latest screenshot; do not silently mark these accepted.
- Browser local HTTP, extensions and local process threats remain a separate risk review; broader release and public private-data access remain BLOCKED.

## Windows manual QA (after code is fetched on D:)
1. Stop the current local private server with Ctrl+C; preserve private files and any uncommitted local Git edits.
2. Fetch and safely fast-forward this branch, then run `git rev-parse HEAD`, `npm run test`, `npm run build`, `npm run check:public-dist`, `node tools/private-ui/security-preflight.mjs --check`.
3. Restart **only** the private loopback viewer with `--ack-private-workplan-local`, entering existing passphrase in terminal, not in chat/browser.
4. Check 390px mobile width and desktop: long Git status is no longer awkwardly split, explanatory warning is full-width, the 2 buttons are touch-friendly and the page does not scroll horizontally.
5. After Logout, check `/api/workplan/summary` and `/api/workplan/actions` return **HTTP 401**, then Ctrl+C stops the port. No private screenshot, cookie, passphrase or workplan contents should be posted to GitHub or this public PR.

No new action has been created or completed by this UI improvement. No Merge / Deploy / public private-data upload.
