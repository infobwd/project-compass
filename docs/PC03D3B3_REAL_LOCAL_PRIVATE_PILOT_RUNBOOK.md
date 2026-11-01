# PC-03D3B-3 — Authorized OWNER-LOCAL Real Private Snapshot Browser Pilot

**State: IMPLEMENTED ON AN ISOLATED DRAFT BRANCH / EXACT-HEAD WINDOWS ACCEPTANCE NOT YET VERIFIED.**
**Scope:** The owner explicitly authorized real selected Private Registry use **on their own Windows computer** after reporting that D3B-2 tests passed. This is permission to conduct an **opt-in local experiment** only, NOT authorization to Merge, Deploy, expose a LAN port, publish Pages, or share data.

## Explicit source and acceptance separation
- D3B-2: owner reported PASS. The exact Git SHA, test totals and full screenshot/CI remain **not independently verified**.
- D0 prior PUBLIC history: concrete Windows worktree example paths remain in earlier commits/PR diffs. Human audit/acceptance decision **OPEN**; source cleanup does NOT erase history.
- Real data pilot D3B-3: code and synthetic encrypted-fixture tests added. **NOT YET ACCEPTED on owner's exact Windows SHA**.
- Existing `node tools/private-ui/security-preflight.mjs --check` checks the synthetic/public boundary and still prints `BLOCKED_FOR_REAL_PRIVATE_DATA`; it is NOT the acceptance of this separately approved owner-local experimental runtime. Public/network/production real-data release remains BLOCKED.

## Strict local data-flow
```text
Protected directory OUTSIDE public Git checkout
  projects.selection.json + selected.snapshot.enc.json
             |
    PowerShell hidden passphrase, once
             |
  decryptSnapshot + parseSelection + projectOfflineEvidence
             |  all in local Node process memory
             v
  127.0.0.1 random-port server — locked HTML until pairing
    GET /api/summary  -- short-lived paired session, aggregates only
    GET /api/projects -- paired session + explicit details consent
             |
    local Chrome/Edge only; no external/remote browser
```

### Delivered
- `tools/private-ui/private-local.mjs` is a **different runtime** from the fictional `auth-synthetic.mjs`.
- Requires explicit CLI `--ack-real-private-local` and absolute `BWD_COMPASS_PRIVATE_DIR` outside Git, visible ONLY in user's terminal settings.
- Unlock passphrase entered in terminal with no echo. Never accepted from browser, URL or command-line flags and never written to disk. Node process uses the previously established AES-256-GCM/scrypt decryption/strict selected Snapshot validation code. NOTE: JS strings/heap are not guaranteed secure-zeroed.
- Strict 1–40 selected repo identity/order validation, protected file size checks, symbolic link rejection for input files and path containment checks.
- Listens only on `127.0.0.1` with an OS-selected port; no tunnel, external fonts, CDN, analytics, service worker, GitHub CLI write, synchronization, or host check.
- Single-use random terminal pairing code with two-minute validity and limited attempts; opaque `HttpOnly; SameSite=Strict` cookie; short idle/absolute session timeout; strict Host/Origin/Fetch metadata and POST header checks.
- No authentic private-data response before successful browser pairing; only aggregate Git head/PR/Issue counts until explicit secondary detail confirmation.
- `GET /api/projects` returns **only** validated repository identifier, default branch, Git PR/Issue counts, and five labeled evidence axes. No PR descriptions, student/user identities, credentials, local file paths, Git tokens, raw snapshot or full API dump.
- Status remains Development=UNKNOWN, Git=OBSERVED_DEFAULT_HEAD or UNKNOWN, Deployment=NOT_VERIFIED, Decision=HUMAN_REVIEW_REQUIRED, Confidence reflects evidence freshness/coverage. Default branch DOES NOT prove production branch.
- Browser renders all private strings via `textContent`, never `innerHTML`. No export, screenshots, logging of records, browser storage, or public React imports.
- Logout destroys the local server's data/session references and blocks pairing code replay. Restart server and terminal-unlock again to access.
- Pairing and active session also have wall-clock expiration safety timers for unattended sessions. Ctrl+C shuts the local server and discards references.

