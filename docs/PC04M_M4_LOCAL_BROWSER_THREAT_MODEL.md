# PC-04M M4 — Private Local Browser Threat Model (Source-Evidence Review)

**Assessment date:** 2026-11-01 (Asia/Bangkok)  
**Scope:** GitHub branch `audit/pc04m-human-security-acceptance-20261101`, reviewing the private local HTTP source and synthetic-only security regression sources.  
**Decision:** **M4 SOURCE REVIEW COMPLETE / HUMAN RISK ACCEPTANCE OPEN (HOLD for real-private browser)**. This is **not a penetration test**, real-private Windows browser run, or owner authorization.

## Evidence inventory

Primary sources reviewed on this branch:
- `tools/private-ui/private-local.mjs` — local-only listener, private in-memory projection, cookie/session and API authorization, HTTP response headers and browser UI.
- `tools/private-ui/auth-synthetic.mjs` — synthetic-only HTTP runtime / pairing.
- `tools/private-sync/sync.mjs`, `tools/private-plan/encrypted-workplan.mjs` — protected directory and encrypted file boundaries.
- `tests/pc03d2-pairing.test.mjs`, `tests/pc03d3b1-hostile-origin-synthetic.test.mjs`, `tests/pc03d3b2-browser-boundary.test.mjs`, `tests/pc03d3b3-private-local.test.mjs`, `tests/pc03d3b4-private-ux-regression.test.mjs` — existing synthetic tests already cover many negative paths.

Evidence already on record: owner-confirmed PC-04L exact-HEAD Windows 245/245 tests and build/public-dist PASS; owner-reported M2 synthetic browser 401 → 403 → 200 → 401 with logout 204. Neither is blanket permission for an actual private browser. M1 historical public-path risk was owner-accepted **without remediation**.

## Threats, observed controls and residual decisions

| ID | Scenario | Source-observed defense | Residual risk / release disposition |
|---|---|---|---|
| T1 | Another device on LAN reaches API | Binds to literal `127.0.0.1`; random OS-chosen port | LOW under ordinary network isolation; still confirm Windows listener on loopback, not `0.0.0.0` or a tunnel. Not a guarantee against local processes |
| T2 | DNS rebinding / hostile Host or Origin | Rejects Host differing from literal `127.0.0.1:PORT`, mismatched Origin, hostile `Sec-Fetch-Site`; POST requires exact Origin | Browser-origin attack path appears constrained; synthetic negative tests exist. Residual: native local clients can forge request headers and this is not local-process authentication. Hostile-browser manual review remains OPEN |
| T3 | CSRF / drive-by POST | SameSite=Strict session cookie, exact Origin, `X-BWD-Local` and JSON content type; only session/pair/details/logout POST endpoints | Source control observed, not a complete adversarial browser audit. No HTTP route may save encrypted TODO. Confirm still true before release |
| T4 | Guess/replay pairing code | Cryptographically random 16-hex pairing code, single-use, short expiry, limited attempts; session token random and stored as hash | LOW against off-device guessing; HIGH if another local program sees the terminal/pairing code. Keep code off screenshots, clipboard/screen-sharing, logs and PRs |
| T5 | Cookie/session hijack or privilege retention | `HttpOnly; SameSite=Strict`; idle and absolute expiry; explicit /details step-up; Logout discards in-memory projection and expires cookie | MEDIUM residual on trusted local HTTP; cookie lacks `Secure` because browser uses loopback HTTP. Browser process compromise, malicious extensions or OS user compromise defeat these boundaries. OWNER DEVICE/TRUST DECISION REQUIRED |
| T6 | Browser cache / Back / Refresh restores details | `Cache-Control: no-store, private`, Pragma and restrictive CSP/CORP/X-Frame-Options; logout resets UI; protected endpoints check session | Source and synthetic controls exist, but full Windows browser Back/Refresh/BFCache/extension behavior not separately demonstrated. Keep release HOLD until observed or explicitly accepted |
| T7 | Hostile same-user native process reads files/memory or sends requests | Encrypted files outside Git, protected read path checks, no public/private source import, no HTTP TODO writer; secret entry in terminal | **HIGH residual risk** on a compromised/shared Windows user account. Localhost is not a per-user trust boundary; same-user malware/privileged apps may read process memory, keyboard, terminal, browser or accessible files. Mitigate operationally, not by claiming loopback prevents it |
| T8 | Symlink/path confusion / plaintext leakage | Source uses absolute/realpath checks, symlink-file refusal for selected paths, encrypted-at-rest write paths | No complete Windows race/ACL or alternate junction/reparse-point abuse audit; independent OS filesystem review is OPEN. Do not treat source checks as proof of Windows ACL hardening |
| T9 | Extension, DevTools or screen-sharing observes private content | Browser renders authorized data only after pairing and detail step-up; static page has no actual project names before pairing | HIGH residual with untrusted extensions or screen-share. Use trusted dedicated browser profile with unneeded extensions disabled; never post Network bodies, pairing code, cookie or private project references |
| T10 | Accidentally publishing private data through Public Pages | Public app stays synthetic and separate; public dist scan rejects listed sensitive patterns; private HTTP binds localhost | Scanner pattern list is not exhaustive and cannot detect all sensitive metadata; continue manual release review. Never build/export private Registry into `dist/` or Git |
| T11 | Unintentional real TODO/Host side effects | Browser is read-only (session state POST only); owner TODO requires trusted CLI REVIEWED + CONFIRM and encrypted revision | Existing owner cancellation and fictional commit tests do not authorize a real CLI write. Host/Deployment remains NOT_VERIFIED |
| T12 | Resource exhaustion / denial of service on local HTTP | Request/headers/keepalive timeouts, limited bodies and request count/socket | Local malicious/competing process could still cause availability failure; denial is not itself evidence of private-data exfiltration. Monitor/review if a real Windows incident occurs |

