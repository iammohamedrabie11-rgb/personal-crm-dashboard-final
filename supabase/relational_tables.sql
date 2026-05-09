-- Relational tables migration
-- Replaces the single JSONB blob in app_snapshots with proper per-entity tables.
-- Run this AFTER app_snapshots.sql (app_snapshots table is kept as a backup).

create extension if not exists pgcrypto;

-- ─── leads ───────────────────────────────────────────────────────────────────

create table if not exists public.leads (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  client_name   text        not null default '',
  niche         text        not null default '',
  source_agency text        not null default '',
  status        text        not null default '',
  deal_value    numeric     not null default 0,
  expected_commission numeric not null default 0,
  next_follow_up_date text  not null default '',
  notes         text        not null default '',
  phone         text        not null default '',
  email         text        not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists leads_user_id_idx on public.leads(user_id);

grant select, insert, update, delete on table public.leads to authenticated;

alter table public.leads enable row level security;

drop policy if exists "leads: select own" on public.leads;
create policy "leads: select own" on public.leads
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "leads: insert own" on public.leads;
create policy "leads: insert own" on public.leads
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "leads: update own" on public.leads;
create policy "leads: update own" on public.leads
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "leads: delete own" on public.leads;
create policy "leads: delete own" on public.leads
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_leads_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_leads_updated_at();

-- ─── income_entries ──────────────────────────────────────────────────────────

create table if not exists public.income_entries (
  id        uuid        primary key default gen_random_uuid(),
  user_id   uuid        not null references auth.users(id) on delete cascade,
  source    text        not null default '',
  amount    numeric     not null default 0,
  date      text        not null default '',
  lead_id   uuid        references public.leads(id) on delete set null,
  notes     text        not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists income_entries_user_id_idx on public.income_entries(user_id);

grant select, insert, update, delete on table public.income_entries to authenticated;

alter table public.income_entries enable row level security;

drop policy if exists "income_entries: select own" on public.income_entries;
create policy "income_entries: select own" on public.income_entries
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "income_entries: insert own" on public.income_entries;
create policy "income_entries: insert own" on public.income_entries
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "income_entries: update own" on public.income_entries;
create policy "income_entries: update own" on public.income_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "income_entries: delete own" on public.income_entries;
create policy "income_entries: delete own" on public.income_entries
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_income_entries_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists income_entries_set_updated_at on public.income_entries;
create trigger income_entries_set_updated_at
  before update on public.income_entries
  for each row execute function public.set_income_entries_updated_at();

-- ─── finance_accounts ────────────────────────────────────────────────────────

create table if not exists public.finance_accounts (
  id      uuid    primary key default gen_random_uuid(),
  user_id uuid    not null references auth.users(id) on delete cascade,
  name    text    not null default '',
  type    text    not null default '',
  balance numeric not null default 0,
  notes   text    not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_accounts_user_id_idx on public.finance_accounts(user_id);

grant select, insert, update, delete on table public.finance_accounts to authenticated;

alter table public.finance_accounts enable row level security;

drop policy if exists "finance_accounts: select own" on public.finance_accounts;
create policy "finance_accounts: select own" on public.finance_accounts
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "finance_accounts: insert own" on public.finance_accounts;
create policy "finance_accounts: insert own" on public.finance_accounts
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "finance_accounts: update own" on public.finance_accounts;
create policy "finance_accounts: update own" on public.finance_accounts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "finance_accounts: delete own" on public.finance_accounts;
create policy "finance_accounts: delete own" on public.finance_accounts
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.set_finance_accounts_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists finance_accounts_set_updated_at on public.finance_accounts;
create trigger finance_accounts_set_updated_at
  before update on public.finance_accounts
  for each row execute function public.set_finance_accounts_updated_at();

-- ─── finance_expenses ────────────────────────────────────────────────────────

create table if not exists public.finance_expenses (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    not null references auth.users(id) on delete cascade,
  date       text    not null default '',
  category   text    not null default '',
  description text   not null default '',
  amount     numeric not null default 0,
  account_id uuid    references public.finance_accounts(id) on delete set null,
  status     text    not null default '',
  notes      text    not null default '',
  created_at timestamptz not null default now()
);

create index if not exists finance_expenses_user_id_idx on public.finance_expenses(user_id);

grant select, insert, update, delete on table public.finance_expenses to authenticated;

alter table public.finance_expenses enable row level security;

drop policy if exists "finance_expenses: select own" on public.finance_expenses;
create policy "finance_expenses: select own" on public.finance_expenses
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "finance_expenses: insert own" on public.finance_expenses;
create policy "finance_expenses: insert own" on public.finance_expenses
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "finance_expenses: update own" on public.finance_expenses;
create policy "finance_expenses: update own" on public.finance_expenses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "finance_expenses: delete own" on public.finance_expenses;
create policy "finance_expenses: delete own" on public.finance_expenses
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── finance_budgets ─────────────────────────────────────────────────────────

create table if not exists public.finance_budgets (
  id       uuid    primary key default gen_random_uuid(),
  user_id  uuid    not null references auth.users(id) on delete cascade,
  category text    not null default '',
  amount   numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists finance_budgets_user_id_idx on public.finance_budgets(user_id);

grant select, insert, update, delete on table public.finance_budgets to authenticated;

alter table public.finance_budgets enable row level security;

drop policy if exists "finance_budgets: select own" on public.finance_budgets;
create policy "finance_budgets: select own" on public.finance_budgets
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "finance_budgets: insert own" on public.finance_budgets;
create policy "finance_budgets: insert own" on public.finance_budgets
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "finance_budgets: update own" on public.finance_budgets;
create policy "finance_budgets: update own" on public.finance_budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "finance_budgets: delete own" on public.finance_budgets;
create policy "finance_budgets: delete own" on public.finance_budgets
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─── planned_payments ────────────────────────────────────────────────────────

create table if not exists public.planned_payments (
  id         uuid    primary key default gen_random_uuid(),
  user_id    uuid    not null references auth.users(id) on delete cascade,
  name       text    not null default '',
  amount     numeric not null default 0,
  due_date   text    not null default '',
  category   text    not null default '',
  account_id uuid    references public.finance_accounts(id) on delete set null,
  status     text    not null default '',
  notes      text    not null default '',
  created_at timestamptz not null default now()
);

create index if not exists planned_payments_user_id_idx on public.planned_payments(user_id);

grant select, insert, update, delete on table public.planned_payments to authenticated;

alter table public.planned_payments enable row level security;

drop policy if exists "planned_payments: select own" on public.planned_payments;
create policy "planned_payments: select own" on public.planned_payments
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "planned_payments: insert own" on public.planned_payments;
create policy "planned_payments: insert own" on public.planned_payments
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "planned_payments: update own" on public.planned_payments;
create policy "planned_payments: update own" on public.planned_payments
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "planned_payments: delete own" on public.planned_payments;
create policy "planned_payments: delete own" on public.planned_payments
  for delete to authenticated using ((select auth.uid()) = user_id);
