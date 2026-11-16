import { featureFlagsSchema, tenantSettingsSchema } from '../lib/schemas';
import { isSupabaseConfigured, useMock } from '../lib/env';
import { supabase } from '../lib/supabaseClient';
import * as store from '../mock/store';

function live() {
  return !useMock && isSupabaseConfigured && supabase;
}

export async function fetchTenants() {
  if (live()) {
    const { data, error } = await supabase.from('tenants').select('*').order('name');
    if (error) throw error;
    return data || [];
  }
  return store.listTenants();
}

export async function updateTenantStatus(id, status) {
  if (live()) {
    const { error } = await supabase.from('tenants').update({ status }).eq('id', id);
    if (error) throw error;
    return true;
  }
  return store.updateTenant(id, { status });
}

export async function provisionTenant(input) {
  const settings = tenantSettingsSchema.parse(input.settings);
  const feature_flags = featureFlagsSchema.parse(input.feature_flags || {
    aiAssist: false,
    waitlist: true,
    reminders: true,
    recurringEvents: true,
  });
  if (live()) {
    const { data, error } = await supabase.rpc('provision_tenant', {
      tenant_name: input.name,
      tenant_slug: input.slug,
      tenant_settings: settings,
      tenant_flags: feature_flags,
    });
    if (error) throw error;
    return data;
  }
  return store.addTenant({ ...input, settings, feature_flags });
}

export async function fetchOnboarding(tenantId) {
  if (live()) {
    const { data, error } = await supabase.from('onboarding_tasks').select('*').eq('tenant_id', tenantId).order('title');
    if (error) throw error;
    return data || [];
  }
  return store.listOnboarding(tenantId);
}

export async function completeOnboardingTask(tenantId, key) {
  if (live()) {
    const { error } = await supabase.from('onboarding_tasks').update({
      status: 'done',
      completed_at: new Date().toISOString(),
    }).eq('tenant_id', tenantId).eq('key', key);
    if (error) throw error;
    return true;
  }
  store.setOnboarding(tenantId, key, 'done');
  return true;
}

export async function fetchIntegrations(tenantId) {
  if (live()) {
    const { data, error } = await supabase.from('integrations').select('id, tenant_id, provider, status, last_sync_at, last_error, config').eq('tenant_id', tenantId);
    if (error) throw error;
    return data || [];
  }
  return store.listIntegrations(tenantId);
}

export async function runIntegration(id, action) {
  if (live()) {
    const { data, error } = await supabase.functions.invoke('integration-connect', { body: { integrationId: id, action } });
    if (error) throw error;
    return data;
  }
  const status = action === 'disconnect' ? 'pending' : 'active';
  store.setIntegrationStatus(id, status, action === 'test' ? '' : '');
  return { status };
}

