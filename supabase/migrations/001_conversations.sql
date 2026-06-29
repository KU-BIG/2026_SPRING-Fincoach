-- FinCoach — conversations / chat session migration (#131, #135)
-- Apply once in Supabase -> SQL Editor. Idempotent (safe to re-run).
--
-- WHY a separate migration (not just re-running schema.sql):
-- schema.sql uses `create table if not exists`, which is a NO-OP for the
-- chat_messages table that already exists from #128. Re-running schema.sql
-- therefore does NOT add the new conversation_id column on the existing prod DB.
-- This migration uses ALTER ... ADD COLUMN IF NOT EXISTS to close that gap.
-- Without it, chat sessions break in prod (loadConversation filters on a column
-- that does not exist).

-- 1) conversations table (new)
create table if not exists public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '새 대화',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_user_id_updated_idx
  on public.conversations (user_id, updated_at desc);

-- 2) chat_messages.conversation_id — table pre-exists (#128), so ALTER, not create
alter table public.chat_messages
  add column if not exists conversation_id uuid
  references public.conversations (id) on delete cascade;

create index if not exists chat_messages_conv_id_idx
  on public.chat_messages (conversation_id, created_at);

-- 3) conversations RLS (owner-only)
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

-- 4) updated_at trigger for conversations
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();

-- ── verification (run after applying) ───────────────────────────────────────
-- Expect 1 row (column now exists):
--   select column_name from information_schema.columns
--    where table_name = 'chat_messages' and column_name = 'conversation_id';
-- Expect the conversations table + policies:
--   select tablename, policyname from pg_policies where tablename = 'conversations';
