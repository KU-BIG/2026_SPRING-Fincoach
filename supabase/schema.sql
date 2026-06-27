-- FinCoach per-user schema. Run once in Supabase -> SQL Editor.
-- Tables are owned by auth.users (Supabase Auth). Row Level Security ensures a
-- user can only read/write their own rows, enforced at the database layer.

-- ── holdings: a user's portfolio positions ──────────────────────────────────
create table if not exists public.holdings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  ticker     text not null,                       -- e.g. 005930.KS, AAPL
  name       text not null,                       -- display name
  shares     numeric not null default 0,          -- quantity held
  avg_price  numeric not null default 0,          -- average buy price (per share)
  currency   text not null default 'KRW',         -- avg_price currency
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists holdings_user_id_idx on public.holdings (user_id);

-- ── conversations: chat session per user ────────────────────────────────────
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '새 대화',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_updated_idx
  on public.conversations (user_id, updated_at desc);

-- ── chat_messages: a user's coach conversation history ──────────────────────
create table if not exists public.chat_messages (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists chat_messages_user_id_created_idx
  on public.chat_messages (user_id, created_at);
create index if not exists chat_messages_conv_id_idx
  on public.chat_messages (conversation_id, created_at);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.holdings enable row level security;
alter table public.chat_messages enable row level security;

-- holdings: owner-only access
drop policy if exists "holdings_select_own" on public.holdings;
create policy "holdings_select_own" on public.holdings
  for select using (auth.uid() = user_id);

drop policy if exists "holdings_insert_own" on public.holdings;
create policy "holdings_insert_own" on public.holdings
  for insert with check (auth.uid() = user_id);

drop policy if exists "holdings_update_own" on public.holdings;
create policy "holdings_update_own" on public.holdings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "holdings_delete_own" on public.holdings;
create policy "holdings_delete_own" on public.holdings
  for delete using (auth.uid() = user_id);

-- conversations: owner-only access
alter table public.conversations enable row level security;

drop policy if exists "conversations_select_own" on public.conversations;
create policy "conversations_select_own" on public.conversations
  for select using (auth.uid() = user_id);

drop policy if exists "conversations_insert_own" on public.conversations;
create policy "conversations_insert_own" on public.conversations
  for insert with check (auth.uid() = user_id);

drop policy if exists "conversations_update_own" on public.conversations;
create policy "conversations_update_own" on public.conversations
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "conversations_delete_own" on public.conversations;
create policy "conversations_delete_own" on public.conversations
  for delete using (auth.uid() = user_id);

-- chat_messages: owner-only access
drop policy if exists "chat_select_own" on public.chat_messages;
create policy "chat_select_own" on public.chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "chat_insert_own" on public.chat_messages;
create policy "chat_insert_own" on public.chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "chat_delete_own" on public.chat_messages;
create policy "chat_delete_own" on public.chat_messages
  for delete using (auth.uid() = user_id);

-- ── keep updated_at fresh on holdings ───────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists holdings_touch_updated_at on public.holdings;
create trigger holdings_touch_updated_at
  before update on public.holdings
  for each row execute function public.touch_updated_at();

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();
