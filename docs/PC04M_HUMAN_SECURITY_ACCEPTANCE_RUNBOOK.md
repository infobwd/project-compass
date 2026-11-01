# PC-04M — Human Security Acceptance / Public History Decision Gate

**2026-11-01 Asia/Bangkok · DRAFT / EVIDENCE REVIEW ONLY · NO MERGE / NO DEPLOY.**

## Verified handoff and scope

- Parent PC-04L Draft PR #28: owner-reported exact tested branch/HEAD match to `b9e881e4424eb81797faeab527d6173a24ecaeb4`. Owner Windows screenshots: Node **245 pass / 0 fail**, Build PASS, public-dist scan PASS and five *static* security-preflight source checks PASS. These results do not authorize live private-browser release.
- PC-04K Draft PR #27: owner-observed GitHub GET-only `PC04K_READ_ONLY_REVIEW` and both no-write cancellation gates. No owner real TODO has been committed via this workflow.
- This PC-04M phase is a **documentation-only security review and local manual evidence runbook**. It neither modifies HTTP authentication code nor opens the private browser, reads/decrypts owner private data, queries Host, writes real tasks, rewrites Git history, or changes a public Pages deployment.
- Evidence must always distinguish **source inspection**, **synthetic-runtime tests**, **owner-performed Windows HTTP/browser observations**, **explicit owner risk/authorization decisions**, and **Host/Production evidence**.

## Current source findings (reviewed, not yet runtime-authorized)

Relevant source: `tools/private-ui/private-local.mjs` on the PC-04L parent HEAD.

| Control | Source observation | Current evidence status |
|---|---|---|
| Local bind | HTTP server listens on `127.0.0.1`, port 0 (OS-assigned); rejects mismatched `Host` and supplied foreign `Origin` or `Sec-Fetch-Site` | SOURCE OBSERVED; hostile-process and DNS-rebinding threat review OPEN |
| Pairing | 16-hex single-use code; default 2-minute pairing window; default five attempts; random session token hashed server-side | SOURCE OBSERVED; live pairing timeout and retry behavior NOT reverified in PC-04M |
| Session | `HttpOnly; SameSite=Strict` cookie; time-checked idle/absolute expiry; source has 401/403 rejects | SOURCE OBSERVED; exact owner Windows HTTP after logout/refresh PENDING |
| Detail authorization | `/session/details` POST from paired session explicitly enables a separate detail flag | SOURCE OBSERVED; it is an owner gesture, **not** separate password/MFA or hostile-local-process protection |
| Mutations | Routes include pairing, detail opt-in, logout; no encrypted Workplan writer HTTP endpoint in this private browser | SOURCE OBSERVED; runtime authorization/CSRF review OPEN |
| Logout | `/session/logout` discards server-side references, invalidates token, sends expired cookie; UI locks | SOURCE OBSERVED; post-logout HTTP 401 and Refresh behavior PENDING |
| Caching and browser | `no-store, private`, CSP/frame protections and no-cache response headers | SOURCE OBSERVED; extensions, screenshots, memory, disk and cache behavior still need separate human review |

**Do not write “SECURITY PASS” based on source inspection, tests against the synthetic server, or the public dist scan.** Static preflight intentionally reports `BLOCKED_FOR_REAL_PRIVATE_DATA`.

## Owner decision recorded — M1 historical Git-path exposure

**2026-11-01 Asia/Bangkok — OWNER ACCEPTS THE RESIDUAL M1 RISK (scope-limited).**
The owner explicitly chose to accept the known/possible residual risk that earlier public Git commits or branches may still disclose historical example paths and related contextual metadata, **without authorizing destructive history rewriting**. Proceed to M2 manual acceptance work in a synthetic-only environment. This is a **risk acceptance decision**, not proof that all earlier commits were searched, that every exposed value was harmless, or that the information was deleted from Git history.

**Security status:** `M1 = RISK_ACCEPTED_BY_OWNER / EXPOSURE_NOT_REMEDIATED`. M2–M5 all remain `PENDING/HOLD`. No blanket authorization for actual private Snapshot browser use, production release, Merge, Deploy, real TODO writes, or disclosure of additional sensitive data. If credentials, access tokens, learner identifiers, or other high-impact secrets are found later, treat them as a *new incident requiring separate review and appropriate rotation/containment*, not covered by this acceptance. No personally identifying paths or raw history excerpts are reproduced in the public repository.

## Owner-observed M2 synthetic HTTP gate — 2026-11-01

