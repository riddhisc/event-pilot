import { json, serviceClient } from '../_shared/supabase.ts';

// Inbound Slack interaction URL. Verifies the Slack signing secret from Vault via the integration row.
Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const raw = await req.text();
  const supabase = serviceClient();
  const teamId = req.headers.get('x-slack-team') || '';
  const { data: integration } = await supabase
    .from('integrations')
    .select('id, tenant_id')
    .eq('provider', 'slack')
    .contains('config', teamId ? { teamId } : {})
    .maybeSingle();
  if (!integration) return json({ error: 'Slack workspace is not connected' }, 404);

  const { data: secret } = await supabase.rpc('read_integration_secret', { integration_id: integration.id });
  const timestamp = req.headers.get('x-slack-request-timestamp') || '';
  const given = req.headers.get('x-slack-signature') || '';
  if (typeof secret === 'string' && secret && timestamp && given) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`v0:${timestamp}:${raw}`));
    const expected = `v0=${Array.from(new Uint8Array(mac)).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    if (expected !== given) return json({ error: 'Bad signature' }, 401);
  }

  const params = new URLSearchParams(raw);
  const payload = params.get('payload');
  return json({ ok: true, tenant_id: integration.tenant_id, received: Boolean(payload) });
});
