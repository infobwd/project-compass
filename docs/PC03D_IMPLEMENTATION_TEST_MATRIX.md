# PC-03D — Implementation Breakdown, Acceptance & Operator Runbook (PLAN ONLY)

**Current phase:** D0/D1 synthetic locked server implemented in Draft PR #7; Local Acceptance PASS by owner report and partial screenshot/socket corroboration on 2026-11-01. D2 authentication and real private-data browser access NOT STARTED / NOT AUTHORIZED. See [PC-03D1 Local Acceptance](PC03D1_LOCAL_ACCEPTANCE_OWNER_REPORTED_20261101.md).

## Baseline and evidence inventory
| Gate | Latest grounded status | What it DOES NOT prove |
| --- | --- | --- |
| PC-03B 11 selected GitHub repos | OWNER_REPORTED PASS; encrypted selection snapshot found locally | Current deployment, canonical production branches, approval |
| PC-03C Node Tests after NaN fix | OWNER_REPORTED PASS (no attached CI logs) | Independently verified CI or a secure web UI |
| PC-03C Build + public-dist scan | OWNER_REPORTED PASS | Comprehensive privacy or penetration assessment |
| PC-03C 11/11 private summary without NaN | OWNER_REPORTED PASS | Live sync or host acceptance |
| PC-03D D0/D1 | Local locked demo OWNER_REPORTED PASS; visual + loopback screenshot evidence; historic exposure review OPEN | Independent security certification, browser authentication or real private data UI |

Preserve PC-03C Git head SHA when testing; do not reinterpret an older snapshot as live. Every UI claim must carry a source type and observation time.

## Implementation milestones, dependencies and outputs

### D0 — Security decision and public-source review (required first)
1. Review and explicitly accept/reject ADR-004 local loopback-only pilot approach.
2. Audit **existing public draft documentation** for concrete local Windows paths and other operational metadata. Prior PC-03A/B/C runbooks contain example Windows D-drive paths; under the project's private-by-default rules, these must be reviewed and replaced by generic placeholder paths in all affected draft branches **before any merge or wider sharing**. Existing commit history remains visible unless a separate carefully reviewed GitHub history-remediation decision is made; never force-push unilaterally.
3. Define threat model: malicious tab/site, DNS rebinding, hostile localhost process, shoulder surfing, Windows compromise, stale snapshot, leaked screenshots, lock-screen return, unexpected service exposure.
4. Define the approved local browser authentication mechanism and timeout defaults. Require explicit owner approval before writing real-data UI.

Deliverable: accepted architecture decision, validated public-only source, threat/test checklist. Status now: **PROPOSED**.

### D1 — Separate local service scaffold (synthetic data only)
1. Implement `tools/private-ui/server.mjs` and `tools/private-ui/assets/`; do **not** import it into public `src/App.tsx`.
2. Bind to 127.0.0.1 only and OS-assigned port; no `0.0.0.0`, LAN, remote tunnel, Cloudflare/Pages deploy.
3. Render a generic locked page with fully synthetic fixtures until authorization tests pass.
4. Enforce restrictive CSP, Host/Origin/CSRF/CORS/no-store, body limits, no service worker, no external asset requests.
5. Add strict server entry guard and clean shutdown; opening a browser never silently unlocks.
6. Test with offline Node built-ins; prove the public Vite build contains no private UI or data.

Deliverable: isolated loopback server with a locked synthetic shell. Status now: **NOT_STARTED**.

### D2 — Authenticate owner locally, fail closed
1. Terminal-only passphrase unlock; verify encrypted Snapshot/selection against existing PC-03C contracts before loading.
2. Pair a browser with a one-time terminal code, short expiry, low retry cap, constant-time verification, no URL query or logs.
3. Maintain owner session in memory; rotate IDs; idle and absolute expiry; logout/stop wipe session. No browser persisted tokens.
4. Auth-only aggregate endpoint (no names), separate details acknowledgement, and details-only project evidence endpoint.
5. Verify all unauthenticated and expired sessions are rejected without disclosing repo identifiers or count side channels on the locked page.
6. Pin the source observation time for the full session and label STALE/CLOCK_SKEW/UNKNOWN accurately.

Deliverable: authenticated single-user local-only read view. Status now: **NOT_STARTED**.

### D3 — Evidence-first UX (private authenticated browser)
1. Local overview shows scope, evidence age, verified/unknown Git counts, not task completion scores.
2. Searchable private project list and details only after step-up acknowledgment.
3. Separate cards for Git, Development, Decision, Deployment, Confidence. Non-Git axes remain NOT_VERIFIED/UNKNOWN until separate evidence is imported and accepted.
4. Daily brief is a **snapshot-based read-only preview**; automatic morning job must not unlock the private browser or expose a decrypted file.
5. Show clear recommended manual actions such as 'check host', not fabricated completion states.
6. Mobile simulation/viewport checks are on the authorized machine only; no mobile physical LAN browsing in this pilot.

