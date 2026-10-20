# Programmatic Notes

Interactive revision notes for the programmatic module (MLP batches, Kraftshala): 22 modules, drills, a viva timer and a 38-question quiz, built from Cyrus Taneja's and Saikiran's classes.

- `index.html`: the notes app (students open this)
- `dashboard.html`: your analytics dashboard (passcode-protected)
- `analytics.js` + `config.js`: tiny tracker that sends events to Supabase
- `supabase/schema.sql`: the database: one events table + a stats function

Plain HTML. No build step, no framework.

---

## 1 · Turn on analytics (Supabase, ~5 minutes, free)

1. Go to <https://supabase.com> → **New project** (any name, e.g. `programmatic-notes`, region Mumbai).
2. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql`.
   **Change the passcode on the last line** (`change-me-to-something-long`) and click **Run**.
3. Open **Project Settings → API Keys** (or **Data API**) and copy:
   - the **Project URL** (`https://xxxx.supabase.co`)
   - the **publishable key** (`sb_publishable_…`), or the legacy **anon** key (`eyJ…`)
4. Paste both into `config.js`.

The public key can only **add** events. It cannot read anything, so it's safe in a public repo.
The dashboard reads data only through `get_stats()`, which checks your passcode.

To change the passcode later, run in SQL Editor:

```sql
delete from public.dashboard_secret;
insert into public.dashboard_secret (pass) values ('your-new-passcode');
```

## 2 · Host it on GitHub Pages

1. On GitHub, create a **public** repo, e.g. `programmatic-notes` (no README).
2. In Terminal:

```bash
cd ~/Claude/Projects/"Programmatic Notes"
git init -b main
git add .
git commit -m "Programmatic Notes: notes app + analytics"
git remote add origin https://github.com/Gaurav455106/programmatic-notes.git
git push -u origin main
```

3. Repo → **Settings → Pages** → Source: **Deploy from a branch** → `main` / `/ (root)` → Save.
4. After a minute the site is live at `https://gaurav455106.github.io/programmatic-notes/`
   and the dashboard at `…/programmatic-notes/dashboard.html`.

Deep links work: `…/programmatic-notes/#deals`, `#quiz`, `#viva` and so on.

## What gets tracked

| Event | When |
|---|---|
| `visit` | first page load of a browser session |
| `module_view` | a module is opened |
| `module_done` / `module_undone` | "Mark as done" toggled |
| `quiz_complete` | final quiz finished (score / 38) |
| `lab_complete` | optimisation lab finished (score / 10) |
| `drill_complete` | setting-finder, brand-safety or UFC-rules drill finished |
| `viva_practice` | viva timer started |
| `identify` | student saved or cleared their name |

Each event carries a random browser ID, the session, device (mobile/desktop), and, only if the student typed it on the start page, their **name and batch**. Name is optional; leaving it blank keeps them anonymous.

## Session analytics

Open `analytics.html` (same passcode). Sessions, average / median session duration, time of day (IST), day of week, approximate city, devices and recent sessions. Duration is the time the tab was visible, sent as a `heartbeat` event once a minute. Location is looked up once per session from get.geojs.io; only city, region and country are stored.

## Dashboard

Open `dashboard.html`, enter the passcode. You'll see: unique visitors, sessions, module views, named students, quizzes finished, average quiz score; daily visitors; per-module opens and completion; quiz/lab/drill averages; device split; and a student table you can filter and export as CSV. Pick Today / 7 / 30 / 90 days.
