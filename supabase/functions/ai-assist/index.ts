import { json, requireUser, serviceClient } from '../_shared/supabase.ts';

const ALLOWED = new Set(['analytics_summary', 'feedback_summary', 'participation_by_month', 'engagement_by_department']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const user = await requireUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const supabase = serviceClient();
  const { data: tenant } = await supabase.from('tenants').select('feature_flags').eq('id', body.tenantId).maybeSingle();
  if (!tenant?.feature_flags?.aiAssist) return json({ error: 'AI assist is off for this client.' }, 403);

  const question = String(body.input || '');
  const rpc = question.toLowerCase().includes('feedback') ? 'feedback_summary' : 'analytics_summary';
  if (!ALLOWED.has(rpc)) return json({ error: 'That question is outside the read-only allow list.' }, 400);
  const { data, error } = await supabase.rpc(rpc);
  if (error) return json({ error: error.message }, 400);
  return json({ rpc, answer: data, note: 'Questions map to a whitelisted RPC. Raw SQL is never executed.' });
});
