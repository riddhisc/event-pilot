import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Badge, ConfirmDialog, EmptyState, Modal, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { pluralize } from '../../utils/formatters';
import { slugify, uniqueSlug } from '../../lib/slug';
import { defaultFlags, defaultSettings, fetchTenants, provisionTenant, updateTenantStatus } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';

function ringColor(health) {
  if (health > 80) return 'var(--success)';
  if (health >= 50) return 'var(--warning)';
  return 'var(--danger)';
}

const Clients = () => {
  const queryClient = useQueryClient();
  const { push } = useToast();
  const setClientId = useUiStore((state) => state.setClientId);
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const [query, setQuery] = useState('');
  const [attention, setAttention] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', plan: 'team', seed: false, slugTouched: false });
  const [archive, setArchive] = useState(null);
  const rows = useMemo(() => (tenants.data || []).filter((tenant) => {
    const matches = tenant.name.toLowerCase().includes(query.toLowerCase());
    const needs = (tenant.health ?? 100) < 80 || (tenant.open_issues ?? 0) > 0;
    return matches && (!attention || needs);
  }), [tenants.data, query, attention]);

  const mutation = useMutation({
    mutationFn: provisionTenant,
    onSuccess: async (tenant) => {
      setOpen(false);
      setClientId(tenant.id);
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      push({ title: `${tenant.name} created` });
    },
  });

  const suggested = uniqueSlug(form.name, (tenants.data || []).map((tenant) => tenant.slug));

  return (
    <AppLayout role="fde">
      <PageHeader title="Clients" actions={<button type="button" className="btn" onClick={() => setOpen(true)}>New client</button>} />
      <div className="table-toolbar">
        <input aria-label="Search clients" placeholder="Search" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="button" className="btn btn-ghost" aria-pressed={attention} onClick={() => setAttention((value) => !value)}>Needs attention</button>
      </div>
      {tenants.isLoading ? <Skeleton /> : rows.length === 0 ? <EmptyState title="No clients match" /> : (
        <div className="section-gap">
          {rows.map((tenant) => (
            <article key={tenant.id} className="card client-card">
              <div className="form-actions">
                <span className="avatar">{tenant.name.slice(0, 1)}</span>
                <div>
                  <h2>{tenant.name}</h2>
                  <Badge status={tenant.plan}>{tenant.plan}</Badge>
                </div>
                <span className="health-ring" style={{ background: `conic-gradient(${ringColor(tenant.health)} ${tenant.health}%, var(--border-color) 0)` }}>{tenant.health}</span>
              </div>
              <p>Adoption {tenant.adoption}% · Last sync <RelativeTime value={tenant.last_sync || tenant.last_sync_at} /> · <Badge>{pluralize(tenant.open_issues ?? 0, 'open issue')}</Badge></p>
              <div className="form-actions">
                <button type="button" className="btn" onClick={() => setClientId(tenant.id)}>Open</button>
                <Link className="btn btn-ghost" to={`/fde/onboarding/${tenant.id}`} onClick={() => setClientId(tenant.id)}>Onboarding</Link>
                <Link className="btn btn-ghost" to="/fde/config" onClick={() => setClientId(tenant.id)}>Config</Link>
                <button type="button" className="btn btn-ghost" onClick={() => setArchive(tenant)}>Archive</button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Modal open={open} title="New client" onClose={() => setOpen(false)}>
        <form onSubmit={(event) => {
          event.preventDefault();
          const slug = slugify(form.slugTouched ? form.slug : suggested);
          if (!form.name.trim() || !slug) return;
          mutation.mutate({ name: form.name.trim(), slug, plan: form.plan, settings: defaultSettings, feature_flags: defaultFlags, seed: form.seed });
        }}>
          <label htmlFor="tenant-name">Name</label>
          <input id="tenant-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <label htmlFor="tenant-slug">Slug</label>
          <input id="tenant-slug" value={form.slugTouched ? form.slug : suggested} onChange={(event) => setForm({ ...form, slug: event.target.value, slugTouched: true })} required />
          <label htmlFor="tenant-plan">Plan</label>
          <select id="tenant-plan" value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })}>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <label><input type="checkbox" checked={form.seed} onChange={(event) => setForm({ ...form, seed: event.target.checked })} /> Seed demo data</label>
          {mutation.error && <p className="error-message" role="alert">{mutation.error.message}</p>}
          <button className="btn" type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Creating...' : 'Create client'}</button>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(archive)}
        title="Archive this client?"
        body={`${archive?.name || 'This client'} will be marked suspended.`}
        confirmLabel="Archive"
        tone="danger"
        onClose={() => setArchive(null)}
        onConfirm={async () => {
          await updateTenantStatus(archive.id, 'suspended');
          setArchive(null);
          await queryClient.invalidateQueries({ queryKey: ['tenants'] });
          push({ title: 'Client archived' });
        }}
      />
    </AppLayout>
  );
};

export default Clients;
