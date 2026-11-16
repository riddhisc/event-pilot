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

  const file = body.file_path
    ? await supabase.storage.from('imports').download(String(body.file_path))
    : { data: null, error: null };
  const text = file.data ? await file.data.text() : String(body.csv || '');
  const { headers, rows } = parseCsv(text);
  const errors: { row: number; message: string }[] = [];
  const accepted: Record<string, string>[] = [];
  rows.forEach((cells, index) => {
    const record = Object.fromEntries(headers.map((header, cell) => [header, cells[cell] || '']));
    if (!record.title) errors.push({ row: index + 2, message: 'title is required' });
    else if (!record.starts_at || !record.ends_at) errors.push({ row: index + 2, message: 'starts_at and ends_at are required' });
    else if (new Date(record.ends_at) <= new Date(record.starts_at)) errors.push({ row: index + 2, message: 'ends_at must be after starts_at' });
    else accepted.push(record);
  });

  const report = { dry_run: dryRun, accepted: accepted.length, errors };
  if (!dryRun && errors.length === 0) {
    const { error } = await supabase.from('events').insert(accepted.map((row) => ({
      tenant_id: body.tenant_id || profile.tenant_id,
      title: row.title,
      description: row.description || '',
      type: row.type || 'in_person',
      starts_at: row.starts_at,
      ends_at: row.ends_at,
      location: row.location || '',
      capacity: Number(row.capacity || 30),
      status: 'draft',
      created_by: user.id,
    })));
    if (error) return json({ error: error.message, report }, 400);
  }

  await supabase.from('import_jobs').insert({
    tenant_id: body.tenant_id || profile.tenant_id,
    kind: 'events',
    status: errors.length ? 'error' : 'completed',
    dry_run: dryRun,
    file_path: body.file_path || null,
    report,
    created_by: user.id,
  });
  return json({ report });
});
