-- BatchTube PRO onboarding schema
-- Run in Supabase SQL editor or migration pipeline

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  paddle_subscription_id text unique,
  status text not null default 'inactive',
  plan text not null default 'free',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_user_id_key on public.subscriptions(user_id);

create table if not exists public.usage_monthly (
  user_id uuid not null references auth.users(id) on delete cascade,
  month text not null,
  batches_count integer not null default 0,
  items_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_monthly enable row level security;

create policy if not exists "profiles_own_read"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "profiles_own_update"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy if not exists "subscriptions_own_read"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

create policy if not exists "usage_own_read"
  on public.usage_monthly
  for select
  using (auth.uid() = user_id);
