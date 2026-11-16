-- Section 1: group feedback, and keep FDE users out of tenant staff metrics.

create or replace function public.feedback_summary()
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'eventId', event_id,
    'eventTitle', title,
    'avgRating', avg_rating,
    'responseCount', response_count
  )), '[]'::jsonb)
  from (
    select
      e.id as event_id,
      e.title,
      round(avg(f.rating)::numeric, 1) as avg_rating,
      count(f.id) as response_count
    from public.feedback f
    join public.events e on e.id = f.event_id
    group by e.id, e.title
  ) grouped;
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
    where p.role <> 'fde'
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
    'totalStaff', (select count(*) from public.profiles where role <> 'fde'),
    'avgParticipation', avg_participation,
    'participationData', public.participation_by_month(),
    'engagementData', public.engagement_by_department(),
    'recentParticipants', (
      select coalesce(jsonb_agg(jsonb_build_object('id', id, 'name', full_name, 'email', email, 'role', role)), '[]'::jsonb)
      from (
        select id, full_name, email, role
        from public.profiles
        where role <> 'fde'
        order by full_name
        limit 5
      ) people
    ),
    'feedbackData', public.feedback_summary()
  );
end;
$$;
