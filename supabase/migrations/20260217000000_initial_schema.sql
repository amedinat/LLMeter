-- LLMeter Initial Schema
-- Creates all tables for Phase 1 MVP with Row Level Security

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team', 'enterprise')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Providers ────────────────────────────────────────────
create table public.providers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null check (provider in ('openai', 'anthropic', 'google', 'deepseek')),
  display_name text,
  api_key_encrypted text not null,
  api_key_iv text not null,
  api_key_tag text not null,
  config jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'error', 'disconnected', 'syncing')),
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One active connection per provider per user
  unique(user_id, provider)
);

create index idx_providers_user_id on public.providers(user_id);

alter table public.providers enable row level security;

create policy "Users can view own providers"
  on public.providers for select
  using (auth.uid() = user_id);

create policy "Users can insert own providers"
  on public.providers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own providers"
  on public.providers for update
  using (auth.uid() = user_id);

create policy "Users can delete own providers"
  on public.providers for delete
  using (auth.uid() = user_id);

-- ─── Usage Records ───────────────────────────────────────
create table public.usage_records (
  id bigint generated always as identity primary key,
  provider_id uuid not null references public.providers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  model text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  requests integer not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One record per provider/date/model combination (for upsert)
  unique(provider_id, date, model)
);

create index idx_usage_records_user_date on public.usage_records(user_id, date desc);
create index idx_usage_records_provider_date on public.usage_records(provider_id, date desc);

alter table public.usage_records enable row level security;

create policy "Users can view own usage records"
  on public.usage_records for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage records"
  on public.usage_records for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage records"
  on public.usage_records for update
  using (auth.uid() = user_id);

-- ─── Alerts ──────────────────────────────────────────────
create table public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('budget_limit', 'anomaly', 'daily_threshold')),
  name text not null,
  config jsonb not null default '{}',
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_alerts_user_id on public.alerts(user_id);

alter table public.alerts enable row level security;

create policy "Users can view own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own alerts"
  on public.alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.alerts for delete
  using (auth.uid() = user_id);

-- ─── Alert Events ────────────────────────────────────────
create table public.alert_events (
  id bigint generated always as identity primary key,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  data jsonb not null default '{}',
  dismissed boolean not null default false,
  dismissed_at timestamptz,
  sent_at timestamptz not null default now()
);

create index idx_alert_events_user_id on public.alert_events(user_id, sent_at desc);

alter table public.alert_events enable row level security;

create policy "Users can view own alert events"
  on public.alert_events for select
  using (auth.uid() = user_id);

create policy "Users can update own alert events"
  on public.alert_events for update
  using (auth.uid() = user_id);

-- ─── Optimization Suggestions (Phase 2, but schema ready) ──
create table public.optimization_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  model_current text not null,
  model_suggested text not null,
  monthly_requests integer not null default 0,
  current_cost_usd numeric(10, 2) not null default 0,
  suggested_cost_usd numeric(10, 2) not null default 0,
  savings_pct numeric(5, 2) not null default 0,
  reasoning text not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'dismissed')),
  created_at timestamptz not null default now()
);

create index idx_optimization_suggestions_user on public.optimization_suggestions(user_id);

alter table public.optimization_suggestions enable row level security;

create policy "Users can view own suggestions"
  on public.optimization_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can update own suggestions"
  on public.optimization_suggestions for update
  using (auth.uid() = user_id);

-- ─── Updated_at triggers ─────────────────────────────────
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.providers
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.usage_records
  for each row execute function public.update_updated_at();

create trigger set_updated_at before update on public.alerts
  for each row execute function public.update_updated_at();
