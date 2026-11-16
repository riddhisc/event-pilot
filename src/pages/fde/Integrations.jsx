import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Badge, Drawer, EmptyState, PageHeader, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { pluralize } from '../../utils/formatters';
import { fetchIntegrations, fetchSyncRuns, fetchWebhookDeliveries, replayWebhook, runIntegration } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';

const NAMES = { slack: 'Slack', gcal: 'Google Calendar', oidc: 'SSO', outlook: 'Outlook', teams: 'Teams' };

const Integrations = () => {
  const tenantId = useUiStore((state) => state.clientId);
  const queryClient = useQueryClient();
  const { push } = useToast();
  const integrations = useQuery({ queryKey: ['integrations', tenantId], queryFn: () => fetchIntegrations(tenantId) });
  const deliveries = useQuery({ queryKey: ['deliveries', tenantId], queryFn: () => fetchWebhookDeliveries(tenantId) });
  const [busy, setBusy] = useState('');
  const [history, setHistory] = useState(null);
  const [runs, setRuns] = useState([]);
  const [delivery, setDelivery] = useState(null);
  const action = useMutation({ mutationFn: ({ id, name }) => runIntegration(id, name) });

  const run = async (item, name) => {
    setBusy(`${item.id}-${name}`);
    try {
      await action.mutateAsync({ id: item.id, name });
      await queryClient.invalidateQueries({ queryKey: ['integrations', tenantId] });
      push({ title: `${NAMES[item.provider] || item.provider} ${name} finished` });
    } catch (error) {
      push({ title: error.message || 'Action failed', tone: 'danger' });
    } finally {
      setBusy('');
    }
  };

  const openHistory = async (item) => {
    setHistory(item);
    setRuns(await fetchSyncRuns(item.id));
  };

  return (
    <AppLayout role="fde">
      <PageHeader title="Integrations" actions={<button type="button" className="btn" onClick={() => push({ title: 'New integrations are added from the client config' })}>Add integration</button>} />
      {integrations.isLoading ? <Skeleton /> : (integrations.data || []).length === 0 ? <EmptyState title="No integrations" /> : (integrations.data || []).map((item) => (
        <article key={item.id} className="card event-card">
          <h2>{NAMES[item.provider] || item.provider}</h2>
          <Badge status={item.status}>{item.status}</Badge>
          <p>Last sync <RelativeTime value={item.last_sync_at} /></p>
          {item.last_error && <p className="error-message">{item.last_error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" disabled={busy === `${item.id}-test`} onClick={() => run(item, 'test')}>{busy === `${item.id}-test` ? 'Testing...' : 'Test'}</button>
            {item.status === 'error' ? (
              <button type="button" className="btn" disabled={busy === `${item.id}-connect`} onClick={() => run(item, 'connect')}>{busy === `${item.id}-connect` ? 'Working...' : 'Re-auth'}</button>
            ) : (
              <button type="button" className="btn btn-ghost" disabled={busy === `${item.id}-sync`} onClick={() => run(item, 'sync')}>{busy === `${item.id}-sync` ? 'Syncing...' : 'Retry sync'}</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => openHistory(item)}>Sync history</button>
          </div>
        </article>
      ))}
      <section className="card">
        <h2>Webhook deliveries</h2>
        {(deliveries.data || []).length === 0 ? <EmptyState title="No deliveries" /> : (
          <table className="data-table">
            <thead><tr><th>Event</th><th>Endpoint</th><th>Status</th><th>Attempts</th><th>Last attempt</th><th>Next retry</th><th></th></tr></thead>
            <tbody>
              {(deliveries.data || []).map((row) => (
                <tr key={row.id} onClick={() => setDelivery(row)} className="clickable">
                  <td data-label="Event">{row.event}</td>
                  <td data-label="Endpoint" className="mono">{row.endpoint || '—'}</td>
                  <td data-label="Status"><Badge status={row.status_code >= 400 ? 'error' : 'success'}>{row.status_code}</Badge></td>
                  <td data-label="Attempts">{pluralize(row.attempts, 'attempt')}</td>
                  <td data-label="Last attempt"><RelativeTime value={row.last_attempt_at} /></td>
                  <td data-label="Next retry"><RelativeTime value={row.next_retry_at} /></td>
                  <td><button type="button" className="btn btn-ghost" disabled={busy === row.id} onClick={async (event) => { event.stopPropagation(); setBusy(row.id); await replayWebhook(row.id); setBusy(''); await queryClient.invalidateQueries({ queryKey: ['deliveries', tenantId] }); push({ title: 'Replay queued' }); }}>{busy === row.id ? 'Replaying...' : 'Replay'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <Drawer open={Boolean(history)} title="Sync history" onClose={() => setHistory(null)}>
        {runs.length === 0 ? <EmptyState title="No runs yet" /> : runs.map((runItem) => (
          <p key={runItem.id}><Badge status={runItem.status === 'error' ? 'error' : 'success'}>{runItem.status}</Badge> {runItem.duration_ms} ms · <RelativeTime value={runItem.at} /></p>
        ))}
      </Drawer>
      <Drawer open={Boolean(delivery)} title="Delivery" onClose={() => setDelivery(null)}>
        {delivery && (
          <>
            <h3>Payload</h3>
            <pre className="mono">{JSON.stringify(delivery.payload || {}, null, 2)}</pre>
            <button type="button" className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(delivery.payload || {}, null, 2))}>Copy payload</button>
            <h3>Response</h3>
            <pre className="mono">{JSON.stringify(delivery.response || { status_code: delivery.status_code }, null, 2)}</pre>
          </>
        )}
      </Drawer>
    </AppLayout>
  );
};

export default Integrations;
