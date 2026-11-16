import { adapters } from '../_shared/adapters.ts';
import { json, requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const user = await requireUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || 'test');
  const supabase = serviceClient();

  const { data: integration, error } = await supabase
    .from('integrations')
    .select('id, tenant_id, provider, config, status')
    .eq('id', body.integrationId)
    .maybeSingle();
  if (error || !integration) return json({ error: 'Integration not found' }, 404);

  const adapter = adapters[integration.provider];
  if (!adapter) return json({ error: `No adapter for ${integration.provider}` }, 400);
  const config = body.config || integration.config || {};
  const valid = adapter.validateConfig(config);
  if (!valid.ok && action !== 'disconnect') return json({ error: valid.error }, 400);

  const started = new Date().toISOString();
  try {
    if (action === 'connect') await adapter.connect(integration.tenant_id, config);
    if (action === 'sync' || action === 'test') await adapter.sync(integration.tenant_id);
    if (action === 'disconnect') await adapter.disconnect(integration.tenant_id);
    const status = action === 'disconnect' ? 'pending' : 'active';
    await supabase.from('integrations').update({
      status,
      config,
      last_error: null,
      last_sync_at: new Date().toISOString(),
    }).eq('id', integration.id);
    await supabase.from('sync_runs').insert({
      tenant_id: integration.tenant_id,
      integration_id: integration.id,
      started_at: started,
      finished_at: new Date().toISOString(),
      status: 'ok',
      stats: { action },
    });
    return json({ status, provider: adapter.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'sync failed';
    await supabase.from('integrations').update({ status: 'error', last_error: message }).eq('id', integration.id);
    await supabase.from('sync_runs').insert({
      tenant_id: integration.tenant_id,
      integration_id: integration.id,
      started_at: started,
      finished_at: new Date().toISOString(),
      status: 'error',
      error: message,
    });
    return json({ error: message }, 400);
  }
});
