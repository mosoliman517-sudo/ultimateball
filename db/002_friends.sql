-- Friends for ultimateball (run after 001_accounts.sql): Supabase -> SQL editor -> New query -> paste -> Run. Safe to run again.
-- You add friends by their leaderboard name. Each person sees their friends' level, XP and best scores; nothing else is shared.

create table if not exists public.friends (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
alter table public.friends enable row level security;
drop policy if exists "own friends" on public.friends;
create policy "own friends" on public.friends for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, delete on public.friends to authenticated;

-- Add a friend by name. Returns 'ok', 'notfound', 'self' or 'already'.
create or replace function public.add_friend(p_nick text) returns text
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then return 'notfound'; end if;
  select user_id into fid from public.profiles where lower(nick) = lower(trim(p_nick));
  if fid is null then return 'notfound'; end if;
  if fid = auth.uid() then return 'self'; end if;
  insert into public.friends (user_id, friend_id) values (auth.uid(), fid) on conflict do nothing;
  if not found then return 'already'; end if;
  return 'ok';
end $$;

create or replace function public.remove_friend(p_nick text) returns text
language plpgsql security definer set search_path = public as $$
begin
  delete from public.friends f using public.profiles p where f.user_id = auth.uid() and f.friend_id = p.user_id and lower(p.nick) = lower(p_nick);
  return 'ok';
end $$;

-- Your friends with their public stats (level comes from XP; the title is the achievement they chose to show).
create or replace function public.my_friends()
returns table (nick text, xp int, title text, avatar text, last_seen timestamptz, follows_back boolean)
language sql stable security definer set search_path = public as $$
  select p.nick, coalesce((g.data->>'xp')::int, 0), g.data->>'title', g.data->>'avatar', g.updated_at,
         exists (select 1 from public.friends b where b.user_id = f.friend_id and b.friend_id = auth.uid())
  from public.friends f join public.profiles p on p.user_id = f.friend_id left join public.progress g on g.user_id = f.friend_id
  where f.user_id = auth.uid()
  order by g.updated_at desc nulls last;
$$;

-- A game's board among you and your friends: each person's best score, all time.
create or replace function public.friends_board(p_game text)
returns table (nick text, value numeric, plays int)
language sql stable security definer set search_path = public as $$
  select p.nick, max(r.score), count(*)::int
  from public.results r join public.profiles p on p.user_id = r.user_id
  where r.game = p_game and (r.user_id = auth.uid() or r.user_id in (select friend_id from public.friends where user_id = auth.uid()))
  group by p.nick order by 2 desc limit 50;
$$;

grant execute on function public.add_friend(text) to authenticated;
grant execute on function public.remove_friend(text) to authenticated;
grant execute on function public.my_friends() to authenticated;
grant execute on function public.friends_board(text) to authenticated;
notify pgrst, 'reload schema';
