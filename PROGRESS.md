# Progress — Programmatic Notes

_Newest first. Keep under ~80 lines._

## Status
- 2026-10-13: live on GitHub Pages at https://gaurav455106.github.io/programmatic-notes/ (repo Gaurav455106/programmatic-notes). Sidebar has an Analytics link to dashboard.html. Supabase not connected yet: config.js is empty.

## Decisions (with reasons)
- Plain HTML, no build: matches the workspace default; GitHub Pages serves it directly.
- Analytics on Supabase (Gaurav asked for a backend; already uses Supabase for Blinkit). Public key insert-only; reads only via passcode RPC so the repo can be public.
- Student name/batch is optional (privacy); anonymous browser ID otherwise.
- Also published as a private claude.ai artifact (no analytics) for quick sharing.

## Verified
- All 22 modules render, no console errors, no horizontal scroll at 390px, light + dark.
- Every drill, quiz, lab and calculator clicked through in Playwright.
- schema.sql run on Postgres 16: anon can insert, cannot select events or the secret; wrong passcode rejected; get_stats returns totals/daily/modules/scores/devices/students.
- Tracker sends visit, module_view, identify, module_done, quiz_complete against a mock API; dashboard renders and rejects a wrong passcode.

## Open bugs / to check
- Confirm the Supabase publishable key works with the REST insert on the real project (code sends Bearer only for legacy eyJ keys).
- Check Noise net-media % and UFC split against class sheets.

## Next step
- Gaurav: create Supabase project + run schema.sql + fill config.js; create GitHub repo `programmatic-notes` and enable Pages (steps in README).
