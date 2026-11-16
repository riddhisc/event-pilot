import { json, serviceClient } from '../_shared/supabase.ts';

async function sign(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const body = await req.json().catch(() => ({}));
  const supabase = serviceClient();
  let query = supabase.from('webhook_deliveries').select('id, endpoint_id, event, payload, attempts').limit(20);
  if (body.deliveryId) query = query.eq('id', body.deliveryId);
  else query = query.lte('next_retry_at', new Date().toISOString());
  const { data: deliveries, error } = await query;
  if (error) return json({ error: error.message }, 400);

  const results = [];
  for (const delivery of deliveries || []) {
    const { data: endpoint } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret_ref, active')
      .eq('id', delivery.endpoint_id)
      .maybeSingle();
    if (!endpoint?.active) continue;
    let secret = '';
    if (endpoint.secret_ref) {
      const { data } = await supabase.rpc('read_vault_secret', { ref: endpoint.secret_ref });
      secret = typeof data === 'string' ? data : '';
    }
    const raw = JSON.stringify(delivery.payload || {});
    const signature = secret ? await sign(secret, raw) : '';
    let statusCode = 0;
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-eventbuddy-event': delivery.event,
          'x-eventbuddy-signature': signature,
        },
        body: raw,
      });
      statusCode = response.status;
    } catch {
      statusCode = 0;
    }
    const attempts = (delivery.attempts || 0) + 1;
    const failed = statusCode < 200 || statusCode >= 300;
    const delayMinutes = Math.min(60, 2 ** attempts);
    await supabase.from('webhook_deliveries').update({
      status_code: statusCode,
      attempts,
      next_retry_at: failed ? new Date(Date.now() + delayMinutes * 60 * 1000).toISOString() : null,
    }).eq('id', delivery.id);
    results.push({ id: delivery.id, status_code: statusCode });
  }
  return json({ results });
});
