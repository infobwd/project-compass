# PC-03D — Owner-Local Private Dashboard | Architecture & Security Design

**Status: DESIGN ONLY — PROPOSED / NOT IMPLEMENTED / NOT TESTED.** 
**Decision dependency:** PC-03C passed owner-reported Windows Local Acceptance. GitHub branch read-back confirms the PC-03C fix, but no independent CI or machine execution was performed. This plan is not an authorization to merge, deploy, open a host, import real data into a public build, or write to other repositories.

## 1. Why this phase
PC-03C decrypts a strictly selected AES-256-GCM snapshot **in process memory** and prints an evidence-first terminal summary. PC-03D will provide a responsive **owner-local** visual view without turning the public GitHub Pages application into a private-data endpoint.

This is a security-sensitive design: binding a private-data HTTP endpoint to 127.0.0.1 **does not by itself authenticate a browser or prevent localhost attacks**. Never substitute a public Vite preview or a web deployment for the private dashboard.

## 2. Proposed delivery shape
- Separate **private runtime** beneath `tools/private-ui/` (Node.js standard library first; no new external network/cloud dependency required for the initial pilot).
- Separate static view code/assets under `tools/private-ui/assets/` or embedded by private runtime; no imports into public `src/`, `public/`, `fixtures/`, or generated `dist/`.
- Startup must be initiated deliberately in an owner's Windows PowerShell session (no autostart, no background daemon, no Task Scheduler service).
- Input is only the configured, outside-Git private selection and encrypted selected snapshot. Private runtime calls existing PC-03C `decryptSnapshot`, `verifySelectedSnapshot`, `buildEvidenceSummary` after passphrase entry **in the terminal**. The browser does NOT receive the encryption passphrase, encrypted snapshot, GitHub token or private filesystem path.
- A strictly bound loopback-only HTTP service on `127.0.0.1` with OS-assigned port. Never bind 0.0.0.0 or a LAN address. Start with no listening service until startup validation and terminal unlock pass. No reverse proxy, tunneling, Pages integration or remote access in this phase.
- Application data is read-only and from the locally decrypted **fixed snapshot**. No GitHub API calls, git write, merge, deploy, data edits, silent refresh or host acceptance inference.
- Public React/Vite frontend remains a wholly separate fictional demo, without private routes, private module references or production private data.
- On process termination, clear in-process data where practical; acknowledge JS garbage-collected memory is not a guarantee against memory inspection.

## 3. Session authorization (must be implemented before real-data browser access)
- User unlocks in the PowerShell terminal through a hidden passphrase prompt; no key in CLI flags, history, env vars, URL or browser form.
- Generate a random single-use pairing code, displayed in the terminal; browser starts on a generic locked page and submits the code via a POST body over loopback to obtain a session.
- Validate pairing with a constant-time comparison (or equivalently strong design), expire the code quickly, strictly limit attempts and invalidate after first successful pairing; never log the code.
- Use process-memory single-user session state, strong random IDs, short idle and absolute timeouts, invalidate on logout/server stop, and regenerate session after login.
- Auth state is conveyed with **HttpOnly + SameSite=Strict session cookies**; on HTTP loopback mark Secure appropriately for browser compatibility, and never claim HTTP is encrypted. No token in localStorage, sessionStorage, query string, browser history or public HTML.
- Enforce an explicit local Host allowlist and reject DNS-rebinding attempts, strict Origin checks for state-changing operations, CSRF protections, no CORS authorization for foreign origins, and fetch metadata validation when supported. All endpoints require auth except the locked page and login.
- Enforce request body caps, per-client login throttles, rate limits, request method/content-type checks; deny detail requests until a separate explicitly acknowledged **private-details** session unlock/action.
- User can always stop the process with Ctrl+C; service cannot be installed as background task silently.

## 4. Data classification & endpoint contract
**No endpoint, response, static asset or cached document is publicly accessible.**

| Local endpoint (proposed) | Response | Access rule |
| --- | --- | --- |
| GET / | generic locked shell; no project identifiers | public to loopback only |
| POST /session | pair single-use terminal code | POST+Origin+anti-bruteforce |
| GET /api/summary | counts, freshness, verified/unknown status; **no names** | active owner session |
| POST /session/details | explicit acknowledgement for detail disclosure | owner session + CSRF protection |
| GET /api/projects | minimal private repository IDs, branch and evidence axes | owner + details acknowledged; no full PR texts |
| POST /session/logout | revoke session; clear detail authorization | authenticated |
| all other paths | 404, no file disclosure | deny by default |

