import { json, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const supabase = serviceClient();
  const soon = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const { data: events, error } = await supabase
    .from('events')
    .select('id, tenant_id, title, starts_at')
    .eq('status', 'published')
    .gte('starts_at', new Date().toISOString())
    .lte('starts_at', soon);
  if (error) return json({ error: error.message }, 400);

  let queued = 0;
  for (const event of events || []) {
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('user_id')
      .eq('event_id', event.id)
      .eq('status', 'going');
    for (const rsvp of rsvps || []) {
      await supabase.from('notifications').insert({
        tenant_id: event.tenant_id,
        user_id: rsvp.user_id,
        type: 'reminder',
        payload: { message: `${event.title} starts soon.`, event_id: event.id },
      });
      queued += 1;
    }
  }
  return json({
    queued,
    email: Deno.env.get('RESEND_API_KEY') ? 'ready' : 'skipped until RESEND_API_KEY is set in function secrets',
    push: 'web push is queued as an in-app notification until a push provider secret is set',
  });
});
