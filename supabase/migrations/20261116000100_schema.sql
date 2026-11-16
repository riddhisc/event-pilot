-- EventBuddy tenant schema. Source of truth for the data model.
-- Login and Auth hooks are intentionally not part of this migration.

create extension if not exists pgcrypto;

do $$
begin
  create extension if not exists supabase_vault with schema vault;
exception
  when insufficient_privilege or undefined_file or feature_not_supported then
    raise notice 'vault extension was not created in this database';
end $$;

create type public.app_role as enum ('admin', 'staff', 'fde');
create type public.profile_status as enum ('invited', 'active', 'disabled');
create type public.event_type as enum ('in_person', 'virtual', 'hybrid');
create type public.event_status as enum ('draft', 'published', 'cancelled', 'completed');
create type public.rsvp_status as enum ('going', 'maybe', 'declined', 'waitlist');
create type public.integration_status as enum ('pending', 'active', 'error');
create type public.import_kind as enum ('staff', 'events');
create type public.task_status as enum ('pending', 'in_progress', 'done');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan text not null default 'team',
  brand_color text not null default '#0f766e',
  logo_path text,
  settings jsonb not null default '{}'::jsonb,
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'staff',
  department text,
  title text,
  interests text[] not null default '{}',
  avatar_path text,
  status public.profile_status not null default 'invited',
  created_at timestamptz not null default now()
);

create table public.fde_assignments (
  id uuid primary key default gen_random_uuid(),
  fde_user_id uuid not null references public.profiles (id) on delete cascade,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (fde_user_id, tenant_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  description text not null default '',
  type public.event_type not null default 'in_person',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'UTC',
  location text not null default '',
  meeting_url text,
  capacity integer not null default 1 check (capacity > 0),
  waitlist_enabled boolean not null default true,
  recurrence_rule text,
  status public.event_status not null default 'draft',
  created_by uuid references public.profiles (id),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.rsvp_status not null,
  checked_in_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_a uuid not null references public.profiles (id) on delete cascade,
  user_b uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.events (id) on delete set null,
  created_at timestamptz not null default now(),
  check (user_a <> user_b)
);

create table public.integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  provider text not null,
  status public.integration_status not null default 'pending',
  config jsonb not null default '{}'::jsonb,
  secret_ref uuid,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (tenant_id, provider)
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  integration_id uuid not null references public.integrations (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  stats jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  url text not null,
  secret_ref uuid,
  events text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  endpoint_id uuid not null references public.webhook_endpoints (id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  status_code integer,
  attempts integer not null default 0,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  kind public.import_kind not null,
  status text not null default 'pending',
  dry_run boolean not null default true,
  file_path text,
  report jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  key text not null,
  title text not null,
  status public.task_status not null default 'pending',
  owner uuid references public.profiles (id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants (id) on delete cascade,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

create table public.config_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (tenant_id, version)
);

create index events_tenant_starts_idx on public.events (tenant_id, starts_at);
create index rsvps_tenant_event_idx on public.rsvps (tenant_id, event_id);
create index chat_tenant_event_idx on public.chat_messages (tenant_id, event_id);
create index notifications_tenant_user_read_idx on public.notifications (tenant_id, user_id, read_at);

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
  alter publication supabase_realtime add table public.notifications;
exception
  when undefined_object or duplicate_object then
    raise notice 'realtime publication was left unchanged';
end $$;
