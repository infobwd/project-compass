# PC-04D2 — Thai Morning Brief in OWNER-PRIVATE Web Dashboard

**Status:** Implementation on a separate stacked Draft branch — exact Windows QA pending. **No Merge / Deploy.**

## Owner decision and observed evidence (2026-11-01)
The owner explicitly prefers **reading Thai Morning Brief on the private webpage** rather than resolving broken Thai glyph display in the Windows PowerShell terminal.

A recent PowerShell screenshot shows:
- `--thai-check` reached its synthetic-only output, but **Thai glyphs were missing/poorly shaped** in Terminal. Thus Thai terminal rendering is **NOT ACCEPTED**.
- `--compact` unlocked and generated a private morning brief after `DISPLAY`, but Thai glyphs rendered incorrectly.
- `--compact-ascii` reported `PC04D_PRIVATE_OPERATION_FAILED` after passphrase entry; the screenshot does not show the underlying cause. Do not infer file corruption or successful backup.
- The earlier local private browser screenshots showed Thai text legibly; the owner reports that local web UI is an acceptable presentation surface.
- Existing Snapshot is saved and **NOT LIVE**. Empty owner action plan is only `0 owner-entered TODO`, **NOT** a claim of no real project backlog.
- The screenshot includes private repository identifiers. **No screenshot, real project names, private workplan or real local paths have been committed into this public repo.**

## Architecture (private web ONLY)
This phase connects the existing **pure PC-04D evidence-first morning brief model** to the separately authorized local paired server in `tools/private-ui/private-local.mjs`, rather than exporting its plaintext report or putting real project data on GitHub Pages.

- The existing `--ack-private-workplan-local` flag is the **only** invocation that reads the validated selected Snapshot **and** the separately encrypted owner workplan from the configured outside-Git D: folder. It requires the owner's Terminal passphrase; no passphrase in URLs/browser or JavaScript storage.
- The older `--ack-real-private-local` Snapshot-only mode remains unchanged; morning routes respond HTTP **404** after pairing when no owner workplan was loaded.
- After existing one-time pairing, `GET /api/morning/summary` returns only Bangkok date, Snapshot timestamp/freshness and **nonidentifying counts** of actual owner-entered open/overdue tasks, owner decisions and review prompts. Without pairing → **401**.
- Only after the existing explicit `POST /session/details` step-up, `GET /api/morning/details` returns a **minimized** owner-entered task queue plus separately labeled `REVIEW_PROMPT_NOT_VERIFIED` records. Before step-up → **403**. No `localWorktree`, `hostUrl`, raw evidence refs, notes, encrypted files or credential material are included in that endpoint; lists are capped with a visible truncation warning.
- Thai strings are rendered in the **HTML UTF-8 document** using `document.createElement` / `textContent` (no `innerHTML`, localStorage, sessionStorage, telemetry or external font/network calls).
- Existing strict Host, Origin, Sec-Fetch-Site, CSP, no-store, HttpOnly cookie and expiry checks still apply; Logout revokes both morning endpoints → **401**.
- All data stays in the running Node process on **127.0.0.1** and is discarded on logout / server close; no browser plaintext export or public Pages sync. This does not eliminate hostile same-machine process, browser extension or local environment risks.
- No mutation to the owner workplan, and no automatic creation of TODO, DONE or Host approval.

## Owner Windows acceptance — exact Branch
First stop the previous local Node server with **Ctrl+C**. Safeguard any untracked changes; never `git reset --hard` or `git clean`:

```powershell
Set-Location '<LOCAL_COMPASS_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04d2-private-web-morning-brief-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

If the new branch is already present locally, use `git switch feat/pc04d2-private-web-morning-brief-20261101` instead. The new phase adds **8 fictional-only HTTP/security tests**. The preceding PC-04D1 had an **unverified** predicted test count of ~153; the expected total is **~161, only a forecast**. Require the actual `fail 0`, Build PASS and Public Dist PASS. A generic preflight `BLOCKED_FOR_REAL_PRIVATE_DATA` remains the correct **general PUBLIC/broader real-data gate**, not a release authorization.

After tests pass, on the trusted owner's Windows machine, start the existing local-only private viewer:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<PRIVATE_DIRECTORY_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-private-workplan-local
```

Enter the **existing** encrypted Snapshot/workplan passphrase **only in the Terminal**. Open the printed exact `http://127.0.0.1:PORT/` in a browser **on the same PC**, then enter its one-time pairing code in that browser. Do not attempt LAN/public tunnel/remote mobile phone access; `127.0.0.1` refers only to the local machine. Test mobile width using Developer Tools responsive mode on this trusted PC.

## Manual browser checklist
- [ ] Before pairing, `GET /api/morning/summary` and `GET /api/morning/details` return **401**.
- [ ] After pairing, see section **“สรุปงานวันนี้ · Morning Brief”** with readable Thai, Bangkok report date and Snapshot `NOT LIVE` warning.
- [ ] Counts match **owner-recorded** data. Zero recorded TODO is labeled appropriately; no real project completion is inferred.
- [ ] Before tapping **“ยืนยันและแสดงรายโครงการ”**, morning details API returns **403**.
- [ ] After tapping that button, owner-entered TODO (if any) and the **“สิ่งที่ควรตรวจสอบ — ยังไม่ใช่งานที่รับรองแล้ว”** section appear in Thai; review prompts are not silently added to the owner TODO list.
- [ ] Compare 390px responsive mode and desktop; no horizontal overflow, Thai glyph clipping or unusable scroll-to-bottom.
- [ ] Network responses never contain workstation paths, host URLs, raw evidence refs, private notes, passphrase or encrypted snapshot; no private data in `/app.js` before pairing.
- [ ] Logout and reload must revoke the session; both morning routes return **401**. Ctrl+C stops the local listener.
- [ ] Real GitHub Pages `https://infobwd.github.io/project-compass/` remains **fictional DEMO ONLY**; this PR must not change its deployed assets or data source.

**Do not rerun** PC-04A `--init` — owner's encrypted file already exists. Add an actual TODO only with PC-04B `--add-action` and explicit `CONFIRM` in a separate session if desired; then restart the read-only local server to load the revised private plan.

## Remaining evidence gaps
- Exact new PC-04D2 Windows tested SHA / full Node results / actual Thai web UI screenshot and security boundary checks are **NOT VERIFIED**.
- Older PUBLIC experimental commit path exposure requires a separate human privacy decision; this stacked PR must not be automatically merged into PUBLIC `main`.
- Live GitHub status, independent host deployment status, and other project completion claims remain NOT VERIFIED until newly checked.
- A scheduled 07:00 local/private or cloud automation **has not been added**; safe scheduling needs separate approval and cannot assume cloud access to encrypted D: data.

**No Merge / Deploy / public private registry / new automation.**
