-- =============================================================
-- UniMarket: account-to-account messaging
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- Model
--   conversations : one thread per pair of users (user_a < user_b)
--   messages      : rows in a thread; optionally reference the listing
--                   the message is about ("Is this still available?")
--
-- Security model (all enforced by Postgres, not the frontend)
--   * Only the two participants can see a conversation or its messages.
--   * You can only send messages as yourself, into a thread you belong to.
--   * Messages are immutable from the client: no UPDATE/DELETE grants.
--     Read receipts go through mark_conversation_read(), which only
--     touches read_at on messages sent TO you.
--   * Threads are created only through start_conversation(), which
--     refuses to create a thread with yourself or a non-existent user.
-- =============================================================

-- ---------- Tables ----------

create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  user_a           uuid not null references public.profiles(id) on delete cascade,
  user_b           uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  constraint conversations_ordered_pair check (user_a < user_b),
  constraint conversations_unique_pair unique (user_a, user_b)
);

create index if not exists conversations_user_a_idx on public.conversations (user_a, last_message_at desc);
create index if not exists conversations_user_b_idx on public.conversations (user_b, last_message_at desc);

create table if not exists public.messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.conversations(id) on delete cascade,
  sender_id        uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  listing_id       uuid references public.listings(id) on delete set null,
  body             text not null,
  created_at       timestamptz not null default now(),
  read_at          timestamptz,
  constraint messages_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

-- ---------- Helper: is the current user in this conversation? ----------
-- SECURITY DEFINER so policies on messages can check membership without
-- recursing through the conversations policy.

create or replace function public.is_conversation_member(conv_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv_id
      and auth.uid() in (c.user_a, c.user_b)
  );
$$;

-- ---------- Row Level Security ----------

alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

drop policy if exists "members read conversations" on public.conversations;
create policy "members read conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() in (user_a, user_b));

drop policy if exists "members read messages" on public.messages;
create policy "members read messages"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

drop policy if exists "members send messages" on public.messages;
create policy "members send messages"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and read_at is null
    and public.is_conversation_member(conversation_id)
  );

-- Lock down what the client role can do at the privilege level too.
-- Conversations are created only via start_conversation(); messages are
-- insert-only; read receipts only via mark_conversation_read().
revoke all on public.conversations from anon, authenticated;
revoke all on public.messages      from anon, authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, body, listing_id) on public.messages to authenticated;

-- ---------- Keep last_message_at fresh ----------

create or replace function public.bump_conversation_timestamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation on public.messages;
create trigger messages_bump_conversation
  after insert on public.messages
  for each row execute function public.bump_conversation_timestamp();

-- ---------- RPC: start (or reopen) a conversation with another user ----------

create or replace function public.start_conversation(other_user uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  me     uuid := auth.uid();
  a      uuid;
  b      uuid;
  conv   uuid;
begin
  if me is null then
    raise exception 'You must be signed in to send messages.' using errcode = '28000';
  end if;
  if other_user is null or other_user = me then
    raise exception 'You cannot message yourself.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = other_user) then
    raise exception 'That user does not exist.' using errcode = '22023';
  end if;

  a := least(me, other_user);
  b := greatest(me, other_user);

  insert into public.conversations (user_a, user_b)
  values (a, b)
  on conflict (user_a, user_b) do nothing
  returning id into conv;

  if conv is null then
    select id into conv from public.conversations where user_a = a and user_b = b;
  end if;

  return conv;
end;
$$;

-- ---------- RPC: mark everything sent to me in a thread as read ----------

create or replace function public.mark_conversation_read(conv_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.messages
     set read_at = now()
   where conversation_id = conv_id
     and sender_id <> auth.uid()
     and read_at is null
     and public.is_conversation_member(conv_id);
$$;

-- ---------- RPC: inbox list with the other person's name + unread count ----------
-- SECURITY INVOKER, so RLS above still decides which rows are visible.

create or replace function public.list_conversations()
returns table (
  id               uuid,
  other_user_id    uuid,
  other_user_name  text,
  last_message     text,
  last_sender_id   uuid,
  last_message_at  timestamptz,
  unread_count     bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    other.id,
    other.display_name,
    lm.body,
    lm.sender_id,
    c.last_message_at,
    (select count(*) from public.messages m
      where m.conversation_id = c.id
        and m.sender_id <> auth.uid()
        and m.read_at is null)
  from public.conversations c
  join public.profiles other
    on other.id = case when c.user_a = auth.uid() then c.user_b else c.user_a end
  left join lateral (
    select m.body, m.sender_id
      from public.messages m
     where m.conversation_id = c.id
     order by m.created_at desc
     limit 1
  ) lm on true
  where auth.uid() in (c.user_a, c.user_b)
  order by c.last_message_at desc;
$$;

revoke all on function public.start_conversation(uuid)     from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.list_conversations()         from public, anon;
revoke all on function public.is_conversation_member(uuid) from public, anon;
grant execute on function public.start_conversation(uuid)     to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.list_conversations()         to authenticated;
grant execute on function public.is_conversation_member(uuid) to authenticated;

-- ---------- Realtime ----------
-- Realtime respects RLS, so subscribers only receive their own threads.

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null;
  end;
end $$;
