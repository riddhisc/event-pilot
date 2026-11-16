import { json, requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const actor = await requireUser(req);
  if (!actor) return json({ error: 'Unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const supabase = serviceClient();
  const { data: actorProfile } = await supabase.from('profiles').select('role').eq('id', actor.id).maybeSingle();
  if (actorProfile?.role !== 'fde') return json({ error: 'Only an FDE can impersonate.' }, 403);

  const { data: assignment } = await supabase
    .from('fde_assignments')
    .select('tenant_id')
    .eq('fde_user_id', actor.id)
    .eq('tenant_id', body.tenantId)
    .maybeSingle();
  if (!assignment) return json({ error: 'This client is not assigned to you.' }, 403);

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await supabase.rpc('write_audit', {
    target_tenant: body.tenantId,
    action: 'impersonate.start',
    entity: 'profiles',
    entity_id: body.userId,
    diff: { expires_at: expiresAt, actor_id: actor.id },
  });
  return json({
    user_id: body.userId,
    tenant_id: body.tenantId,
    expires_at: expiresAt,
  });
});
