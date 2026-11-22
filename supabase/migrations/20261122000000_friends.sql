-- =============================================================
-- UniMarket: friends (requests, accept/decline, remove)
-- Run this once in the Supabase SQL editor (or `supabase db push`),
-- AFTER 20261108_messaging.sql.
--
-- Model
--   friendships : one row per pair of users.
--                 status = 'pending'  -> requester asked, addressee hasn't answered
--                 status = 'accepted' -> they are friends
--   Declining, cancelling and unfriending all delete the row, so either
--   person can send a fresh request later.
--
-- Security model (enforced by Postgres, not the frontend)
--   * You can only see friendship rows you are part of.
--   * The client role has SELECT only. Every change goes through the
--     SECURITY DEFINER functions below, which always act as auth.uid():
--       - you can't send a request on someone else's behalf
--       - only the addressee can accept a request
--       - you can't friend yourself or a user that doesn't exist
-- =============================================================

create table if not exists public.friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null default 'pending',
  created_at    timestamptz not null default now(),
  responded_at  timestamptz,
  constraint friendships_status_check check (status in ('pending', 'accepted')),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

-- One row per unordered pair: A->B and B->A can't both exist.
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists friendships_requester_idx on public.friendships (requester_id);
create index if not exists friendships_addressee_idx on public.friendships (addressee_id);

-- ---------- Row Level Security ----------

alter table public.friendships enable row level security;

drop policy if exists "members read friendships" on public.friendships;
create policy "members read friendships"
  on public.friendships for select
  to authenticated
  using (auth.uid() in (requester_id, addressee_id));

revoke all on public.friendships from anon, authenticated;
grant select on public.friendships to authenticated;

-- ---------- RPC: send a request (or accept theirs if they already asked) ----------
-- Returns the resulting status: 'pending' or 'accepted'.

create or replace function public.send_friend_request(other_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  me       uuid := auth.uid();
  existing public.friendships%rowtype;
begin
  if me is null then
    raise exception 'You must be signed in to add friends.' using errcode = '28000';
  end if;
  if other_user is null or other_user = me then
    raise exception 'You cannot add yourself as a friend.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'That user does not exist.' using errcode = '22023';
  end if;

  select * into existing
    from public.friendships f
   where least(f.requester_id, f.addressee_id) = least(me, other_user)
     and greatest(f.requester_id, f.addressee_id) = greatest(me, other_user)
   for update;

  if not found then
    insert into public.friendships (requester_id, addressee_id)
    values (me, other_user)
    on conflict do nothing;
    return 'pending';
  end if;

  -- They already sent me a request: sending one back means "accept".
  if existing.status = 'pending' and existing.addressee_id = me then
    update public.friendships
       set status = 'accepted', responded_at = now()
     where id = existing.id;
    return 'accepted';
  end if;

  return existing.status;
end;
$$;

-- ---------- RPC: accept or decline a request sent TO me ----------

create or replace function public.respond_friend_request(other_user uuid, accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'You must be signed in.' using errcode = '28000';
  end if;

  if accept then
    update public.friendships
       set status = 'accepted', responded_at = now()
     where requester_id = other_user
       and addressee_id = me
       and status = 'pending';
  else
    delete from public.friendships
     where requester_id = other_user
       and addressee_id = me
       and status = 'pending';
  end if;

  if not found then
    raise exception 'That friend request no longer exists.' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------- RPC: unfriend, or cancel a request I sent ----------

create or replace function public.remove_friend(other_user uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.friendships
   where auth.uid() is not null
     and (
       (requester_id = auth.uid() and addressee_id = other_user)
       or (addressee_id = auth.uid() and requester_id = other_user and status = 'accepted')
     );
$$;

-- ---------- RPC: my friends + pending requests, with names ----------
-- SECURITY INVOKER, so the RLS policy above still decides which rows show up.
-- direction: 'incoming' (they asked me), 'outgoing' (I asked them),
--            null for accepted friendships.

create or replace function public.list_friendships()
returns table (
  other_user_id    uuid,
  other_user_name  text,
  status           text,
  direction        text,
  created_at       timestamptz,
  responded_at     timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    other.id,
    other.display_name,
    f.status,
    case
      when f.status = 'accepted' then null
      when f.addressee_id = auth.uid() then 'incoming'
      else 'outgoing'
    end,
    f.created_at,
    f.responded_at
  from public.friendships f
  join public.profiles other
    on other.id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  where auth.uid() in (f.requester_id, f.addressee_id)
  order by f.status desc, other.display_name;
$$;

revoke all on function public.send_friend_request(uuid)             from public, anon;
revoke all on function public.respond_friend_request(uuid, boolean) from public, anon;
revoke all on function public.remove_friend(uuid)                   from public, anon;
revoke all on function public.list_friendships()                    from public, anon;
grant execute on function public.send_friend_request(uuid)             to authenticated;
grant execute on function public.respond_friend_request(uuid, boolean) to authenticated;
grant execute on function public.remove_friend(uuid)                   to authenticated;
grant execute on function public.list_friendships()                    to authenticated;

-- ---------- Realtime ----------
-- Realtime respects RLS, so you only hear about your own friendships.
-- REPLICA IDENTITY FULL lets DELETE events carry the row's user ids so the
-- RLS check can route them (otherwise unfriend/decline wouldn't push live).

alter table public.friendships replica identity full;

do $$
begin
  begin
    alter publication supabase_realtime add table public.friendships;
  exception when duplicate_object then null;
  end;
end $$;
