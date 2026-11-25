-- Ranked seasons and player links for ultimateball (run after 001 and 002):
-- Supabase -> SQL editor -> New query -> paste -> Run. Safe to run again.

-- One row per finished ranked match, per player. A season is a calendar month (UTC); points are 1000 + the month's changes.
-- The browser reports its own result, so the change is capped and rate limited. This is a friendly ladder, not tamper proof.
create table if not exists public.ranked_results (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  world text not null check (world ~ '^[a-z]{3,16}$'),
  delta int not null check (delta between -32 and 32),
  season text not null default to_char(now() at time zone 'utc', 'YYYY-MM')
);
create index if not exists games_ranked_season on public.ranked_results (season, world);
alter table public.ranked_results enable row level security;

create or replace function public.season_report(p_world text, p_delta int) returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or not exists (select 1 from public.profiles where user_id = auth.uid()) then return 'noname'; end if;
  if (select count(*) from public.ranked_results where user_id = auth.uid() and created_at > now() - interval '10 minutes') >= 10 then return 'slow'; end if;
  insert into public.ranked_results (user_id, world, delta) values (auth.uid(), p_world, greatest(-32, least(32, p_delta)));
  return 'ok';
end $$;

create or replace function public.season_board(p_world text, p_season text)
returns table (nick text, value int, plays int)
language sql stable security definer set search_path = public as $$
  select p.nick, (1000 + sum(r.delta))::int, count(*)::int
  from public.ranked_results r join public.profiles p on p.user_id = r.user_id
  where r.world = p_world and r.season = p_season
  group by p.nick order by 2 desc, 3 desc limit 50;
$$;

-- What a player link shows: name, XP, chosen title, badge count and XP per category. Nothing else (no email, no history).
create or replace function public.public_profile(p_nick text)
returns table (nick text, xp int, title text, badges int, worlds jsonb)
language sql stable security definer set search_path = public as $$
  select p.nick, coalesce((g.data->>'xp')::int, 0), g.data->>'title',
         case when jsonb_typeof(g.data->'badges') = 'object' then (select count(*)::int from jsonb_object_keys(g.data->'badges')) else 0 end,
         coalesce(g.data->'worlds', '{}'::jsonb)
  from public.profiles p left join public.progress g on g.user_id = p.user_id
  where lower(p.nick) = lower(trim(p_nick))
  limit 1;
$$;

revoke all on function public.season_report(text, int) from public;
grant execute on function public.season_report(text, int) to authenticated;
grant execute on function public.season_board(text, text) to anon, authenticated;
grant execute on function public.public_profile(text) to anon, authenticated;
