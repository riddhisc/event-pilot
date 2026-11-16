import { parseCsv } from '../_shared/adapters.ts';
import { json, requireUser, serviceClient } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);
  const user = await requireUser(req);
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run !== false;
  const supabase = serviceClient();
  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'fde'].includes(profile.role)) return json({ error: 'Forbidden' }, 403);

  const file = await supabase.storage.from('imports').download(String(body.file_path || ''));
  const text = file.data ? await file.data.text() : String(body.csv || '');
  const { headers, rows } = parseCsv(text);
  const errors: { row: number; message: string }[] = [];
  const accepted: Record<string, string>[] = [];
  rows.forEach((cells, index) => {
    const record = Object.fromEntries(headers.map((header, cell) => [header, cells[cell] || '']));
    if (!record.email || !record.email.includes('@')) errors.push({ row: index + 2, message: 'email is required' });
    else if (!record.full_name) errors.push({ row: index + 2, message: 'full_name is required' });
    else accepted.push(record);
  });

  const report = {
    dry_run: dryRun,
    accepted: accepted.length,
    errors,
    rows: accepted,
    note: 'Creating auth users is on hold with login. A passing commit stores this report for a later invite.',
  };

  await supabase.from('import_jobs').insert({
    tenant_id: body.tenant_id || profile.tenant_id,
    kind: 'staff',
    status: errors.length ? 'error' : 'completed',
    dry_run: dryRun,
    file_path: body.file_path || null,
    report,
    created_by: user.id,
  });
  return json({ report });
});
