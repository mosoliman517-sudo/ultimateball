-- Games site accounts (new Supabase project, separate from ballknowledge). Adapted from ballknowledge's chess schema.
-- Run once: Supabase -> SQL editor -> paste -> Run. Safe to run again.
-- Holds: nickname, saved progress (XP, ranks per category, Dex, loading screens, achievements), results and leaderboards.

create schema if not exists games;
grant usage on schema games to anon, authenticated, service_role;
alter default privileges in schema games grant all on tables to anon, authenticated, service_role;
alter default privileges in schema games grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema games grant execute on functions to anon, authenticated, service_role;

create table if not exists games.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nick text not null check (nick ~ '^[A-Za-z0-9 _.-]{3,16}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists games_profiles_nick on games.profiles (lower(nick));

create table if not exists games.progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists games.results (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  game text not null check (game ~ '^[a-z0-9_]{2,24}$'),
  score numeric not null check (score between -1000 and 100000),
  week int not null,
  day text not null check (day ~ '^\d{4}-\d{2}-\d{2}$')
);
create index if not exists games_results_board on games.results (game, week);
create index if not exists games_results_user on games.results (user_id, created_at);

alter table games.profiles enable row level security;
alter table games.progress enable row level security;
alter table games.results enable row level security;

drop policy if exists "own profile read" on games.profiles;
create policy "own profile read" on games.profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists "own progress" on games.progress;
create policy "own progress" on games.progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "own results insert" on games.results;
create policy "own results insert" on games.results for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from games.profiles p where p.user_id = auth.uid()));

-- At most 120 entries a minute per account (a simple brake on abuse).
create or replace function games.results_rate_limit() returns trigger language plpgsql as $$
begin
  if (select count(*) from games.results where user_id = new.user_id and created_at > now() - interval '1 minute') >= 120 then
    raise exception 'too many scores, slow down';
  end if;
  return new;
end $$;
drop trigger if exists results_rate on games.results;
create trigger results_rate before insert on games.results for each row execute function games.results_rate_limit();

-- Choose or change a nickname. Returns 'ok', 'taken' or 'invalid'.
create or replace function games.set_nickname(p_nick text) returns text
language plpgsql security definer set search_path = games as $$
begin
  if auth.uid() is null or p_nick !~ '^[A-Za-z0-9 _.-]{3,16}$' then return 'invalid'; end if;
  insert into games.profiles (user_id, nick) values (auth.uid(), p_nick)
    on conflict (user_id) do update set nick = excluded.nick;
  return 'ok';
exception when unique_violation then return 'taken';
end $$;

-- The public boards: every games game is scored as a best score, so a board shows each player's highest result. Nobody can read the raw tables.
create or replace function games.leaderboard(p_game text, p_period text, p_week int, p_day text)
returns table (nick text, value numeric, plays int)
language sql stable security definer set search_path = games as $$
  select p.nick, max(r.score) as value, count(*)::int as plays
  from games.results r join games.profiles p on p.user_id = r.user_id
  where r.game = p_game
    and (p_period = 'all' or (p_period = 'week' and r.week = p_week) or (p_period = 'day' and r.day = p_day))
  group by p.nick
  order by value desc, max(r.created_at) asc
  limit 50;
$$;

grant execute on function games.leaderboard(text, text, int, text) to anon, authenticated;
grant execute on function games.set_nickname(text) to authenticated;
grant select, insert, update on games.progress to authenticated;
grant insert on games.results to authenticated;
grant all on all tables in schema games to service_role;

alter role authenticator set pgrst.db_schemas = 'public, graphql_public, storage, games';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