Deliverable: private UI accepted in local browser after security testing. Status now: **NOT_STARTED**.

### D4 — Human QA, rollout and rollback without production
1. Exact Git head, `npm run test`, `npm run build`, `npm run check:public-dist` all PASS.
2. Security tests below PASS using fictional snapshots; separately accept owner-only encrypted snapshot operation without printing private files.
3. Check loopback-only binding using netstat/get-nettcpconnection, no proxy exposure, no web cache/storage traces, no third-party requests.
4. Inspect response headers / DevTools Network, source map/public build, responsive/keyboard navigation.
5. Log test results with commit SHA, date and device, but no sensitive data. Owner authorizes any subsequent merge and any public demo deploy separately.
6. Ctrl+C must shut down and revoke sessions, leaving encrypted snapshot untouched. A failed gate blocks release.

Deliverable: documented Local Acceptance, not Production Acceptance. Status now: **NOT_STARTED**.

## Security / Regression Matrix (minimum)
| ID | Scenario | Required pass evidence |
| --- | --- | --- |
| SEC-01 | Service bind | `127.0.0.1` only; random port; no LAN listener |
| SEC-02 | Without paired login | no private identifiers in HTML, endpoints, errors or cached files |
| SEC-03 | Wrong/replayed/expired code | rejected; no state disclosure; retry limits |
| SEC-04 | Origin/CORS/CSRF | cross-site/host-header/localhost rebinding attempts rejected |
| SEC-05 | Cookie/session | HttpOnly, SameSite=Strict, no URL/localStorage token; logout & expiry enforced |
| SEC-06 | Request abuse | body size limits, path traversal refusal, blocked unexpected methods |
| SEC-07 | Unlock fail | bad passphrase/tampered ciphertext/wrong selection => no server access |
| SEC-08 | Snapshot scope | 11/11 selected, strict allowlist/order and separate sealed snapshot |
| SEC-09 | Evidence semantics | any unavailable PR/issue => total UNKNOWN; no NaN/false zero |
| SEC-10 | Freshness | RECENT/AGING/STALE/CLOCK_SKEW and displayed observedAt |
| SEC-11 | Dist isolation | no `private-ui` runtime, plaintext, credentials or private metadata in public dist |
| SEC-12 | Disk persistence | no plaintext exports, browser offline/service worker cache, logs or screenshots by default |
| SEC-13 | UI and device | viewport/zoom/keyboard/screen reader; detail gate works |
| SEC-14 | Host/deploy | always NOT_VERIFIED unless checked by separate accepted workflow |
| SEC-15 | Stop/rollback | Ctrl+C removes listener and sessions; no private file modification |
| SEC-16 | Browser network | no CDN, external font, telemetry, web requests or unexpected egress |
| SEC-17 | Existing public docs | local machine paths/private metadata audited, redacted where required, approved |
| SEC-18 | Git safety | Draft PR only, no `main` changes, no merge, deploy, migration or permissions changes |

## Proposed data / state contract
```text
PrivateSnapshot (AES-256-GCM) --terminal unlock-->
ValidatedSnapshot (process memory only) --server-side projection-->
PrivateSummary { count, observedAt, freshness, verified, unknown }
PrivateDetail { repositoryId, defaultBranch, gitHeadState, openPRs, openIssues }
DevelopmentState = UNKNOWN / manual-evidence-backed only
DeploymentState = NOT_VERIFIED
DecisionState = NEEDS_EVIDENCE / explicit human approval only
```
No general raw GitHub JSON route; no PR bodies, full issue content, credentials or arbitrary local path reads in D phase.

## Risks / dependencies
- Loopback ≠ trusted: hostile webpages and local processes can contact a local port; detailed auth and request-origin hardening are mandatory.
- HTTP loopback does not give transport encryption; do not extend to network access without TLS and independent security architecture.
- Real browser UI may cache data unless explicitly hardened; manual browser storage inspection is mandatory.
- On-screen private data remains visible to observers/screenshots and malware in the same OS session; user-controlled lock and trusted account required.
- Existing GitHub draft documents may already contain sensitive-ish local workspace paths; a later code fix does not undo public Git history.
- The owner may have an earlier Windows clone with untracked build artifacts. Preserve local state; no automatic cleanup/reset.
- Snapshot freshness: D never silently fetches current GitHub status; stale evidence must say STALE.
- The original public site is a demo only; separate authenticated remote backend, if needed later, is a different approved phase.

## Next human actions
1. Review the [architecture proposal](PC03D_LOCAL_PRIVATE_DASHBOARD_ARCHITECTURE.md) and security matrix above in Draft PR.
2. Authorize **PC-03D0/D1 implementation** only after privacy and local-session design review.
3. On Windows, do not run new PC-03D commands yet: there is no server implementation in this branch.
4. Do not upload the local selection JSON, encrypted snapshot, passphrase or screenshot with private project names.
5. No Merge / Deploy; maintain existing CLI as the working fallback.
