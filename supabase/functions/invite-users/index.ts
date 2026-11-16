import { json, requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const user = await requireUser(req);
  if (!user) return json({ error: 'Sign-in is required for invites. Login is on hold in the web app.' }, 401);
  const body = await req.json().catch(() => ({}));
  const emails = Array.isArray(body.emails) ? body.emails.map(String) : [];
  const invalid = emails.filter((email: string) => !email.includes('@'));
  if (!emails.length || invalid.length) return json({ error: 'Provide valid email addresses.', invalid }, 400);

  const supabase = serviceClient();
  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'fde'].includes(profile.role)) return json({ error: 'Only an admin or FDE can invite.' }, 403);

  const queued = emails.map((email: string) => ({ email, tenant_id: profile.tenant_id, status: 'invited' }));
  await supabase.rpc('write_audit', {
    target_tenant: profile.tenant_id,
    action: 'invite.queue',
    entity: 'profiles',
    entity_id: null,
    diff: { count: queued.length },
  });
  return json({ queued: queued.map((row: { email: string }) => row.email), note: 'Resend delivery runs when RESEND_API_KEY is set in function secrets.' });
});
