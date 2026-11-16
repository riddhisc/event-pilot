import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Badge, ConfirmDialog, DataTable, EmptyState, Modal, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { useAuth } from '../../hooks/useAuth';
import { fetchStaff } from '../../services/eventService';
import { askEventData, fetchAudit, fetchTenants, resendInvite } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';

const EXAMPLES = ['How many events do we have?', 'What is the average feedback?'];

const Support = () => {
  const { startImpersonation } = useAuth();
  const { push } = useToast();
  const clientId = useUiStore((state) => state.clientId);
  const queryClient = useQueryClient();
  const staff = useQuery({ queryKey: ['staff', 'fde'], queryFn: fetchStaff });
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const audit = useQuery({ queryKey: ['audit'], queryFn: fetchAudit });
  const [visible, setVisible] = useState(5);
  const [actor, setActor] = useState('');
  const [target, setTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [adminConfirm, setAdminConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const [asking, setAsking] = useState(false);
  const tenant = (tenants.data || []).find((item) => item.id === clientId);
  const aiEnabled = Boolean(tenant?.feature_flags?.aiAssist);
  const people = (staff.data || []).filter((person) => person.role !== 'fde' && (!person.tenant_id || person.tenant_id === clientId));
  const auditRows = (audit.data || []).filter((entry) => !actor || entry.actor === actor);

  const start = async () => {
    setBusy(true);
    try {
      await startImpersonation(target, reason.trim(), Number(minutes));
      setTarget(null);
      setAdminConfirm(false);
      await queryClient.invalidateQueries({ queryKey: ['audit'] });
      push({ title: `Impersonating ${target.name}` });
    } catch (error) {
      push({ title: error.message, tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout role="fde">
      <PageHeader title="Support" eyebrow={tenant?.name} />
      {staff.isLoading ? <Skeleton /> : (
        <DataTable
          rows={people}
          searchKeys={['name', 'email']}
          empty="No people for this client."
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'email', header: 'Email' },
            { key: 'role', header: 'Role', render: (row) => <Badge status={row.role}>{row.role}</Badge> },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status}>{row.status}</Badge> },
            { key: 'last_active', header: 'Last active', render: (row) => <RelativeTime value={row.last_active} /> },
          ]}
          rowActions={(row) => [
            { label: 'Impersonate', onClick: () => { setTarget(row); setReason(''); } },
            ...(row.status === 'invited' ? [{ label: 'Resend invite', onClick: async () => { await resendInvite(row.email); push({ title: `Invite requeued for ${row.email}` }); } }] : []),
          ]}
        />
      )}
      <section className="card">
        <h2>Audit</h2>
        <select aria-label="Filter by actor" value={actor} onChange={(event) => setActor(event.target.value)}>
          <option value="">All actors</option>
          {[...new Set((audit.data || []).map((entry) => entry.actor).filter(Boolean))].map((name) => <option key={name}>{name}</option>)}
        </select>
        <table className="data-table">
          <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Entity</th><th>Tenant</th></tr></thead>
          <tbody>
            {auditRows.slice(0, visible).map((entry) => (
              <tr key={entry.id}>
                <td data-label="When"><RelativeTime value={entry.at || entry.created_at} /></td>
                <td data-label="Actor">{entry.actor || 'System'}</td>
                <td data-label="Action">{entry.action}</td>
                <td data-label="Entity">{entry.entity}</td>
                <td data-label="Tenant">{(tenants.data || []).find((item) => item.id === entry.tenant_id)?.name || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible < auditRows.length && <button type="button" className="btn btn-ghost" onClick={() => setVisible((count) => count + 5)}>Load more</button>}
      </section>
      <section className="card">
        <h2>AI assist</h2>
        {aiEnabled ? (
          <form onSubmit={async (event) => {
            event.preventDefault();
            setAsking(true);
            const result = await askEventData(clientId, question);
            setAnswer(result);
            setAsking(false);
          }}>
            <div className="chip-row">
              {EXAMPLES.map((example) => <button key={example} type="button" className="chip" onClick={() => setQuestion(example)}>{example}</button>)}
            </div>
            <label htmlFor="ai-question">Question</label>
            <textarea id="ai-question" value={question} onChange={(event) => setQuestion(event.target.value)} />
            <button className="btn" type="submit" disabled={asking || !question.trim()}>{asking ? 'Asking...' : 'Ask'}</button>
            {answer && (
              <>
                <p role="status">{answer.answer}</p>
                <details>
                  <summary>How this was computed</summary>
                  <p className="mono">Whitelisted query: {answer.rpc}</p>
                </details>
              </>
            )}
          </form>
        ) : <EmptyState title="AI assist is off" body="Turn on the aiAssist flag for this client to enable it." />}
      </section>
      <Modal open={Boolean(target) && !adminConfirm} title={`Impersonate ${target?.name || ''}`} onClose={() => setTarget(null)}>
        <label htmlFor="reason">Reason</label>
        <textarea id="reason" value={reason} onChange={(event) => setReason(event.target.value)} required />
        <label htmlFor="duration">Duration</label>
        <select id="duration" value={minutes} onChange={(event) => setMinutes(event.target.value)}>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>60 minutes</option>
        </select>
        <button type="button" className="btn" disabled={!reason.trim() || busy} onClick={() => (target?.role === 'admin' ? setAdminConfirm(true) : start())}>{busy ? 'Starting...' : 'Continue'}</button>
      </Modal>
      <ConfirmDialog open={adminConfirm} title="Impersonate an admin?" body="This account can change tenant settings. Confirm to continue." confirmLabel="Start session" tone="danger" busy={busy} onClose={() => setAdminConfirm(false)} onConfirm={start} />
    </AppLayout>
  );
};

export default Support;
