-- Product RPCs, waitlist, config versions, and secret reads.
-- read_integration_secret is service_role only and never granted to the browser.

create or replace function public.next_config_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.version is null then
    select coalesce(max(version), 0) + 1 into new.version
    from public.config_versions
    where tenant_id = new.tenant_id;
  end if;
  return new;
end;
$$;

create trigger config_versions_version
  before insert on public.config_versions
  for each row execute function public.next_config_version();

create or replace function public.enforce_rsvp_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cap integer;
  waitlist_on boolean;
  going_count integer;
begin
  select capacity, waitlist_enabled into cap, waitlist_on
  from public.events where id = new.event_id;
  if new.status = 'going' and waitlist_on then
    select count(*) into going_count
    from public.rsvps
    where event_id = new.event_id
      and status = 'going'
      and id is distinct from new.id;
    if going_count >= cap then
      new.status := 'waitlist';
    end if;
  end if;
  return new;
end;
$$;

create trigger rsvps_capacity
  before insert or update of status on public.rsvps
  for each row execute function public.enforce_rsvp_capacity();

create or replace function public.promote_from_waitlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_row public.rsvps;
  event_title text;
begin
  if old.status = 'going' and new.status is distinct from 'going' then
    select * into next_row
    from public.rsvps
    where event_id = new.event_id and status = 'waitlist'
    order by created_at
    limit 1;
    if next_row.id is not null then
      update public.rsvps set status = 'going' where id = next_row.id;
      select title into event_title from public.events where id = new.event_id;
      insert into public.notifications (tenant_id, user_id, type, payload)
      values (
        next_row.tenant_id,
        next_row.user_id,
        'waitlist',
        jsonb_build_object(
          'message', 'A seat opened for ' || coalesce(event_title, 'an event') || '. You are now going.',
          'event_id', new.event_id
        )
      );
    end if;
  end if;
  return new;
end;
$$;

create trigger rsvps_promote
  after update of status on public.rsvps
  for each row execute function public.promote_from_waitlist();

create or replace function public.write_audit(
  target_tenant uuid,
  action text,
  entity text,
  entity_id text,
  diff jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (tenant_id, actor_id, action, entity, entity_id, diff)
  values (target_tenant, auth.uid(), action, entity, entity_id, coalesce(diff, '{}'::jsonb));
end;
$$;

revoke all on function public.write_audit(uuid, text, text, text, jsonb) from public;
grant execute on function public.write_audit(uuid, text, text, text, jsonb) to authenticated, service_role;

create or replace function public.provision_tenant(
  tenant_name text,
  tenant_slug text,
  tenant_settings jsonb,
  tenant_flags jsonb
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  created public.tenants;
begin
  if public.auth_role() not in ('fde', 'admin') then
    raise exception 'Only an FDE or admin can provision a tenant';
  end if;
  insert into public.tenants (name, slug, settings, feature_flags)
  values (tenant_name, tenant_slug, coalesce(tenant_settings, '{}'::jsonb), coalesce(tenant_flags, '{}'::jsonb))
  returning * into created;

  insert into public.onboarding_tasks (tenant_id, key, title, status, completed_at)
  values
    (created.id, 'create', 'Create tenant', 'done', now()),
    (created.id, 'sso', 'Configure SSO', 'pending', null),
    (created.id, 'import', 'Import staff', 'pending', null),
    (created.id, 'integrations', 'Connect Slack and calendar', 'pending', null),
    (created.id, 'branding', 'Branding and templates', 'pending', null),
    (created.id, 'test_event', 'Create and run a test event', 'pending', null),
    (created.id, 'golive', 'Go-live sign-off', 'pending', null);

  insert into public.config_versions (tenant_id, snapshot, created_by)
  values (
    created.id,
    jsonb_build_object('settings', created.settings, 'feature_flags', created.feature_flags),
    auth.uid()
  );

  if public.auth_role() = 'fde' then
    insert into public.fde_assignments (fde_user_id, tenant_id)
    values (auth.uid(), created.id)
    on conflict (fde_user_id, tenant_id) do nothing;
  end if;

  perform public.write_audit(created.id, 'tenant.create', 'tenants', created.id::text, '{}'::jsonb);
  return created;
end;
$$;

revoke all on function public.provision_tenant(text, text, jsonb, jsonb) from public;
grant execute on function public.provision_tenant(text, text, jsonb, jsonb) to authenticated, service_role;

create or replace function public.feedback_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'eventName', e.title,
    'rating', f.rating
  )), '[]'::jsonb)
  from public.feedback f
  join public.events e on e.id = f.event_id;
$$;

create or replace function public.participation_by_month()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(row_to_json(s)), '[]'::jsonb)
  from (
    select
      to_char(date_trunc('month', e.starts_at), 'Mon') as name,
      sum(e.capacity) as invites,
      count(r.id) filter (where r.status = 'going') as attendees
    from public.events e
    left join public.rsvps r on r.event_id = e.id
    group by date_trunc('month', e.starts_at)
    order by date_trunc('month', e.starts_at)
  ) s;
