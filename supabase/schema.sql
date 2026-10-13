-- Programmatic Notes analytics — run this once in Supabase → SQL Editor.
-- 1. Change the dashboard passcode on the last INSERT line before running.
-- 2. Students' browsers can only INSERT events. Nobody can read them with the public key;
--    the dashboard reads through get_stats(), which checks the passcode.

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  visitor_id  text not null check (char_length(visitor_id) <= 64),
  session_id  text check (char_length(session_id) <= 64),
  name        text check (char_length(name) <= 60),
  batch       text check (char_length(batch) <= 30),
  event       text not null check (event in ('visit','identify','module_view','module_done','module_undone',
                                              'quiz_complete','lab_complete','drill_complete','viva_practice')),
  module      text check (char_length(module) <= 40),
  score       int,
  total       int,
  device      text check (device in ('mobile','desktop')),
  meta        jsonb check (meta is null or pg_column_size(meta) <= 2000)
);
create index if not exists events_created_idx on public.events (created_at);
create index if not exists events_visitor_idx on public.events (visitor_id);

alter table public.events enable row level security;
drop policy if exists "anyone can add events" on public.events;
create policy "anyone can add events" on public.events
  for insert to anon, authenticated with check (true);
-- No SELECT / UPDATE / DELETE policy: the public key can't read or change anything.

create table if not exists public.dashboard_secret (pass text not null);
alter table public.dashboard_secret enable row level security;   -- no policies = unreadable from the browser
revoke all on public.dashboard_secret from anon, authenticated;

create or replace function public.get_stats(p_pass text, p_days int default 30)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  result json;
  since timestamptz := now() - make_interval(days => greatest(1, least(p_days, 365)));
begin
  if not exists (select 1 from dashboard_secret where pass = p_pass) then
    raise exception 'wrong passcode' using errcode = '28000';
  end if;

  with e as (select * from events where created_at >= since),
  latest_name as (
    select distinct on (visitor_id) visitor_id, name, batch
    from events where name is not null order by visitor_id, created_at desc
  )
  select json_build_object(
    'days', p_days,
    'totals', (select json_build_object(
        'visitors', count(distinct visitor_id),
        'sessions', count(distinct session_id),
        'named',    (select count(*) from latest_name ln where ln.visitor_id in (select visitor_id from e)),
        'views',    count(*) filter (where event = 'module_view'),
        'quizzes',  count(*) filter (where event = 'quiz_complete'),
        'avg_quiz_pct', round(avg(100.0 * score / nullif(total,0)) filter (where event = 'quiz_complete'))
      ) from e),
    'daily', (select coalesce(json_agg(d order by d.day), '[]') from (
        select to_char(date_trunc('day', created_at at time zone 'Asia/Kolkata'), 'YYYY-MM-DD') as day,
               count(distinct visitor_id) as visitors,
               count(*) filter (where event = 'module_view') as views
        from e group by 1) d),
    'modules', (select coalesce(json_agg(m order by m.views desc), '[]') from (
        select module,
               count(*) filter (where event = 'module_view') as views,
               count(distinct visitor_id) filter (where event = 'module_view') as viewers,
               count(distinct visitor_id) filter (where event = 'module_done') as done
        from e where module is not null and module <> 'home' group by module) m),
    'scores', (select coalesce(json_agg(s), '[]') from (
        select event, coalesce(meta->>'drill', module) as activity, count(*) as attempts,
               round(avg(100.0 * score / nullif(total,0))) as avg_pct,
               max(round(100.0 * score / nullif(total,0))) as best_pct
        from e where event in ('quiz_complete','lab_complete','drill_complete') group by 1,2) s),
    'devices', (select coalesce(json_agg(dv), '[]') from (
        select device, count(distinct visitor_id) as visitors from e where device is not null group by device) dv),
    'students', (select coalesce(json_agg(st order by st.last_seen desc), '[]') from (
        select ln.name, ln.batch,
               max(e.created_at) as last_seen,
               count(distinct e.module) filter (where e.event = 'module_view' and e.module <> 'home') as modules_opened,
               count(distinct e.module) filter (where e.event = 'module_done') as modules_done,
               max(round(100.0 * e.score / nullif(e.total,0))) filter (where e.event = 'quiz_complete') as best_quiz_pct,
               count(*) filter (where e.event = 'viva_practice') as viva_practice
        from latest_name ln join e on e.visitor_id = ln.visitor_id
        group by ln.name, ln.batch, ln.visitor_id) st)
  ) into result;
  return result;
end;
$$;

revoke all on function public.get_stats(text, int) from public;
grant execute on function public.get_stats(text, int) to anon, authenticated;

-- Set your dashboard passcode (change it!). Re-run just these two lines to change it later.
delete from public.dashboard_secret;
insert into public.dashboard_secret (pass) values ('change-me-to-something-long');