**Status: M2_SYNTHETIC_OWNER_OBSERVED_PASS (NOT REAL-PRIVATE SECURITY ACCEPTANCE).** Owner reported that the local synthetic-only Chrome pairing flow followed the expected sequence: before pairing protected endpoint **401**; after pairing before separate detail approval **403**; after deliberate detail approval **200**; after logout protected endpoint **401**. Earlier owner screenshot demonstrated the synthetic session's `details 200`, `projects 200`, `logout 204`, and LOCKED UI; later owner found that DevTools had an active Fetch/XHR filter, obscuring some requests, and then confirmed the expected HTTP status observations. This is the owner's report, **not independent collection of HTTP traffic**. Refresh/cache persistence is not independently proven by a complete browser trace and remains part of subsequent browser threat review. No actual encrypted Snapshot or real private browser was needed for this M2 synthetic test.

**Scope boundary:** source-observed logout invalidation and this synthetic-only result do not automatically approve actual private browser use, real-cookie/session handling, hostile local processes, remote exposure, or Host deployment. **M3, M4, M5 = OPEN/HOLD** pending separate decisions. No automatic Merge/Deploy, data export, or real TODO.

## PC-04M M4 — source threat review completed; owner risk decision still OPEN

The [M4 source-grounded local browser threat model](PC04M_M4_LOCAL_BROWSER_THREAT_MODEL.md) inventories loopback-only listener, exact Host/Origin and Fetch Metadata checks, CSRF/session guards, cookie and timeout policy, CSP/no-store, filesystem boundaries and existing synthetic negative-test coverage. **Source-level review is complete; hostile Windows-process/browser-extension, Windows ACL/reparse-point, and Refresh/BFCache operational acceptance are not independently proved.**

**Residual risk:** another malicious program or untrusted extension running under the same Windows user could still access displayed content, session/browser memory or local files. The loopback bind and cookie flags alone cannot mitigate a compromised endpoint. A dedicated trusted workstation/browser profile, no unwanted extensions/screenshare, controlled filesystem ACLs, and deliberate Logout + Ctrl+C shutdown are suggested operating controls. No real-private browser use is authorized by this document.

**M4 STATUS = SOURCE_REVIEW_COMPLETE / OWNER_RISK_ACCEPTANCE_PENDING**. M1 accepted historical-path risk is narrower and does not count as M4 acceptance; M3 separate real-private consent and M5 acceptance remain OPEN. If high-impact secrets are ever found, initiate separate incident handling.

## Human gate register — source checklist (owner decisions above)

| Gate | Evidence owner must supply | STOP / HOLD rule |
|---|---|---|
| M1 — PUBLIC Git history disclosure | Review currently reachable historical commits/branches/PR descriptions and relevant release artifacts for any owner-local path examples, repository names, personal data or secrets; record a **private** finding count + risk decision | Historical exposure cannot be removed by editing latest source; no forced push, branch deletion, or claim of clean history without approved remediation |
| M2 — Logout / Refresh / HTTP 401 | Reproducible Windows browser evidence showing paired → detail-step-up → Logout → old API request returns **401** → Refresh remains locked; unauthorized details **403** | Any stale session, repeated API 200, private response cache or auth error = HOLD |
| M3 — Explicit real-private authorization | Owner separately decides whether/where to operate with actual encrypted Snapshot; confirms dedicated trusted Windows workstation and local-only use | Past pilot use is not a blanket security authorization; no automatic re-opening of real private browser |
| M4 — Threat-model decision | Review hostile local process, browser extensions/devtools, DNS rebinding/Host, CSRF/Origin, cookie/session theft, token logs, caching, terminal history, screenshots, local filesystem symlinks | Unmitigated high-risk path = HOLD; owner signs off on residual risk |
| M5 — Real private UI acceptance | After M1–M4 and explicit GO, owner tests intended real encrypted Snapshot, paired UI, logout, privacy boundary, no network/console leakage; record private checklist and minimal public-safe PASS/FAIL | No private data through GitHub Pages, CI, PR comments, screenshots or ChatGPT tools without separate secure review |

## Suggested order and safe Windows acceptance procedure

### A. M1: historical Git security review, READ-ONLY

