-- Run this in Supabase → SQL Editor AFTER Moneyman's first successful run
-- (Moneyman creates moneyman.transactions itself on that run).
--
-- It exposes the transactions to the app read-only, and only to the email
-- addresses you put in private.allowed_emails. Everyone else, including
-- anonymous visitors holding the public anon key, sees nothing.

-- 1. Allowlist, kept in a schema the API does not expose.
create schema if not exists private;

create table if not exists private.allowed_emails (
  email text primary key
);

-- Replace with the email you'll log in to the app with.
insert into private.allowed_emails (email)
values ('you@example.com')
on conflict do nothing;

create or replace function private.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from private.allowed_emails
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_allowed() to authenticated;

-- 2. Row-level security on Moneyman's table. Moneyman itself connects as the
--    postgres owner, so its writes are unaffected.
alter table moneyman.transactions enable row level security;

drop policy if exists "allowed users read" on moneyman.transactions;
create policy "allowed users read"
  on moneyman.transactions
  for select
  to authenticated
  using (private.is_allowed());

grant usage on schema moneyman to authenticated;
grant select on moneyman.transactions to authenticated;

-- 3. A view in the public schema (the one the API serves). security_invoker
--    makes the policy above apply to whoever queries the view. The raw JSON
--    column is left out on purpose.
create or replace view public.transactions
with (security_invoker = true) as
select
  unique_id,
  company_id,
  account,
  status,
  activity_date,
  charged_amount,
  charged_currency,
  original_amount,
  original_currency,
  description,
  memo,
  installments
from moneyman.transactions;

revoke all on public.transactions from anon;
grant select on public.transactions to authenticated;