### Risk distinction

**Observed source properties:** 127.0.0.1 bind, strict Host/Origin checks, one-time pairing, explicit details step-up, server-side session invalidation, protected API 401/403, no-store/CSP and absence of a browser TODO-write route.

**Covered by existing synthetic tests (not rerun in M4):** hostile Origin/Host/fetch-site, CSRF-like content type, forged cookies, idle/absolute timeout, invalid pairing, logout replay, unsafe routes, cache-response headers, and private browser with fictional encrypted selection.

**Not established:** no malicious local process, safe Windows user ACLs, safe extensions/remote-access software, browser profile isolation, all possible historical Git disclosures, complete Windows BFCache/Refresh behavior, and safety of running real decrypted data in a compromised local process.

## Proposed owner operating policy (requires separate approval)

1. Run real private browser **only on a personally controlled, patched Windows workstation**; do not assume loopback alone is secure. Use an isolated OS user/browser profile as practical and disable unnecessary extensions/screenshare.
2. Open only the exact address printed by trusted Node terminal (`127.0.0.1` with its assigned local port). Avoid LAN binding, public reverse proxy, HTTPS tunnels, extensions that record network data and copied session cookies.
3. Keep actual private directory **outside Git and public web roots**; confirm backups, filesystem permissions and encryption offline. No real-path details in public PR comments.
4. Never type real passwords into a browser form; private decryption passphrase remains in trusted terminal. Do not disclose one-time browser pairing codes or cookies.
5. Pair deliberately, permit per-project details only when needed, then use Logout and stop local Node server (`Ctrl+C`). On uncertainty or unexpected API 200 after logout, STOP and do not publish private data.
6. Require a **separate M3 owner decision** before real-private browser use. Keep M5 real-data UI acceptance behind M3 and the unresolved threat/operational review. M4 source review alone must not unlock M3.

## Owner residual-risk decision — M4 (2026-11-01, Asia/Bangkok)

The owner **explicitly ACCEPTED M4 residual operational risk** under the previously proposed scope: run only on a personally controlled, trusted and maintained Windows workstation; use a trusted browser profile with unnecessary extensions disabled; avoid screen sharing/recording while private data is visible; retain the encrypted private directory outside Git and public web roots; keep passphrases and one-time pairing codes in the private terminal; use Logout, then stop the Node local server with Ctrl+C. This is a *conditional owner risk decision*, not a technical guarantee against malicious local processes, untrusted extensions, Windows ACL/reparse-point weaknesses, memory access or browser BFCache behavior.

**M4 decision:** `SOURCE_AUDIT_COMPLETE / OWNER_ACCEPTS_RESIDUAL_RISK_WITH_CONTROLS`. The acceptance does **NOT** signify that the unobserved browser/Windows paths were independently tested or are secure. It does **NOT** grant M3 permission for real encrypted Snapshot browser access; M3 remains explicitly unapproved until separately requested. M5 real-private UI acceptance remains pending. If the trusted-device conditions change, pause private use and reassess. No Git history rewrite, Merge, Deploy or actual owner TODO was approved by this decision.

## Acceptance criteria and outstanding evidence

| Milestone | Current result | Evidence needed for release |
|---|---|---|
| M4-A source threat inventory | **DONE — THIS FILE** | Exact reviewed source names/branch, risk inventory and negative-test inventory |
| M4-B negative synthetic routes | **Existing tests present; PC-04L Windows 245/245 previously owner-observed** | Only rerun if code/behavior changes; do not infer malicious Windows process resistance |
| M4-C Windows browser BFCache, Refresh, extensions/DevTools and cache | **NOT INDEPENDENTLY VERIFIED** | Owner-local status-only observations, no private network response bodies exported |
| M4-D hostile same-user native process / system ACL boundary | **HIGH RESIDUAL RISK / NO ABSOLUTE SOFTWARE MITIGATION** | Owner chooses trusted-dedicated-device policy or HOLD; new evidence if threat model changes |
| M4-E risk acceptance sign-off | **OWNER ACCEPTED RESIDUAL RISK WITH OPERATING CONTROLS** | Conditional approval of M4 risk only; M3 actual-private-browser consent separately required |

### Release decision now

**PC-04M M4: SOURCE AUDIT COMPLETE / RESIDUAL OPERATIONAL RISK ACCEPTED BY OWNER UNDER CONDITIONS.** M1 = accepted residual historical-path risk without deletion; M2 = owner-observed synthetic HTTP PASS; M3 = separate real-private authorization **OPEN / NOT GRANTED**; M4 = conditional owner risk acceptance **RECORDED**; M5 = authorized real-private UI acceptance **OPEN**. M4-C browser BFCache/Refresh/extension observation and M4-D Windows ACL/malicious-process limitations remain documented and are not represented as technical PASS.

Do not Merge, Deploy, run live `--add-action`, rewrite Git history, open private browser with real Snapshot, publish real content, or claim the human security gate PASS from this report. If a credential, token, student identifier, or dangerous secret exposure is later discovered, stop and handle it under a separate incident review irrespective of M1 acceptance.
