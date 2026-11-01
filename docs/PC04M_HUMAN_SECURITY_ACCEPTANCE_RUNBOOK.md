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

## Human gate register — all initially OPEN

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

### C. M3–M5: explicit human decisions after the first two gates

Use a private-only worksheet to record: reviewed machine, tested exact HEAD, observed local HTTP statuses, residual threat risks, owner decision and date, and confirmation that no private registry content was exported. Publish only **redacted PASS / HOLD / UNKNOWN** and evidence category in the public Draft PR. Do not elevate source-check PASS to Host or real-data acceptance.

## Release restriction / rollback

- No automatic Merge, Deploy, encrypted Workplan write, live Stage refresh, repository migration, remote secret export, Git history rewrite or browser launch.
- This PC-04M PR is **docs-only** and stacked on PC-04L; neither its Draft status nor its authoring means the five human gates are resolved.
- Stop any owner-local private session when finished and close with Ctrl+C. If a real disclosure is suspected, suspend release, preserve evidence privately and decide remediation separately before continuing.

**Decision today:** PC-04L owner-local automated acceptance PASS; PC-04M human security gates M1–M5 remain OPEN. Next owner action is *private historic-public-source review with an explicit risk decision*, not a command that changes repository or Host state.
