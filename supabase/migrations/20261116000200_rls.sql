-- RLS helpers and default-deny policies. Secrets stay off the client grants.

create or replace function public.auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'tenant_id', '')::uuid,
    (select p.tenant_id from public.profiles p where p.id = auth.uid())
  );
$$;

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'app_role', ''),
    (select p.role::text from public.profiles p where p.id = auth.uid())
  );
$$;

create or replace function public.is_assigned_fde(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fde_assignments a
    where a.fde_user_id = auth.uid()
      and a.tenant_id = target
  );
$$;

create or replace function public.can_access_tenant(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target is not null
    and (target = public.auth_tenant_id() or public.is_assigned_fde(target));
$$;

create or replace function public.is_tenant_admin(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'admin' and target = public.auth_tenant_id();
$$;

revoke all on function public.auth_tenant_id() from public;
revoke all on function public.auth_role() from public;
revoke all on function public.is_assigned_fde(uuid) from public;
revoke all on function public.can_access_tenant(uuid) from public;
revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.auth_tenant_id() to authenticated, service_role;
grant execute on function public.auth_role() to authenticated, service_role;
grant execute on function public.is_assigned_fde(uuid) to authenticated, service_role;
grant execute on function public.can_access_tenant(uuid) to authenticated, service_role;
grant execute on function public.is_tenant_admin(uuid) to authenticated, service_role;

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.fde_assignments enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.feedback enable row level security;
alter table public.connections enable row level security;
alter table public.integrations enable row level security;
alter table public.sync_runs enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.import_jobs enable row level security;
alter table public.onboarding_tasks enable row level security;
alter table public.audit_log enable row level security;
alter table public.config_versions enable row level security;

alter table public.audit_log force row level security;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;

revoke select (secret_ref) on public.integrations from authenticated, anon;
revoke insert (secret_ref), update (secret_ref) on public.integrations from authenticated, anon;
revoke select (secret_ref) on public.webhook_endpoints from authenticated, anon;
revoke insert (secret_ref), update (secret_ref) on public.webhook_endpoints from authenticated, anon;
revoke insert, update, delete on public.audit_log from authenticated, anon;

create policy tenants_select on public.tenants
  for select to authenticated
  using (id = public.auth_tenant_id() or public.is_assigned_fde(id));

create policy tenants_update on public.tenants
  for update to authenticated
  using (public.is_tenant_admin(id) or public.is_assigned_fde(id))
  with check (public.is_tenant_admin(id) or public.is_assigned_fde(id));

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.can_access_tenant(tenant_id));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (id = auth.uid() or public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy fde_assignments_select on public.fde_assignments
  for select to authenticated
  using (fde_user_id = auth.uid() or public.is_assigned_fde(tenant_id));

create policy events_select on public.events
  for select to authenticated
  using (
    public.can_access_tenant(tenant_id)
    and (
      status = 'published'
      or public.is_tenant_admin(tenant_id)
      or public.is_assigned_fde(tenant_id)
    )
  );

create policy events_write on public.events
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy rsvps_select on public.rsvps
  for select to authenticated
  using (
    (public.can_access_tenant(tenant_id) and user_id = auth.uid())
    or public.is_tenant_admin(tenant_id)
    or public.is_assigned_fde(tenant_id)
  );

create policy rsvps_insert on public.rsvps
  for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and user_id = auth.uid());

create policy rsvps_update on public.rsvps
  for update to authenticated
  using (tenant_id = public.auth_tenant_id() and user_id = auth.uid())
  with check (tenant_id = public.auth_tenant_id() and user_id = auth.uid());

create policy chat_select on public.chat_messages
  for select to authenticated
  using (public.can_access_tenant(tenant_id));

create policy chat_insert on public.chat_messages
  for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and user_id = auth.uid());

create policy notifications_select on public.notifications
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_tenant_admin(tenant_id)
    or public.is_assigned_fde(tenant_id)
  );

create policy notifications_update on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy feedback_select on public.feedback
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_tenant_admin(tenant_id)
    or public.is_assigned_fde(tenant_id)
  );

create policy feedback_write on public.feedback
  for insert to authenticated
  with check (tenant_id = public.auth_tenant_id() and user_id = auth.uid());

create policy connections_all on public.connections
  for all to authenticated
  using (public.can_access_tenant(tenant_id) and (user_a = auth.uid() or user_b = auth.uid() or public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id)))
  with check (tenant_id = public.auth_tenant_id() and (user_a = auth.uid() or user_b = auth.uid()));

create policy integrations_all on public.integrations
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy sync_runs_select on public.sync_runs
  for select to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy webhooks_all on public.webhook_endpoints
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy deliveries_select on public.webhook_deliveries
  for select to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy imports_all on public.import_jobs
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy onboarding_all on public.onboarding_tasks
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy audit_select on public.audit_log
  for select to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));

create policy config_all on public.config_versions
  for all to authenticated
  using (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id))
  with check (public.is_tenant_admin(tenant_id) or public.is_assigned_fde(tenant_id));