### Known remaining security limitations
- **Loopback HTTP is not TLS**; the pilot does not set `Secure` on its session cookie to maintain HTTP loopback compatibility. A malicious local process/browser extension may access data or spoof HTTP headers; same-host malware defeats the trust boundary. This is an OWNER-ONLY trusted-workstation pilot, not a hardened enterprise/remote solution.
- Browser/OS cache settings and no-store headers mitigate but cannot guarantee erasure of memory, extensions, screenshots, OS swap, accessibility/DevTools text.
- CSS responsive view is designed for narrow widths, but it is NOT permission to connect a phone via LAN (the server will not bind LAN).
- Historic public git-path exposure still requires a human risk decision before future merge or deployment. Prior path examples are not proof that private Snapshot data was uploaded.
- Existing `security-preflight` remains deliberately BLOCKED for general real-data browser integration/public release, even though this manually launched, narrowly authorized local runtime is available for isolated testing.

## Operator Windows runbook (local path supplied only in chat, NOT stored in PUBLIC repo)
1. Ensure a trusted Windows login, local disk protected, terminal not screen-shared, and old Synthetic Server stopped (Ctrl+C). No private directory copied into public Git checkout.
2. Safely fetch and switch to D3B-3 Draft branch (review local modifications first):
```powershell
Set-Location '<LOCAL_PROJECT_WORKTREE>'
git status --short
git fetch origin --prune
git switch --track origin/feat/pc03d3b3-owner-local-real-snapshot-pilot-20261101
git rev-parse HEAD
```
If branch exists locally, use `git switch feat/pc03d3b3-owner-local-real-snapshot-pilot-20261101`, do not reset/clean.
3. **BEFORE opening real data**, test the exact code with fictional fixtures:
```powershell
npm run test
npm run build
npm run check:public-dist
node tools/private-ui/security-preflight.mjs --check
```
Expect all tests PASS/fail 0, build PASS, scanner PASS, source gates 5/5 PASS, legacy `BLOCKED_FOR_REAL_PRIVATE_DATA` still printed (release gate; not an error).
4. When all exact-head tests pass **and you accept local HTTP/browser-extension risks**, explicitly opt into this LOCAL test:
```powershell
$env:BWD_COMPASS_PRIVATE_DIR = '<ABSOLUTE_PRIVATE_DIR_OUTSIDE_GIT>'
node tools/private-ui/private-local.mjs --ack-real-private-local
```
Enter **the original PC-03B selected Snapshot passphrase** into the Terminal only. The process refuses to start a listener if decryption/selected scope checks fail.
5. Open the printed `http://127.0.0.1:PORT/` on the SAME Windows machine, pair with new Terminal code, verify summary selected 11 (only if the snapshot truly contains 11). Check source timestamp and freshness; if stale, do NOT claim live GitHub status.
6. With the screen private, click confirm to show names/branches/5 axes. Do not share screenshots containing actual repo identifiers. After Logout, reloading must show locked state and `/api/summary` and `/api/projects` without session must return HTTP 401.
7. Press Ctrl+C; use actual port to verify listener closed. **Do not share passphrase, pairing code, cookie or selected JSON.** No file contents/snapshot need to be uploaded to ChatGPT.
8. Record only safe evidence: SHA, test totals, build/scan results, preflight output, localhost-only bind, 11/11 summary, freshness marker, generic Logout/401 pass/fail.

### Rollback
Stop server via Ctrl+C. This runtime does not write, rename or overwrite the selected encrypted Snapshot or private selection file. The PC-03C terminal reader remains the fallback. Do not Merge/Deploy.

## Human gate after local experiment
- Record exact Windows HEAD and runtime acceptance, including Private 11/11 scope and manual Logout/401 on this branch.
- Revisit old public Git path exposure and determine documented risk acceptance vs approved remediation before broader code merge.
- Any Public Dashboard / Remote / GitHub Pages private-data support requires a **new** security architecture and explicit approval; NOT included here.

**No Merge. No Deploy. No host writes. No public Snapshot publication.**
