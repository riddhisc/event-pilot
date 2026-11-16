import { json, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const channel = req.headers.get('x-goog-channel-id') || '';
  const resource = req.headers.get('x-goog-resource-state') || 'sync';
  const supabase = serviceClient();
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, tenant_id')
    .eq('provider', 'gcal')
    .contains('config', channel ? { channelId: channel } : {})
    .maybeSingle();
  if (!integration) return json({ error: 'Calendar channel is not connected' }, 404);
  await supabase.from('sync_runs').insert({
    tenant_id: integration.tenant_id,
    integration_id: integration.id,
    status: 'queued',
    stats: { resource, source: 'gcal-webhook' },
  });
  return json({ ok: true, resource });
});