1. Work from the owner's existing trusted checkout. Preserve edits. `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, and `git fetch origin --prune` are the permitted initial commands. Do not reset, rebase, merge, or clean files for this audit.
2. Examine repository history, including relevant public PR branches and commit history, *locally*. Prior PC-04J PR #26 flagged an intermediate public documentation commit with a Windows example path later changed to a placeholder; **editing the current file does not erase previously reachable commits**. An isolated public-only release can avoid bringing those branches into `main` but is not itself history remediation.
3. A local review may inspect `git log --all --oneline`, `git show --stat SHA`, and only privately `git show SHA -- <relevant-file>`. Do not paste diffs, raw paths, private repository names, tokens, Stage IDs or workplan content into the public PR or chat. The user may record `HISTORY_REVIEWED` / `HISTORY_HOLD` with a **private** decision note.
4. Distinguish benign generic Windows-path test regex patterns from an actual owner-specific path, host, credential, student record, or secret. Do not infer that a regex alone proves a real leak. Review scope must include remote branches and tags still reachable at the time inspected, and note its limitations.
5. If disclosure is confirmed, assess sensitivity, exposure duration, log/artifact copies and whether the fix requires rotation, access restrictions, or an explicitly authorized history-remediation plan. **No destructive Git history edits in this PR.**

### B. M2: only after owner authorizes manual local browser validation

Use the **existing** paired local server and validated owner-controlled test workflow from the PC-04I/PC-04J runbook; do not start a new Stage or Activate. Initially prefer **fictional fixture / synthetic server** for status-code QA. For real data, gate M3 separately first.

Manual browser checklist (keep screenshot and DevTools inspection on trusted PC; share only status codes and redacted counts):

- [ ] Before pairing, a private API such as `GET /api/projects` returns **401**. Static `GET /` may still be 200 and is not evidence of authenticated access.
- [ ] After pairing but **before** explicit detail opt-in, `GET /api/projects` returns **403**.
- [ ] After deliberate opt-in, the same API returns **200** only while session is valid. Never publish response bodies.
- [ ] Click **“ออกจากระบบ / ล้าง Session”**. Confirm UI visibly locks.
- [ ] A previously authorized request made again with the now-stale browser cookie returns **401** and no private content; Refresh does not restore private cards. A 200 from a **static** route must not be mistaken for an API auth bypass.
- [ ] Test wrong Host/Origin and invalid methods **only on disposable synthetic runtime**, not against real owner records, and avoid posting raw cookies or tokens.
- [ ] Check cache/Network and browser extensions, then close server using Ctrl+C. Ensure no private response body is copied to public Git or stored in test output.

Failure or uncertainty => `HOLD`, never `PASS` by inference.

## M4 owner decision and M3 authorization boundary — 2026-11-01

Owner explicitly accepts M4 *residual operational risk* under a trusted personal Windows workstation, trusted browser without unnecessary extensions, no screen-sharing or unintended recordings, encrypted private folder outside Git, passphrase/code protection in terminal, and Logout followed by Ctrl+C to close the local server. Full details in the [M4 Threat Model](PC04M_M4_LOCAL_BROWSER_THREAT_MODEL.md).

Record `M4=SOURCE_REVIEW_COMPLETE / OWNER_CONDITIONAL_RISK_ACCEPTANCE`. This is **not** proof of hostile local process resistance, browser BFCache/Refresh correctness, private UI acceptance, or Host readiness.

**M3 was explicitly authorized by the owner in a later, separate decision; see the narrow M3 section below.** This does not expand the scope of M4's risk acceptance. Keep real Stage ID, passphrase, cookies, response bodies, paths and identities out of public docs/chat. The owner—not ChatGPT—must launch and operate the real local UI.

M5 remains OPEN: after M3 approval, use a minimal, private-only acceptance worksheet to check 401 before pairing; 403 before details opt-in; 200 after; Logout 204; 401 for previously protected API after Logout and locked on Refresh; no private fields or tokens in published assets/Network screenshots; no HTTP writer/Host claims. If any status unexpectedly differs, STOP and retain local evidence only.

## M3 — owner grants narrowly scoped real-private local read-only browser authorization (2026-11-01)

**Authorization status: M3 OWNER_AUTHORIZED — limited to manual, local, read-only acceptance. Execution and M5 evidence are still PENDING.** After separately accepting M1 historical-path residual risk and M4 trusted-device/browser residual risk, the owner explicitly answered **"อนุญาต"** to using their already-encrypted real Snapshot only on their own trusted Windows workstation in the local read-only Private Dashboard for M3/M5 verification. This is an explicit per-phase authorization; do not construe it as blanket future approval.