All dynamic responses: `Cache-Control: no-store, private`, `Pragma: no-cache`; generic error pages without names, tokens or stack traces; no service worker or PWA cache, no analytics/telemetry, no third-party fonts/CDNs/assets, no cross-origin fetch.
Security headers: restrictive CSP (`default-src 'none'`, locally self-hosted approved assets, disallow connect-src except self, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, appropriate clickjacking protections.

## 5. Screen/UX plan (mobile-first, separate local view)
1. **Locked / Unlock:** clear `LOCAL PRIVATE VIEW` indicator, restricted access; no project data on unauthenticated page.
2. **Overview:** scope N/N; timestamp in ISO and Asia/Bangkok; `RECENT/AGING/STALE/CLOCK_SKEW`; Git head, PR and Issue VERIFIED/UNKNOWN counts; host and acceptance explicitly `NOT_VERIFIED`.
3. **Projects:** list 11 names only after details acknowledgement. Search/filter by evidence state, open PRs and known/unknown; never pretend a default branch is deployment branch.
4. **Evidence Detail:** distinct development / Git / deployment / decision / confidence axes; show actual observation evidence only, keep unproven axes UNKNOWN/NOT_VERIFIED.
5. **Next Actions:** show evidence-derived safe read/check suggestions, not invented completion; mark owner-only actions. Initial pilot may show `not yet computed` rather than fabricated tasks.
6. **Lock / Exit:** clear server session and hide details on navigation/expiry; no copied private content automatically.

Responsive gates: 390×844 mobile, 1024×768 tablet, 1440×900 desktop, 125/150/200% zoom, keyboard/escape/focus-visible, screen reader labels, no horizontal overflow; **the local browser device must be the same authorized Windows machine in this phase**.

## 6. Trust boundaries and anti-patterns
- Never place `selected.snapshot.enc.json`, `projects.selection.json` or decrypted data in `public/`, `src/`, `dist/`, GitHub Actions artifacts or Pages.
- Don't attempt to hide private data with CSS, feature flags, `robots.txt`, Base64, a `VITE_*` value or minification.
- Don't trust Origin alone, loopback IP alone, browser-only password checks or obscured URLs for authorization.
- Do not automatically display project names in an unauthenticated UI, browser autocomplete, static HTML, favicon paths, source maps, logs or errors.
- No cross-machine or phone-on-LAN private access until separate authenticated TLS architecture is explicitly approved. A mobile responsive design is NOT approval to listen on a LAN IP.
- Browser screenshots/console logs including repository names are private artifacts.

## 7. Decision alternatives
A. **Recommended PC-03D pilot:** local Node loopback service + terminal unlock + short-lived paired browser session. Pros: works with existing Node + PC-03C, no cloud account, no Electron package. Risk: local HTTP exposed to other applications/browser tabs on the host; mitigations and hostile-origin tests are mandatory.
B. Dedicated desktop shell (Tauri/Electron) later: avoids exposing a conventional local HTTP port in some architectures but adds dependency, signing, update and packaging security costs; no automatic security guarantee.
C. Hosted authenticated backend: deferred to PC-04+ with separate approval, identity/permissions/audit/TLS, private server-side GitHub credential design.

**Proposed ADR-004:** choose A for a read-only owner-only local pilot, contingent on the threat-model tests and manual approval; do not interpret this proposal as approval for any deployment.

## 8. Current boundaries (November 2026 planning snapshot)
- PC-03C: owner reports Local Test/Build/Public Scan and 11/11 private reader PASS. Independent Windows/CI attestation: NOT VERIFIED.
- PC-03D: this document and planning PR only. No browser runtime, login, pairing endpoint or project listing implemented yet.
- Production branch vs default Git HEAD, host deployment, project completion, school evidence and private authenticated remote access remain independent unverified tasks.
- GitHub repository is PUBLIC: all committed text MUST stay generic and public-safe.

**No Merge / No Deploy / No production changes.**
