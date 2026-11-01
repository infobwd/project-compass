# PC-04H — Owner-only Complete PR/Issue Pagination (Read-only)

**Date:** 2026-11-01, Asia/Bangkok. **State:** Implementation on a stacked isolated Draft branch; full Windows acceptance pending. No GitHub Merge, Deploy, owner TODO mutation, background refresh or public real-data publication.

## Evidence and purpose
The owner reported **PC-04G local PASS** following manual encrypted Snapshot Stage/Inspect/Activate, checking a matching old-encrypted-Snapshot backup, unchanged owner encrypted workplan, a successful new active-Snapshot preflight and reopening the paired local private browser. This is **OWNER-REPORTED local evidence**, not independently reproduced Windows hashes or host status.

The newly active saved GitHub Snapshot is a historical observation, **not a live GitHub query**. The PC-04E candidate list intentionally displays only **two PR and two Issue IDs per project**, plus omitted counts. With many open PRs, older relevant work would be hard to select. PC-04H enables the owner to inspect **all verified saved PR/Issue numbers** in bounded 10-item pages, then open the existing unsaved PC-04F worksheet for any of them.

## Security and evidence requirements
- No additional collection/refresh: uses the **already decrypted and selected active Snapshot in the trusted 127.0.0.1 PRIVATE process**, and the independently encrypted owner workplan strictly for project scope validation. No new CLI or write endpoint.
- New pure `buildPrivateCandidatePage` re-validates complete numeric reference enumeration, count matching, uniqueness and PR draft types for the requested project. If an enumeration is incomplete, it returns an explicit missing-source status and **no invented IDs**.
- API paths: `GET /api/candidates/page/{selected-index}/{PR|ISSUE}/{zero-based-page}`. Routing allows only the validated numeric 0–99 index/page shapes; model checks actual selected scope, page 0–49 and enumeration completeness.
- Unpaired -> HTTP **401**; paired but before existing explicit detail authorization -> **403**; selected Snapshot-only legacy mode -> **404**. POST -> **404**. Cross-origin, unsupported Host and `?query` requests are rejected by existing shared private HTTP checks.
- After step-up, only the selected project's validated list with at most **10 references** per request is returned, showing PR/Issue number and PR Draft flag, saved `observedAt`, total/pages, source `SAVED_ENCRYPTED_GITHUB_SNAPSHOT_NOT_LIVE`. Do not return branch SHA, private host path, worktree, evidence IDs, owner notes, or encrypted bytes.
- The UI keeps the original two-item collapsed preview and adds **“ดู PR ทั้งหมดจาก Snapshot”** / **“ดู Issue ทั้งหมดจาก Snapshot”** only if omitted items exist. The paginated list supports **ก่อนหน้า / หน้าถัดไป** and the existing **“เลือกตรวจรายการนี้”** temporary checklist for any displayed reference.
- All strings inserted through DOM `textContent`, never `innerHTML`, no clipboard export, no localStorage, no remote API calls, no new public `src/` import. The browser checks whether the paginated panel still exists and is visible after an asynchronous response to avoid showing old data after logout or a card close.
- Numeric sorting is **descending for lookup only**, never a recommendation rank or verified latest PR. Each row remains `NOT_ASSESSED`, `ownerConfirmed: false`, `ownerTaskCreated: false`.
- The separately encrypted owner TODO plan is unchanged. To record a real next action, the owner must independently re-check that PR/Issue on GitHub, determine its current state/related tests/host evidence, and use the existing local encrypted terminal `action-entry.mjs --add-action` with explicit `CONFIRM`. No browser data write.
- The PRIVATE Dashboard may show the refreshed stored count; **Production/Host/Acceptance remain NOT VERIFIED**.

## Owner Windows local acceptance
Stop the old local private viewer (Ctrl+C). In the existing D: Windows worktree, review uncommitted changes (never reset/clean) and safely fetch/switch this Draft branch.

```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE_ON_D>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc04h-private-candidate-pagination-20261101
git rev-parse HEAD

npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```

Use `git switch feat/pc04h-private-candidate-pagination-20261101` if already present. The PC-04G total was owner-observed **193 tests**, and PC-04H adds **8 fictional-only tests**. **201 expected**, not a confirmed result. The observed acceptance gate is `fail 0`, Build PASS, Public Dist Scan PASS; broad/private browser security gate is unchanged.

After tests pass, only in a trusted Windows Terminal:

```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<OWNER_PROTECTED_PRIVATE_DIRECTORY_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-private-workplan-local
```

Enter the existing passphrase on the local PC, open the exact printed `http://127.0.0.1:PORT/` **on that same computer**, pair and authorize details. Never enable LAN/public tunnels or move this app to public Pages.

### Manual browser checklist
- [ ] Before pairing, new page API returns 401; after pairing but before detail confirmation, 403.
- [ ] After confirmation, a project with many saved PRs offers **ดู PR ทั้งหมดจาก Snapshot**. Open it: see up to 10 references/page, correct PR Draft flags and a clear saved **NOT LIVE** warning; click Next/Previous.
- [ ] Count and number continuity are internally consistent; no duplicate/silent missing IDs across pages. A project with no omitted refs does not need the page button.
- [ ] The page button can close the list, and **เลือกตรวจรายการนี้** starts the existing temporary PC-04F worksheet for the currently selected reference. No owner TODO/priority/host status is changed.
- [ ] A malformed/out-of-scope URL, unsupported HTTP method or legacy Snapshot-only mode cannot reveal private project data.
- [ ] On Logout, both paginated and candidate-detail routes return HTTP 401, the UI clears; Ctrl+C closes the listener.
- [ ] Test 390px responsive mode, Thai label wrapping, 44px target sizes and no horizontal overflow.
- [ ] Public Pages continues fictional-only and has no code/data changes. Do not share real project names, hashes, cookies, private folders, or decrypted file content publicly.

## Outstanding security/release gates
Historic earlier PUBLIC Git path disclosure and general local-process/browser-extension/CSRF security review remain human-owned. Owner local acceptance is not a release/deploy authorization. All PRs in this stack remain Draft; Git HEAD or PR counts do not prove deployed versions. No automatic 07:00 refresh/merge/deploy or production write.