**Authorized:** owner manually launches the existing browser process on `127.0.0.1` via `node tools/private-ui/private-local.mjs --ack-real-private-local` (minimal Snapshot-only view), privately enters the decryption passphrase in the trusted local terminal and pairs a dedicated trusted browser profile using the terminal's one-time code; checks only protected HTTP statuses and safe visual behavior; stops the local server and verifies encrypted Snapshot and owner Workplan digests unchanged. This command does **not** load the owner Workplan into the browser. Optional Workplan/Delta browser is **outside this first minimal M5 pass** and must not be silently substituted.

**Not authorized:** automatic launch from ChatGPT, remote/cloud browsing of the real local UI, exposing passwords/cookies/pairing code/real project names, PR identifiers or HTTP response bodies to GitHub or conversation images, any real owner TODO write, Stage/Activate/refresh, new Host network route, GitHub Merge/Deploy, source history rewrite, or broad release/security sign-off. A `200` response proves local access at that moment only, not GitHub live/Host/Production acceptance.

### Minimal owner Windows M5 flow — no real Workplan browser load

1. If the synthetic server is still running, stop it with **Ctrl+C**. Open trusted Windows PowerShell in the existing Project Compass checkout, confirm `git status --short`, branch and HEAD without switching branches or resetting local edits.
2. Set `BWD_COMPASS_PRIVATE_DIR` to the **existing protected private directory outside Git** (do not create or relocate it). Read-only check the encrypted selected Snapshot and owner Workplan exist; record before SHA-256 values **privately in PowerShell variables**, never print the digests or paths.
3. Execute only `node tools/private-ui/private-local.mjs --ack-real-private-local`. This source path validates/decrypts selected encrypted Snapshot into a memory-only projection and starts a single listener on `127.0.0.1:OS_ASSIGNED_PORT`; it does not start GitHub sync or modify any encrypted file. Input decryption passphrase at local trusted terminal only (not browser, chat or PR). Refuse any unexpected host, other network address, or missing file.
4. Open exact printed loopback URL in trusted browser, preferably an Incognito window with extensions disabled. Check `GET /api/projects` before pairing **401**, then enter one-time pairing code, before detail opt-in **403**, after deliberate detail opt-in **200**, then click Logout (**204**), retry old API **401**; browser refresh remains locked. Inspect status codes only; never export Network HAR/cookies/bodies.
5. End server with Ctrl+C. Recompute both encrypted file SHA-256 values and private directory file-name inventory and require **unchanged**. If any status unexpected, data leak, task write, changed file or browser cache exposure, **STOP / M5 HOLD**. Owner reports only status sequence, `unchanged: True/False`, and high-level redacted result.

**M5 status remains PENDING** until the owner's actual Windows observations from the authorized real-private local browser. M3 authorization alone is not M5 acceptance, does not retire M4 residual risk, and does not unlock real TODO/Production workflows.

### C. M3–M5: explicit human decisions after the first two gates

Use a private-only worksheet to record: reviewed machine, tested exact HEAD, observed local HTTP statuses, residual threat risks, owner decision and date, and confirmation that no private registry content was exported. Publish only **redacted PASS / HOLD / UNKNOWN** and evidence category in the public Draft PR. Do not elevate source-check PASS to Host or real-data acceptance.

## Release restriction / rollback

- No automatic Merge, Deploy, encrypted Workplan write, live Stage refresh, repository migration, remote secret export, Git history rewrite or browser launch.
- This PC-04M PR is **docs-only** and stacked on PC-04L; M1 owner residual risk acceptance is **not** technical security verification; M2 is owner-observed synthetic HTTP acceptance only, and M3 is owner-authorized but not yet executed; M5 remains unresolved.
- Stop any owner-local private session when finished and close with Ctrl+C. If a real disclosure is suspected, suspend release, preserve evidence privately and decide remediation separately before continuing.

**Current owner decision:** PC-04L owner-local automated acceptance PASS; PC-04M M1 historical-public-source risk is **ACCEPTED BY OWNER, NOT REMEDIATED**, and M2 **SYNTHETIC OWNER-OBSERVED PASS** for the 401 → 403 → 200 → 401 sequence. M3–M5 remain OPEN; separate browser/cache/Refresh and threat-model evidence is not automatically satisfied. M4 source review is complete and its residual operational risk has been conditionally accepted by the owner under the trusted-device/browser controls. This remains risk acceptance rather than an independent security PASS. M3 real-private Snapshot-only read-only local browser use was separately **AUTHORIZED BY OWNER**, but has NOT been run or accepted by this documentation update. M5 remains OPEN pending owner Windows evidence; browser Refresh/BFCache and Windows local-process/ACL behavior have not been technically certified.
