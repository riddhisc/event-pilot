import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import { ConfirmDialog, Modal, PageHeader, Skeleton, Tabs } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import RelativeTime from '../../components/common/RelativeTime';
import { featureFlagsSchema, tenantSettingsSchema } from '../../lib/schemas';
import { fetchConfigVersions, fetchTenants, rollbackConfig, saveConfig } from '../../services/platformService';
import { useUiStore } from '../../stores/uiStore';
import { diffJson, summarizeDiff } from '../../utils/configDiff';

const ConfigEditor = () => {
  const tenantId = useUiStore((state) => state.clientId);
  const queryClient = useQueryClient();
  const { push } = useToast();
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: fetchTenants });
  const versions = useQuery({ queryKey: ['config', tenantId], queryFn: () => fetchConfigVersions(tenantId), enabled: Boolean(tenantId) });
  const tenant = (tenants.data || []).find((item) => item.id === tenantId);
  const [tab, setTab] = useState('form');
  const [draft, setDraft] = useState(null);
  const [json, setJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [restore, setRestore] = useState(null);
  const [compare, setCompare] = useState(null);

  useEffect(() => {
    if (!tenant) return;
    setDraft({ settings: tenant.settings, feature_flags: tenant.feature_flags });
    setJson(JSON.stringify({ settings: tenant.settings, feature_flags: tenant.feature_flags }, null, 2));
  }, [tenant]);

  const save = useMutation({
    mutationFn: (snapshot) => saveConfig(tenantId, snapshot, { note, author: 'Finn Deployed' }),
    onSuccess: async () => {
      setConfirm(false);
      setNote('');
      await queryClient.invalidateQueries({ queryKey: ['tenants'] });
      await queryClient.invalidateQueries({ queryKey: ['config', tenantId] });
      push({ title: 'Config version saved' });
    },
  });

  const snapshot = () => {
    if (tab === 'json') {
      try {
        const parsed = JSON.parse(json);
        tenantSettingsSchema.parse(parsed.settings);
        featureFlagsSchema.parse(parsed.feature_flags);
        setJsonError('');
        return parsed;
      } catch (error) {
        setJsonError(error.message);
        return null;
      }
    }
    return draft;
  };

  const currentText = tenant ? JSON.stringify({ settings: tenant.settings, feature_flags: tenant.feature_flags }, null, 2) : '';
  const proposed = tab === 'json' ? (() => { try { return JSON.parse(json); } catch { return null; } })() : draft;
  const changes = proposed ? diffJson(JSON.parse(currentText), proposed) : [];
  const diffSummary = summarizeDiff(changes);

  return (
    <AppLayout role="fde">
      <PageHeader title="Config" eyebrow={tenant?.name} />
      {tenants.isLoading || !draft ? <Skeleton /> : (
        <>
          <Tabs tabs={[{ id: 'form', label: 'Form' }, { id: 'json', label: 'Advanced JSON' }]} value={tab} onChange={setTab} label="Config view" />
          {tab === 'form' ? (
            <form className="card" onSubmit={(event) => event.preventDefault()}>
              <p>Event types</p>
              <div className="chip-row">
                {['in_person', 'virtual', 'hybrid'].map((type) => (
                  <button key={type} type="button" className="chip" aria-pressed={draft.settings.eventTypes.includes(type)} onClick={() => {
                    const has = draft.settings.eventTypes.includes(type);
                    const eventTypes = has ? draft.settings.eventTypes.filter((item) => item !== type) : [...draft.settings.eventTypes, type];
                    setDraft({ ...draft, settings: { ...draft.settings, eventTypes } });
                  }}>{type}</button>
                ))}
              </div>
              <label><input type="checkbox" checked={draft.settings.approvalRequired} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, approvalRequired: event.target.checked } })} /> Approval required</label>
              <label htmlFor="departments">Departments</label>
              <input id="departments" value={draft.settings.departments.join(', ')} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, departments: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) } })} />
              <label htmlFor="hours-start">Working hours start</label>
              <input id="hours-start" value={draft.settings.workingHours.start} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, workingHours: { ...draft.settings.workingHours, start: event.target.value } } })} />
              <label htmlFor="hours-end">Working hours end</label>
              <input id="hours-end" value={draft.settings.workingHours.end} onChange={(event) => setDraft({ ...draft, settings: { ...draft.settings, workingHours: { ...draft.settings.workingHours, end: event.target.value } } })} />
              {Object.keys(draft.feature_flags).map((flag) => (
                <label key={flag}><input type="checkbox" checked={draft.feature_flags[flag]} onChange={(event) => setDraft({ ...draft, feature_flags: { ...draft.feature_flags, [flag]: event.target.checked } })} /> {flag}</label>
              ))}
            </form>
          ) : (
            <>
              <label htmlFor="config-json">Settings JSON</label>
              <textarea id="config-json" className="mono" rows="16" value={json} onChange={(event) => setJson(event.target.value)} />
              {jsonError && <p className="error-message" role="alert">{jsonError}</p>}
            </>
          )}
          <label htmlFor="change-note">Change note</label>
          <input id="change-note" value={note} onChange={(event) => setNote(event.target.value)} />
          <button type="button" className="btn" disabled={!note.trim() || save.isPending || changes.length === 0} onClick={() => snapshot() && setConfirm(true)}>Review changes</button>
          {changes.length === 0 && <p className="muted">No changes to save.</p>}
          <h2>Versions</h2>
          {(versions.data || []).map((version) => (
            <article key={version.version} className="card">
              <p>Version {version.version} · {version.author || 'System'} · {version.note || 'Initial'}</p>
              <RelativeTime value={version.created_at} />
              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setRestore(version)}>Restore</button>
                <button type="button" className="btn btn-ghost" onClick={() => setCompare(version)}>Compare</button>
              </div>
            </article>
          ))}
        </>
      )}
      <Modal open={confirm} title="Save config version?" onClose={() => setConfirm(false)} wide>
        <p>{diffSummary.changed} changed, {diffSummary.added} added, {diffSummary.removed} removed</p>
        <div className="diff-grid"><pre className="mono diff-removed">{currentText}</pre><pre className="mono diff-added">{tab === 'json' ? json : JSON.stringify(draft, null, 2)}</pre></div>
        <button type="button" className="btn" disabled={save.isPending} onClick={() => save.mutate(snapshot())}>{save.isPending ? 'Saving...' : 'Save version'}</button>
      </Modal>
      <ConfirmDialog open={Boolean(restore)} title="Restore this version?" body="The current settings will be replaced." confirmLabel="Restore" onClose={() => setRestore(null)} onConfirm={async () => { await rollbackConfig(tenantId, restore.version); setRestore(null); await queryClient.invalidateQueries({ queryKey: ['tenants'] }); push({ title: 'Version restored' }); }} />
      <Modal open={Boolean(compare)} title="Compare with current" onClose={() => setCompare(null)} wide>
        <pre className="mono">{JSON.stringify(compare?.snapshot, null, 2)}</pre>
      </Modal>
    </AppLayout>
  );
};

export default ConfigEditor;
