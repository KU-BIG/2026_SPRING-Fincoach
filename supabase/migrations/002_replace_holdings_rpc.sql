-- 002_replace_holdings_rpc.sql
--
-- Atomic replace of the caller's holdings in a single transaction. Closes the two-tab race
-- (H2): the client save was a non-transactional upsert -> re-select all -> diff-delete, so two
-- tabs of the same user saving concurrently could compute a stale delete-diff and remove a row
-- the other tab had just legitimately saved. Doing the whole replace inside one function makes
-- it atomic.
--
-- Runs as the caller (security invoker) so RLS still applies; user_id comes from auth.uid(),
-- never from the client payload. p_holdings is a JSON array of
--   {ticker, name, shares, avg_price, currency}
-- (no user_id). An empty array clears all of the caller's holdings.
--
-- Apply once in the Supabase SQL editor (like schema.sql). Until it exists, the web client
-- falls back to the previous upsert+diff-delete path, so nothing breaks before it is applied.

create or replace function public.replace_holdings(p_holdings jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.holdings h
  where h.user_id = auth.uid()
    and h.ticker not in (
      select x->>'ticker' from jsonb_array_elements(coalesce(p_holdings, '[]'::jsonb)) x
      where coalesce(x->>'ticker', '') <> ''
    );

  insert into public.holdings (user_id, ticker, name, shares, avg_price, currency, updated_at)
  select auth.uid(),
         x->>'ticker',
         coalesce(x->>'name', ''),
         coalesce((x->>'shares')::numeric, 0),
         coalesce((x->>'avg_price')::numeric, 0),
         coalesce(nullif(x->>'currency', ''), 'KRW'),
         now()
  from jsonb_array_elements(coalesce(p_holdings, '[]'::jsonb)) x
  where coalesce(x->>'ticker', '') <> ''
  on conflict (user_id, ticker) do update
    set name = excluded.name,
        shares = excluded.shares,
        avg_price = excluded.avg_price,
        currency = excluded.currency,
        updated_at = now();
end;
$$;

grant execute on function public.replace_holdings(jsonb) to authenticated;
