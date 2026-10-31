# BWD Project Compass — Phases, Acceptance and Rollback

**Project scope:** one inventory and decision surface, not a replacement source of truth. **No automatic merge or deploy.**

| Phase | Deliverable | Acceptance | Rollback |
|---|---|---|---|
| PC-00 Discovery & Inventory | private full inventory and evidence matrix | scoped repos counted; HEADs and PRs cited; UNKNOWN preserved; no public private-data exposure | delete draft snapshots from controlled storage; no source repos changed |
| PC-01 Architecture & Security | ADRs, schema, sanitizer, threat model | private/public boundary reviewed; no frontend secrets; read-only design | revert isolated design PR only |
| PC-02 UX Prototype | responsive fictitious-data pages | mobile/tablet/desktop snapshots; keyboard + overflow; empty/stale states | switch to last static build; no private payloads |
| PC-03 Sync & Status | read-only GitHub collector, signed private snapshots | branch SHA, PR draft, CI, evidence freshness tested; authorization denied cases pass | disable sync; retain prior snapshot marked stale |
| PC-04 Roadmap & Next Action | dependency graph and 3–5 recommendations | handoff references verified source docs; stacked PRs not counted as separate completions | turn off recommendation engine; keep source links |
| PC-05 ChatGPT / Work | resumable context, evidence-aware brief | can regenerate from trusted sources; no false automation claims | disable brief; retain documents |
| PC-06 Acceptance & Rollout | reviewed releases | public leak scanner and private auth tests pass; real devices accepted; explicit owner GO for deployment | revert Pages release or private service version |

## Regression matrix (minimum)
- [ ] Public build contains no names of private repos, local paths, internal hosts, school records, tokens or forbidden field keys.
- [ ] URLs/source references preserve exact repo/branch/SHA; noncanonical `main` not mistaken for production branch.
- [ ] PR OPEN vs MERGED vs Draft retained separately from acceptance and host deployment.
- [ ] Host VERIFIED requires independent host evidence; CI PASS is insufficient.
- [ ] 401/403 and disconnected GitHub fail closed and show UNKNOWN, not "0 open PR".
- [ ] Missing timestamp or stale evidence is shown as STALE/UNKNOWN.
- [ ] Stacked PR dependencies do not create duplicate priority actions.
- [ ] Repo collection is read-only; no production repo modified.
- [ ] Public sanitized export uses explicit allowlist, deny-by-default on unrecognized fields.
- [ ] Mobile 390×844, tablet 1024×768 and desktop responsive tests, zoom/keyboard/offline tests.
- [ ] Private data excluded from PWA cache, service worker and static assets.
- [ ] User approval gate before merge, production deployment, migration, API mutation or sharing.

## Release gates
`Design review -> Public-safe source review -> Local acceptance -> Explicit owner approval -> Release -> Independent host/device verification`.
Recording a plan as a document or draft PR is **not** acceptance or production release.

## Daily brief (planned, not scheduled)
07:00 Asia/Bangkok. Compare latest accessible verified snapshots: changes, high-impact blocked work, human-only approvals, next 3–5 safe actions and evidence links. Avoid duplicate automations; first check existing scheduled tasks. If no secure private source is available to the scheduler, publish an honest "data not verified" notice rather than project details.
