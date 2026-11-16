import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { Badge, EmptyState, PageHeader, Progress, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { completeOnboardingTask, fetchOnboarding, fetchTenants, previewStaffImport } from '../../services/platformService';

const Onboarding = () => {
  const { tenantId } = useParams();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const tasks = useQuery({ queryKey: ['onboarding', tenantId], queryFn: () => fetchOnboarding(tenantId) });
  const [csv, setCsv] = useState('name,email,role,department\nAda Lovelace,ada@northwind.example,staff,Engineering');
  const [committed, setCommitted] = useState(false);
  const [busy, setBusy] = useState('');
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
          <p>{Math.round((done / total) * 100)}% complete</p>
          <Progress value={done} max={total} label="Onboarding progress" />
          {(tasks.data || []).map((task, index) => (
            <article key={task.key} className="card">
              <h2>{index + 1}. {task.title}</h2>
              <Badge status={task.status === 'done' ? 'success' : task.status === 'in_progress' ? 'warning' : 'pending'}>{task.status}</Badge>
              <p>{task.owner ? `Owner ${task.owner}` : 'No owner yet'} {task.completed_at && <>· <RelativeTime value={task.completed_at} /></>}</p>
              {task.key === 'import' && (
                <>
                  <label htmlFor="import-csv">Staff CSV</label>
                  <textarea id="import-csv" className="mono" rows="5" value={csv} onChange={(event) => { setCsv(event.target.value); setCommitted(false); }} />
                  {preview.map((row) => (
                    <p key={row.row} className={row.errors.length ? 'error-message' : ''}>Row {row.row}: {row.name || '—'} {row.email} {row.errors.join(', ')}</p>
                  ))}
                  <button type="button" className="btn" disabled={preview.some((row) => row.errors.length) || busy === 'import'} onClick={async () => { setCommitted(true); await mark('import'); }}>{busy === 'import' ? 'Importing...' : committed ? 'Imported' : 'Commit import'}</button>
                </>
              )}
              {task.key !== 'import' && task.status !== 'done' && (
                <button type="button" className="btn" disabled={busy === task.key} onClick={() => mark(task.key)}>{busy === task.key ? 'Saving...' : 'Mark done'}</button>
              )}
            </article>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Onboarding;
