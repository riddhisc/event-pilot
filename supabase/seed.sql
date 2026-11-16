-- Two demo tenants. No auth users and no passwords: login is on hold.
-- Profiles are created later, when Supabase Auth is wired up.

insert into public.tenants (id, name, slug, plan, brand_color, settings, feature_flags)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Northwind Offices',
    'northwind',
    'team',
    '#0f766e',
    '{
      "eventTypes": ["in_person", "virtual", "hybrid"],
      "approvalRequired": false,
      "departments": ["Engineering", "People", "Design"],
      "workingHours": {"start": "09:00", "end": "17:00"},
      "branding": {"brandColor": "#0f766e"},
      "notificationTemplates": {"reminder": "Reminder: {{title}} starts soon."}
    }'::jsonb,
    '{"aiAssist": false, "waitlist": true, "reminders": true, "recurringEvents": true}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Contoso Labs',
    'contoso',
    'enterprise',
    '#1d4ed8',
    '{
      "eventTypes": ["virtual", "hybrid"],
      "approvalRequired": true,
      "departments": ["Research", "Ops"],
      "workingHours": {"start": "08:00", "end": "16:00"},
      "branding": {"brandColor": "#1d4ed8"},
      "notificationTemplates": {"reminder": "{{title}} is coming up for Contoso."}
    }'::jsonb,
    '{"aiAssist": true, "waitlist": true, "reminders": true, "recurringEvents": false}'::jsonb
  )
on conflict (id) do nothing;

insert into public.events (
  id, tenant_id, title, description, type, starts_at, ends_at, timezone, location, capacity, waitlist_enabled, status, tags
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '11111111-1111-4111-8111-111111111111',
    'Northwind welcome',
    'Demo event for the Northwind tenant.',
    'hybrid',
    now() + interval '7 days',
    now() + interval '7 days 2 hours',
    'America/New_York',
    'HQ atrium',
    40,
    true,
    'published',
    array['demo']
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    '22222222-2222-4222-8222-222222222222',
    'Contoso lab hour',
    'Demo event that Northwind must not be able to read.',
    'virtual',
    now() + interval '9 days',
    now() + interval '9 days 1 hour',
    'America/Chicago',
    'Video room',
    20,
    true,
    'published',
    array['demo']
  )
on conflict (id) do nothing;

insert into public.onboarding_tasks (tenant_id, key, title, status)
values
  ('11111111-1111-4111-8111-111111111111', 'create', 'Create tenant', 'done'),
  ('11111111-1111-4111-8111-111111111111', 'sso', 'Configure SSO', 'pending'),
  ('11111111-1111-4111-8111-111111111111', 'import', 'Import staff', 'pending'),
  ('11111111-1111-4111-8111-111111111111', 'integrations', 'Connect Slack and calendar', 'pending'),
  ('11111111-1111-4111-8111-111111111111', 'branding', 'Branding and templates', 'pending'),
  ('11111111-1111-4111-8111-111111111111', 'test_event', 'Create and run a test event', 'pending'),
  ('11111111-1111-4111-8111-111111111111', 'golive', 'Go-live sign-off', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'create', 'Create tenant', 'done'),
  ('22222222-2222-4222-8222-222222222222', 'sso', 'Configure SSO', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'import', 'Import staff', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'integrations', 'Connect Slack and calendar', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'branding', 'Branding and templates', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'test_event', 'Create and run a test event', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'golive', 'Go-live sign-off', 'pending')
on conflict (tenant_id, key) do nothing;

insert into public.integrations (tenant_id, provider, status, config)
values
  ('11111111-1111-4111-8111-111111111111', 'slack', 'pending', '{"channel": "#events"}'::jsonb),
  ('11111111-1111-4111-8111-111111111111', 'gcal', 'pending', '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', 'oidc', 'pending', '{"issuer": "https://login.contoso.example"}'::jsonb)
on conflict (tenant_id, provider) do nothing;

insert into public.config_versions (tenant_id, version, snapshot)
select id, 1, jsonb_build_object('settings', settings, 'feature_flags', feature_flags)
from public.tenants
where id in (
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
)
on conflict (tenant_id, version) do nothing;

insert into public.webhook_endpoints (tenant_id, url, events, active)
values (
  '11111111-1111-4111-8111-111111111111',
  'https://example.invalid/eventbuddy',
  array['rsvp.created'],
  true
);
