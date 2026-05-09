create extension if not exists pgcrypto;

create table if not exists public.app_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crm jsonb not null default '{}'::jsonb,
  finance jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists app_snapshots_user_id_idx
  on public.app_snapshots(user_id);

grant select, insert, update, delete
  on table public.app_snapshots
  to authenticated;

alter table public.app_snapshots enable row level security;

drop policy if exists "Users can view their own snapshot"
  on public.app_snapshots;

create policy "Users can view their own snapshot"
  on public.app_snapshots
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own snapshot"
  on public.app_snapshots;

create policy "Users can insert their own snapshot"
  on public.app_snapshots
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own snapshot"
  on public.app_snapshots;

create policy "Users can update their own snapshot"
  on public.app_snapshots
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own snapshot"
  on public.app_snapshots;

create policy "Users can delete their own snapshot"
  on public.app_snapshots
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_app_snapshots_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists app_snapshots_set_updated_at
  on public.app_snapshots;

create trigger app_snapshots_set_updated_at
before update on public.app_snapshots
for each row
execute function public.set_app_snapshots_updated_at();
