# PC-03D2 — Synthetic-Only Local Pairing & Session Pilot

**Status: DRAFT CODE PILOT.** The owner authorized "start D2" following D1 Local Acceptance. This authorizes only fictional/empty-data authentication work. **No real encrypted Snapshot is read or unlocked in the browser. No merge, release, host or Pages changes.**

## Design
- New separate Node built-in HTTP server: `tools/private-ui/auth-synthetic.mjs`; does not replace D1's independently usable `locked-demo.mjs`.
- Listens only on IPv4 `127.0.0.1` and an OS-selected port. No proxy, LAN listener or external asset/CDN/network calls.
- Generates **16 uppercase hexadecimal characters** (64-bit CSPRNG) for a terminal-only one-use pairing code, expires in 2 minutes, five attempted pairings maximum. Restart the process to generate a new code.
- Code is not in URLs, browser JS/static assets, cookies, logs or source repository. It is printed **only on the private local PowerShell console**.
- Pairing requires same-origin JSON POST and custom `X-BWD-Local: 1` header. Host/origin/fetch metadata checks; CORS is never enabled.
- Session ID is random 256-bit, returned in `HttpOnly; SameSite=Strict` cookie on loopback HTTP, held in server memory only; idle expiry 5 minutes, absolute expiry 20 minutes; logout revokes immediately. Cookies intentionally lack `Secure` on this HTTP local-only prototype: **HTTP loopback is not encrypted**. Do not move to LAN or remote hosting without a new TLS architecture.
- Summary endpoint returns only clearly labeled **fictional counts**; detail endpoint returns only **fictional projects** and requires a separate user click that enables details in this local session.
- `Cache-Control: no-store, private`, restrictive CSP, no service worker, no browser persistent token, no telemetry, no external dependencies, no private repository metadata, no plaintext exports.
- Does not import private snapshot decryption or read selection/snapshot from D:. Does not require any passphrase or token.

## Windows operator procedure
1. Keep PC-03D1 running only if needed for inspection; **stop it with Ctrl+C** before testing D2 to avoid confusing browser tabs.
2. From `<LOCAL_PROJECT_WORKTREE>`: run `git status --short`, preserve untracked and modified work; `git fetch origin --prune`.
3. If branch is not present locally, run `git switch --track origin/feat/pc03d2-synthetic-local-pairing-20261101`; otherwise safely switch existing branch. Never reset/clean or force checkout.
4. Confirm exact branch commit: `git rev-parse HEAD`.
5. Run `npm run test`, `npm run build`, `npm run check:public-dist`. Tests must pass before running the app.
6. Start only the **synthetic auth** service: `node tools/private-ui/auth-synthetic.mjs`. The console prints a unique `http://127.0.0.1:<random-port>/` URL and a one-time code; do **not** share the code or take screenshots including it.
7. Open the printed URL in Chrome/Edge **on the same Windows machine**, enter the code printed in that terminal within 2 minutes. Observe paired synthetic summary, details acknowledgment, fictional project data and logout.
8. Test invalid code/expiry/replay by restarting the service (new code each run), no real data is ever loaded.
9. Verify exact listener port is on `127.0.0.1`; close with Ctrl+C and confirm listener gone. Do not report screenshots including secret one-use code or local session cookie.
10. Verify public Vite `dist/` does not include `tools/private-ui` modules or real private data. D0 historical public path review is still OPEN.

## Security test matrix
| ID | Expected result |
| --- | --- |
| D2-S01 | bound exclusively to 127.0.0.1 / random port |
| D2-S02 | unauthenticated summary/details denied, no private metadata |
| D2-S03 | one-use terminal code; replay fails |
| D2-S04 | pairing code expiry, low retry ceiling |
| D2-S05 | idle and absolute session expiry; logout invalidates |
| D2-S06 | Host, Origin and fetch-site mismatches rejected |
| D2-S07 | JSON + X-BWD-Local required; no CORS |
| D2-S08 | CSRF/cross-site form blocked and no dangerous methods |
| D2-S09 | details gated by explicit authenticated session step-up |
| D2-S10 | no-store, CSP, HttpOnly + SameSite Strict, no browser persistent tokens |
| D2-S11 | no real snapshot/selection imports, no real repository names |
| D2-S12 | no third-party scripts, fonts or telemetry |
| D2-S13 | correct responsive layout, keyboard, zoom, error/lock feedback on Windows |
| D2-S14 | Ctrl+C revokes sessions, stops loopback listener |
| D2-S15 | build, Node regression tests and public artifact scan pass on the exact PR SHA |

## Limitations and security decisions
- This is **not** a production-quality login, remote private API, Windows user account authorization, or a substitute for OS protections. A hostile local process can still connect to the loopback port, and a compromised Windows session can observe terminal pairing codes.
- Browsers can have extensions or dev tools that record synthetic display data; do not use real data with this build.
- The D0 issue concerning user-specific paths in older public Git commit history remains OPEN and is not erased by editing current docs. Review before any merge.
- D3 / any real private Snapshot browser access requires **separate human authorization**, security audit and further work; no implicit authorization from D2 tests.

## Evidence
- D1 Local Acceptance: PASS from owner report and loopback screenshot; no independently audited production host.
- D2 implementation: local Node.js v22 synthetic test run on developer container is **10/10 PASS** for the standalone module; exact GitHub PR SHA and Windows device acceptance remain **NOT VERIFIED** until user runs them.
- No Merge / No Deploy.
