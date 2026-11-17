import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Badge, EmptyState, PageHeader, Progress, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { completeOnboardingTask, fetchOnboarding, fetchTenants, previewStaffImport } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';

const Onboarding = () => {
  const { tenantId: routeTenantId } = useParams();
  const selectedTenantId = useUiStore((state) => state.clientId);
  const tenantId = routeTenantId || selectedTenantId;
  const queryClient = useQueryClient();
  const { push } = useToast();
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const tasks = useQuery({ queryKey: ['onboarding', tenantId], queryFn: () => fetchOnboarding(tenantId) });
  const [csv, setCsv] = useState('name,email,role,department\nAda Lovelace,ada@northwind.example,staff,Engineering');
  const [committed, setCommitted] = useState(false);
  const [busy, setBusy] = useState('');
  const [activeKey, setActiveKey] = useState('sso');
  const [notes, setNotes] = useState({});
  const tenant = (tenants.data || []).find((item) => item.id === tenantId);
  const preview = previewStaffImport(csv);
  const done = (tasks.data || []).filter((task) => task.status === 'done').length;
  const total = (tasks.data || []).length || 1;
  const mutation = useMutation({
    mutationFn: (key) => completeOnboardingTask(tenantId, key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['onboarding', tenantId] });
      push({ title: 'Step saved' });
    },
  });

  const mark = async (key) => {
    setBusy(key);
    await mutation.mutateAsync(key);
    setBusy('');
  };

  return (
    <AppLayout role="fde">
      <PageHeader title="Onboarding" eyebrow={tenant?.name || 'Client'} crumbs={[{ label: 'Clients', to: '/fde' }, { label: 'Onboarding' }]} />
      {tasks.isLoading ? <Skeleton /> : (tasks.data || []).length === 0 ? <EmptyState title="No onboarding plan" /> : (
        <div className="section-gap">
          <section className="onboarding-progress card">
            <div><p className="eyebrow">Setup plan</p><h2>{done} of {total} steps complete</h2><p className="muted">Open a step below to configure it, assign an owner, add notes, or mark it complete.</p></div>
            <div className="onboarding-progress-meter"><strong>{Math.round((done / total) * 100)}%</strong><Progress value={done} max={total} label="Onboarding progress" /></div>
          </section>
          {(tasks.data || []).map((task, index) => (
            <article key={task.key} className={`card onboarding-step ${activeKey === task.key ? 'expanded' : ''}`}>
              <button type="button" className="onboarding-step-header" aria-expanded={activeKey === task.key} onClick={() => setActiveKey(activeKey === task.key ? '' : task.key)}>
                <span className="onboarding-step-number">{index + 1}</span><span className="onboarding-step-title"><strong>{task.title}</strong><small>{task.owner ? `Owner: ${task.owner}` : 'No owner assigned'}</small></span><Badge status={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'pending'}>{task.status}</Badge><span aria-hidden="true">{activeKey === task.key ? '−' : '+'}</span>
              </button>
              {activeKey === task.key && <div className="onboarding-step-body">
                <div className="onboarding-meta"><label htmlFor={`owner-${task.key}`}>Owner<select id={`owner-${task.key}`} defaultValue={task.owner || 'Finn Deployed'}><option>Finn Deployed</option><option>Avery Admin</option><option>Unassigned</option></select></label><label htmlFor={`notes-${task.key}`}>Notes<textarea id={`notes-${task.key}`} rows="2" value={notes[task.key] || ''} onChange={(event) => setNotes({ ...notes, [task.key]: event.target.value })} placeholder="Add a note for this step" /></label></div>
                <p className="onboarding-help">{task.key === 'sso' && 'Connect the client identity provider before importing staff.'}{task.key === 'import' && 'Preview staff rows, fix validation errors, then commit the import.'}{task.key === 'integrations' && 'Connect and test the tools this client uses.'}{task.key === 'branding' && 'Set the client brand color and notification templates.'}{task.key === 'test_event' && 'Create a sandbox event and verify notifications.'}{task.key === 'golive' && 'Final sign-off is locked until the first six steps are complete.'}</p>
                {task.key === 'sso' && <div className="onboarding-action-grid"><label>Provider<select><option>Google</option><option>Microsoft</option><option>Generic OIDC</option></select></label><label>Client ID<input placeholder="Enter client ID" /></label><label>Issuer URL<input placeholder="https://issuer.example.com" /></label></div>}
                {task.key === 'integrations' && <div className="chip-row"><button type="button" className="btn btn-outline" onClick={() => push({ title: 'Slack connection opened' })}>Connect Slack</button><button type="button" className="btn btn-outline" onClick={() => push({ title: 'Calendar connection opened' })}>Connect calendar</button></div>}
                {task.key === 'branding' && <div className="onboarding-action-grid"><label>Primary color<input type="color" defaultValue={tenant?.brand_color || '#FE2C23'} /></label><label>Reminder template<textarea rows="2" defaultValue="Reminder: {{event.title}} starts soon." /></label></div>}
                {task.key === 'test_event' && <button type="button" className="btn btn-outline" onClick={() => push({ title: 'Sandbox test event created' })}>Run test event</button>}
                {task.key === 'import' && <>
                  <label htmlFor="import-csv">Staff CSV</label><textarea id="import-csv" className="mono" rows="5" value={csv} onChange={(event) => { setCsv(event.target.value); setCommitted(false); }} />
                  {preview.map((row) => <p key={row.row} className={row.errors.length ? 'error-message' : ''}>Row {row.row}: {row.name || '—'} {row.email} {row.errors.join(', ')}</p>)}
                </>}
                {task.key !== 'golive' && <button type="button" className="btn" disabled={busy === task.key || (task.key === 'import' && preview.some((row) => row.errors.length))} onClick={async () => { if (task.key === 'import') setCommitted(true); await mark(task.key); }}>{busy === task.key ? 'Saving...' : task.status === 'done' || committed ? 'Save changes' : 'Complete step'}</button>}
                {task.key === 'golive' && <button type="button" className="btn" disabled={done < total - 1 || busy === task.key} onClick={() => mark(task.key)}>{done < total - 1 ? 'Complete steps 1–6 first' : 'Confirm go-live'}</button>}
              </div>}
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Onboarding;