$$;

create or replace function public.engagement_by_department()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'date', department,
    'engagementScore', engagement
  )), '[]'::jsonb)
  from (
    select
      coalesce(p.department, 'General') as department,
      round(avg(case when r.status = 'going' then 100 else 40 end))::int as engagement
    from public.profiles p
    left join public.rsvps r on r.user_id = p.id
    group by coalesce(p.department, 'General')
  ) s;
$$;

create or replace function public.analytics_summary()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  avg_participation numeric;
begin
  select coalesce(round(avg(going::numeric / nullif(capacity, 0) * 100)), 0)
  into avg_participation
  from (
    select e.capacity,
      (select count(*) from public.rsvps r where r.event_id = e.id and r.status = 'going') as going
    from public.events e
  ) rows;

  return jsonb_build_object(
    'totalEvents', (select count(*) from public.events),
    'upcomingEvents', (select count(*) from public.events where status = 'published' and starts_at > now()),
    'pastEvents', (select count(*) from public.events where status = 'completed' or ends_at <= now()),
    'totalStaff', (select count(*) from public.profiles),
    'avgParticipation', avg_participation,
    'participationData', public.participation_by_month(),
    'engagementData', public.engagement_by_department(),
    'recentParticipants', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', full_name, 'email', email)), '[]'::jsonb)
      from (select id, full_name, email from public.profiles order by full_name limit 5) people
    ),
    'feedbackData', public.feedback_summary()
  );
end;
$$;

create or replace function public.networking_suggestions(target_user uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', other.id,
    'name', other.full_name,
    'email', other.email,
    'title', other.title,
    'department', other.department,
    'commonInterests', (
      select coalesce(jsonb_agg(interest), '[]'::jsonb)
      from unnest(other.interests) interest
      where interest = any (me.interests)
    ),
    'commonEvents', (
      select coalesce(jsonb_agg(e.title), '[]'::jsonb)
      from public.rsvps mine
      join public.rsvps theirs on theirs.event_id = mine.event_id and theirs.user_id = other.id
      join public.events e on e.id = mine.event_id
      where mine.user_id = me.id and mine.status = 'going' and theirs.status = 'going'
    )
  )), '[]'::jsonb)
  from public.profiles me
  join public.profiles other
    on other.tenant_id = me.tenant_id
   and other.id <> me.id
   and other.role <> 'fde'
  where me.id = target_user
    and (
      other.department = me.department
      or other.interests && me.interests
      or exists (
        select 1
        from public.rsvps mine
        join public.rsvps theirs on theirs.event_id = mine.event_id
        where mine.user_id = me.id and theirs.user_id = other.id
      )
    );
$$;

grant execute on function public.analytics_summary() to authenticated, service_role;
grant execute on function public.participation_by_month() to authenticated, service_role;
grant execute on function public.engagement_by_department() to authenticated, service_role;
grant execute on function public.feedback_summary() to authenticated, service_role;
grant execute on function public.networking_suggestions(uuid) to authenticated, service_role;

create or replace function public.read_integration_secret(integration_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  ref uuid;
  secret text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user <> 'service_role' then
    raise exception 'integration secrets are not readable from the client';
  end if;
  select secret_ref into ref from public.integrations where id = integration_id;
  if ref is null then
    return null;
  end if;
  begin
    execute 'select decrypted_secret from vault.decrypted_secrets where id = $1'
      into secret
      using ref;
  exception
    when undefined_table then
      raise exception 'vault is not installed; secret_ref % cannot be resolved', ref;
  end;
  return secret;
end;
$$;

revoke all on function public.read_integration_secret(uuid) from public, anon, authenticated;
grant execute on function public.read_integration_secret(uuid) to service_role;

create or replace function public.read_vault_secret(ref uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text;
begin
  if coalesce(auth.role(), '') <> 'service_role' and current_user <> 'service_role' then
    raise exception 'vault secrets are not readable from the client';
  end if;
  if ref is null then
    return null;
  end if;
  begin
    execute 'select decrypted_secret from vault.decrypted_secrets where id = $1'
      into secret
      using ref;
  exception
    when undefined_table then
      raise exception 'vault is not installed; secret_ref % cannot be resolved', ref;
  end;
  return secret;
end;
$$;

revoke all on function public.read_vault_secret(uuid) from public, anon, authenticated;
grant execute on function public.read_vault_secret(uuid) to service_role;

-- Reminders: after pg_cron and pg_net exist, schedule send-reminders every 5 minutes.
-- Store the function URL in Vault under the name send_reminders_url.
-- Never place the service-role key in a VITE_ variable or in this file.
--
-- select cron.schedule(
--   'eventbuddy-send-reminders',
--   '*/5 * * * *',
--   $$select net.http_post(
--       url := (select decrypted_secret from vault.decrypted_secrets where name = 'send_reminders_url'),
--       headers := jsonb_build_object('Content-Type', 'application/json')
--     );$$
-- );
