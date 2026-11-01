# PC-04D1 — Windows Thai Terminal Glyph Diagnostic (PUBLIC-SAFE)

**Date:** 2026-11-01 (Asia/Bangkok).  
**State:** screenshot-confirmed compact command execution, **Thai presentation NOT ACCEPTED**. Draft patch pending owner Windows QA. No Merge / Deploy / actual owner files modified.

## Evidence observed

Owner ran `morning-brief-cli.mjs --compact`, entered existing passphrase in local PowerShell and explicitly typed `DISPLAY`. The script completed without an error and showed local Snapshot warnings and owner-recorded counts, but **many Thai glyphs were absent/replaced by spaces**. English repository IDs and ASCII counts remained readable. The screenshot includes private identifiers, so it is not committed or shared into any public repository artifact.

Previous screenshot in the same development sequence showed Vite Build PASS and the public `dist` scanner PASS. **The full Node suite, tested Windows commit SHA and correct Thai rendering are not evidenced for this new patch.** Do not promote to PASS.

The cause **is not proven** from the image alone. Possible issues: console output code page/UTF-8 mismatch, Windows Terminal renderer or the profile font's coverage/fallback for Thai combining characters. The formatter's Thai source strings remain intact in the inspected GitHub source; that does not prove this particular Terminal rendered them correctly.

## Code change

- `--thai-check`: **synthetic-only** fixed Thai sample text plus ASCII label. Executes **before any private folder access or passphrase prompt**, reads no Snapshot/workplan and writes no data. If the sample is illegible, diagnose Terminal independently of actual report.
- `--compact-ascii`: produces a shorter **ASCII-only English fallback** using the same evidence model and existing `DISPLAY` consent. Requires the actual passphrase and reads private data **only when the owner explicitly invokes it**. Any Thai title/next step is rendered as `?` in this fallback: do not assume this preserves task text fully. The full `--details` report remains available.
- Existing `--summary` and `--compact` behavior is unchanged except the synthetic diagnostic/fallback. Neither creates tasks or updates the encrypted plan.
- Four fictional-only regressions: no-file fake Thai diagnostic, ASCII-only fallback, zero TODO warning, consent-gated private output.

## Manual Windows triage (trusted owner Terminal only)

1. Safely fetch/fast-forward the existing **PC-04D Draft PR branch**. Preserve uncommitted work, never reset/clean. Record SHA.
2. `npm run test`, `npm run build`, `npm run check:public-dist`, and `node tools/private-ui/security-preflight.mjs --check`.
3. **Before setting private folder or entering any passphrase**, run:
   ```powershell
   node tools/private-plan/morning-brief-cli.mjs --thai-check
   ```
   The fixed text should read: `ทดสอบภาษาไทย: กำลังเรียนรู้ วันนี้ พรุ่งนี้ 123`.
4. If Thai is broken, check console settings (these affect the *current terminal session* only):
   ```powershell
   chcp 65001 > $null
   [Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
   [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
   $OutputEncoding = [Console]::OutputEncoding
   node tools/private-plan/morning-brief-cli.mjs --thai-check
   ```
   Ensure the terminal uses a Thai-capable font (Windows Terminal → Settings → PowerShell profile → Appearance → Font face) and retry in a **new** Windows Terminal window if glyph shaping/fallback is still incorrect. Do not assume changing code pages fixes missing glyphs.
5. If the synthetic sample displays correctly, run `--compact` again with the protected private directory, and type `DISPLAY` locally. Do not show actual task content in public PR screenshots.
6. If Thai is still unreadable, `--compact-ascii` is an **optional temporary fallback**, still requiring passphrase and exact `DISPLAY`. Its Thai action titles appear as `?`; use the authenticated local browser or `--details` to view the original task strings, not as a faithful translation.
7. Report only PASS/FAIL of Thai sample before/after codepage, Build/Test status and exact Git commit. Do not post passphrase, screenshots with repo names, cookies, decrypted Snapshot or task contents.

## Security release boundary

- PUBLIC GitHub Pages remains fictional DEMO data. This patch is in a stacked PRIVATE local pilot Draft PR.
- No GitHub merge, deployment, remote D: access, browser API change or scheduled 07:00 execution.
- Existing unresolved human gates include older PUBLIC Git path examples and owner review of hostile local processes/console captures.
