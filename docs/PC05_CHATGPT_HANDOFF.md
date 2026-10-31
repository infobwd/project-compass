# PC-05 — ChatGPT Project, Work and Handoff Contract

Status: **DRAFT / PROCESS SPEC**.

## When asked "What should I do next?"
1. Re-check authenticated GitHub metadata and canonical roadmap documents; do not reuse an unverified chat summary as live truth.
2. Label each statement VERIFIED (source/time), REPORTED (owner or document), INFERRED, STALE or UNKNOWN.
3. Show no more than 3–5 top next actions with explicit dependencies and *why now*.
4. Distinguish "I can read/review/draft" from "owner needs to perform local/host testing, approval or deployment".
5. For any blocked step, give the smallest evidence needed to unblock, not an optimistic completion claim.
6. Never merge, deploy, migrate or update production based on an automated morning summary.

## Private handoff format
```text
Project:
Canonical GitHub repo / branch / exact observed HEAD:
Observed at (Asia/Bangkok):
Current phase; independent development / Git / deploy / decision states:
Completed milestone + proof:
Open PRs and dependency order:
Blocking questions and required local/host/device evidence:
Next safest action and intended acceptance:
Forbidden or approval-required actions:
Source roadmap and links:
```
Private handoffs belong in authenticated chats or protected storage, **not public Pages**.

## Work integration proposal
Use connected GitHub read permissions to inspect multiple repositories and create reviewable changes on isolated branches only after source, permissions and risks are established. Record draft PR links as evidence. A tool capable of reading GitHub has **not** thereby accessed the user's Windows workspaces or production host.

## Morning brief integration
- Preferred schedule: 07:00 daily, Asia/Bangkok.
- Check existing active/paused automations and avoid duplicate goals.
- A recurring ChatGPT task can report accessible GitHub and document evidence but must treat private access at execution time as uncertain.
- User approves installing or connecting any missing app; never assume Work or scheduled tasks have arbitrary system access.
