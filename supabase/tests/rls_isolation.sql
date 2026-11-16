-- Proves tenant A cannot read or write tenant B.
-- Run with `supabase test db` after `supabase start`. Docker is not required for `npm run dev`.
-- Fixture passwords are random hashes discarded when the transaction rolls back.

begin;

select plan(16);

create extension if not exists pgtap with schema extensions;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  (
    'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'a@northwind.test',
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
  ),
  (
    'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'b@contoso.test',
    extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
    now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
  );

insert into public.profiles (id, tenant_id, email, full_name, role, status)
values
  ('aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', '11111111-1111-4111-8111-111111111111', 'a@northwind.test', 'Tenant A', 'admin', 'active'),
  ('bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '22222222-2222-4222-8222-222222222222', 'b@contoso.test', 'Tenant B', 'admin', 'active');

insert into public.rsvps (tenant_id, event_id, user_id, status)
values (
  '22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'going'
);

insert into public.chat_messages (tenant_id, event_id, user_id, body)
values (
  '22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'private to contoso'
);

insert into public.notifications (tenant_id, user_id, type, payload)
values (
  '22222222-2222-4222-8222-222222222222',
  'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'reminder',
  '{"message":"contoso only"}'::jsonb
);

insert into public.feedback (tenant_id, event_id, user_id, rating, comment)
values (
  '22222222-2222-4222-8222-222222222222',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  'bbbbbbb2-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  5,
  'contoso only'
);

select set_config('request.jwt.claim.sub', 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1","role":"authenticated","app_role":"admin","tenant_id":"11111111-1111-4111-8111-111111111111"}',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.events where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B events'
);

select is(
  (select count(*) from public.rsvps where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B rsvps'
);

select is(
  (select count(*) from public.chat_messages where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B chat'
);

select is(
  (select count(*) from public.notifications where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B notifications'
);

select is(
  (select count(*) from public.feedback where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B feedback'
);

select is(
  (select count(*) from public.integrations where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B integrations'
);

select is(
  (select count(*) from public.onboarding_tasks where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B onboarding'
);

select is(
  (select count(*) from public.config_versions where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B config'
);

select is(
  (select count(*) from public.webhook_endpoints where tenant_id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select tenant B webhooks'
);

select is(
  (select count(*) from public.tenants where id = '22222222-2222-4222-8222-222222222222')::int,
  0,
  'tenant A cannot select the tenant B row'
);

select is(
  (
    with changed as (
      update public.events
      set title = 'taken over'
      where tenant_id = '22222222-2222-4222-8222-222222222222'
      returning 1
    )
    select count(*)::int from changed
  ),
  0,
  'tenant A cannot update tenant B events'
);

select is(
  (
    with removed as (
      delete from public.events
      where tenant_id = '22222222-2222-4222-8222-222222222222'
      returning 1
    )
    select count(*)::int from removed
  ),
  0,
  'tenant A cannot delete tenant B events'
);

select throws_ok(
  $$insert into public.events (tenant_id, title, starts_at, ends_at, status)
    values ('22222222-2222-4222-8222-222222222222', 'stolen', now(), now() + interval '1 hour', 'published')$$,
  '42501',
  null,
  'tenant A cannot insert an event for tenant B'
);

select throws_ok(
  $$insert into public.rsvps (tenant_id, event_id, user_id, status)
    values (
      '22222222-2222-4222-8222-222222222222',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'going'
    )$$,
  '42501',
  null,
  'tenant A cannot insert an rsvp for tenant B'
);

select throws_ok(
  $$insert into public.chat_messages (tenant_id, event_id, user_id, body)
    values (
      '22222222-2222-4222-8222-222222222222',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'hello'
    )$$,
  '42501',
  null,
  'tenant A cannot insert chat for tenant B'
);

select throws_ok(
  'select secret_ref from public.integrations',
  '42501',
  null,
  'the browser role cannot read integration secret refs'
);

select * from finish();

rollback;