export async function fetchWebhookDeliveries(tenantId) {
  if (live()) {
    const { data, error } = await supabase.from('webhook_deliveries').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return store.listDeliveries(tenantId);
}

export async function replayWebhook(id) {
  if (live()) {
    const { data, error } = await supabase.functions.invoke('webhook-dispatch', { body: { deliveryId: id, replay: true } });
    if (error) throw error;
    return data;
  }
  store.replayDelivery(id);
  return { status_code: 200 };
}

export function previewInvites(text) {
  const seen = new Set();
  return String(text || '')
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((email) => {
      let error = '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Enter a valid email';
      else if (seen.has(email.toLowerCase())) error = 'Duplicate email';
      seen.add(email.toLowerCase());
      return { email, error };
    });
}

export function previewStaffImport(csv) {
  const lines = String(csv || '').trim().split(/\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const columns = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
  return lines.slice(1).map((line, index) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const record = Object.fromEntries(columns.map((column, cellIndex) => [column, cells[cellIndex] || '']));
    const errors = [];
    if (!record.name) errors.push('Name is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email || '')) errors.push('Invalid email');
    if (record.role && !['admin', 'staff'].includes(record.role)) errors.push('Role must be admin or staff');
    return { row: index + 2, name: record.name || '', email: record.email || '', role: record.role || 'staff', department: record.department || '', errors };
  });
}

export async function fetchSyncRuns(integrationId) {
  if (live()) return [];
  return store.listSyncRuns(integrationId);
}

export async function fetchAdoptionTrend(tenantId) {
  if (live()) return [];
  return store.adoptionTrend(tenantId);
}

export async function saveConfig(tenantId, snapshot, meta = {}) {
  const settings = tenantSettingsSchema.parse(snapshot.settings);
  const feature_flags = featureFlagsSchema.parse(snapshot.feature_flags);
  if (live()) {
    const { data, error } = await supabase.from('config_versions').insert({
      tenant_id: tenantId,
      snapshot: { settings, feature_flags },
    }).select().single();
    if (error) throw error;
    await supabase.from('tenants').update({ settings, feature_flags }).eq('id', tenantId);
    return data;
  }
  return store.pushConfigVersion(tenantId, { settings, feature_flags }, meta);
}

export async function fetchConfigVersions(tenantId) {
  if (live()) {
    const { data, error } = await supabase.from('config_versions').select('*').eq('tenant_id', tenantId).order('version', { ascending: false });
    if (error) throw error;
    return data || [];
  }
  return store.listConfigVersions(tenantId);
}

export async function rollbackConfig(tenantId, version) {
  if (live()) {
    const versions = await fetchConfigVersions(tenantId);
    const match = versions.find((item) => item.version === version);
    if (!match) throw new Error('Version not found');
    const { error } = await supabase.from('tenants').update(match.snapshot).eq('id', tenantId);
    if (error) throw error;
    return match;
  }
  return store.rollbackConfig(tenantId, version);
}

export async function impersonateUser(user) {
  const reason = String(user.reason || '').trim();
  if (!reason) throw new Error('A reason is required before impersonation.');
  if (user.role === 'fde') throw new Error('You cannot impersonate another FDE.');
  const minutes = [15, 30, 60].includes(Number(user.minutes)) ? Number(user.minutes) : 15;
  if (live()) {
    const { data, error } = await supabase.functions.invoke('fde-impersonate', {
      body: { userId: user.id, tenantId: user.tenant_id, reason, minutes },
    });
    if (error) throw error;
    return data;
  }
  store.addAudit({
    tenant_id: user.tenant_id,
    actor: 'Finn Deployed',
    action: 'impersonate.start',
    entity: 'profiles',
    entity_id: user.id,
    reason,
  });
  return {
    user_id: user.id,
    expires_at: new Date(Date.now() + minutes * 60 * 1000).toISOString(),
    minutes,
  };
}

export async function endImpersonation(user) {
  if (!user) return true;
  if (!live()) {
    store.addAudit({
      tenant_id: user.tenant_id,
      actor: 'Finn Deployed',
      action: 'impersonate.end',
      entity: 'profiles',
      entity_id: user.id,
    });
  }
  return true;
}

export async function fetchAudit() {
  if (live()) {
    const { data, error } = await supabase.from('audit_log').select('id, tenant_id, action, entity, entity_id, created_at').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  }
  return store.listAudit();
}

export async function resendInvite(email) {
  if (live()) {
    const { data, error } = await supabase.functions.invoke('invite-users', { body: { emails: [email] } });
    if (error) throw error;
    return data;
  }
  return { queued: [email] };
}

export async function askEventData(tenantId, question) {
  if (live()) {
    const { data, error } = await supabase.functions.invoke('ai-assist', {
      body: { tenantId, mode: 'ask', input: question },
    });
    if (error) throw error;
    return data;
  }
  return {
    rpc: question.toLowerCase().includes('feedback') ? 'feedback_summary' : 'analytics_summary',
    answer: 'Mock mode does not call a model. With Supabase, this question is mapped to a whitelisted read-only RPC.',
  };
}

const defaultSettings = store.listTenants()[0].settings;
const defaultFlags = store.listTenants()[0].feature_flags;

export { defaultFlags, defaultSettings };
