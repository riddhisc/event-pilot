function atOffset(days, hours, minutes) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

export const TENANTS = [
  {
    id: 'tenant-northwind',
    name: 'Northwind Offices',
    slug: 'northwind',
    plan: 'team',
    brand_color: '#FE2C23',
    health: 86,
    last_sync: atOffset(-1, 9, 0),
    adoption: 72,
    open_issues: 1,
    settings: {
      eventTypes: ['in_person', 'virtual', 'hybrid'],
      approvalRequired: false,
      departments: ['Engineering', 'People', 'Design'],
      workingHours: { start: '09:00', end: '17:00' },
      branding: { brandColor: '#FE2C23' },
      notificationTemplates: { reminder: 'Reminder: {{title}} starts soon.' },
    },
    feature_flags: {
      aiAssist: false,
      waitlist: true,
      reminders: true,
      recurringEvents: true,
    },
  },
  {
    id: 'tenant-contoso',
    name: 'Contoso Labs',
    slug: 'contoso',
    plan: 'enterprise',
    brand_color: '#1d4ed8',
    health: 64,
    last_sync: atOffset(-3, 11, 30),
    adoption: 41,
    open_issues: 3,
    settings: {
      eventTypes: ['virtual', 'hybrid'],
      approvalRequired: true,
      departments: ['Research', 'Ops'],
      workingHours: { start: '08:00', end: '16:00' },
      branding: { brandColor: '#1d4ed8' },
      notificationTemplates: { reminder: '{{title}} is coming up for Contoso.' },
    },
    feature_flags: {
      aiAssist: true,
      waitlist: true,
      reminders: true,
      recurringEvents: false,
    },
  },
];

const PEOPLE = [
  {
    id: 'user-admin',
    tenant_id: 'tenant-northwind',
    name: 'Avery Admin',
    email: 'avery@northwind.example',
    role: 'admin',
    status: 'active',
    title: 'Workplace Lead',
    department: 'People',
    interests: ['facilitation', 'culture'],
    engagement: 80,
  },
  {
    id: 'user-staff',
    tenant_id: 'tenant-northwind',
    name: 'Sam Staff',
    email: 'sam@northwind.example',
    role: 'staff',
    status: 'active',
    title: 'Engineer',
    department: 'Engineering',
    interests: ['design', 'technology'],
    engagement: 74,
  },
  {
    id: 'user-fde',
    tenant_id: null,
    name: 'Finn Deployed',
    email: 'fde@eventbuddy.com',
    role: 'fde',
    status: 'active',
    title: 'Forward Deployed Engineer',
    department: 'Platform',
    interests: ['integrations'],
    engagement: 90,
  },
  {
    id: 'user-lee',
    tenant_id: 'tenant-northwind',
    name: 'Lee Chen',
    email: 'lee@northwind.example',
    role: 'staff',
    status: 'active',
    title: 'Product Designer',
    department: 'Design',
    interests: ['design', 'workshop'],
    engagement: 88,
  },
  {
    id: 'user-jordan',
    tenant_id: 'tenant-northwind',
    name: 'Jordan Patel',
    email: 'jordan@northwind.example',
    role: 'staff',
    status: 'active',
    title: 'Software Engineer',
    department: 'Engineering',
    interests: ['technology', 'networking'],
    engagement: 69,
  },
  {
    id: 'user-riley',
    tenant_id: 'tenant-northwind',
    name: 'Riley North',
    email: 'riley@northwind.example',
    role: 'staff',
    status: 'invited',
    title: 'People Partner',
    department: 'People',
    interests: ['culture'],
    engagement: 40,
  },
  {
    id: 'user-morgan',
    tenant_id: 'tenant-contoso',
    name: 'Morgan Hale',
    email: 'morgan@contoso.example',
    role: 'admin',
    status: 'active',
    title: 'Lab Director',
    department: 'Ops',
    interests: ['operations'],
    engagement: 61,
  },
  {
    id: 'user-casey',
    tenant_id: 'tenant-contoso',
    name: 'Casey Contoso',
    email: 'casey@contoso.example',
    role: 'staff',
    status: 'active',
    title: 'Researcher',
    department: 'Research',
    interests: ['technology'],
    engagement: 55,
  },
  {
    id: 'user-pat',
    tenant_id: 'tenant-contoso',
    name: 'Pat Nguyen',
    email: 'pat@contoso.example',
    role: 'staff',
    status: 'invited',
    title: 'Research Associate',
    department: 'Research',
    interests: ['technology'],
    engagement: 30,
  },
];

const ASSIGNMENTS = [
  { user_id: 'user-fde', tenant_id: 'tenant-northwind' },
  { user_id: 'user-fde', tenant_id: 'tenant-contoso' },
];

PEOPLE.forEach((person, index) => {
  person.last_active = person.last_active || atOffset(-(index + 1), 9, 15);
  person.status = person.status || 'active';
});

TENANTS.forEach((tenant) => {
  tenant.status = tenant.status || 'active';
});

let events = [
  {
    id: 'evt-summit',
    tenant_id: 'tenant-northwind',
    title: 'Quarterly Product Summit',
    description: 'Company-wide look at the roadmap, demos, and team sessions.',
    starts_at: atOffset(7, 9, 0),
    ends_at: atOffset(7, 16, 0),
    location: 'HQ atrium',
    capacity: 120,
    registered_count: 48,
    type: 'hybrid',
    status: 'published',
    timezone: 'America/New_York',
    meeting_url: 'https://meet.example.com/summit',
    waitlist_enabled: true,
    recurrence_rule: '',
    tags: ['company', 'roadmap'],
    agenda: ['Welcome', 'Roadmap', 'Team sessions'],
  },
  {
    id: 'evt-workshop',
    tenant_id: 'tenant-northwind',
    title: 'Design Thinking Workshop',
    description: 'Hands-on workshop for cross-team problem framing.',
    starts_at: atOffset(14, 10, 0),
    ends_at: atOffset(14, 12, 30),
    location: 'Studio 2',
    capacity: 24,
    registered_count: 24,
    type: 'in_person',
    status: 'published',
    timezone: 'America/New_York',
    meeting_url: '',
    waitlist_enabled: true,
    recurrence_rule: '',
    tags: ['design', 'workshop'],
    agenda: ['Framing', 'Sketching', 'Share-out'],
  },
  {
    id: 'evt-retro',
    tenant_id: 'tenant-northwind',
    title: 'Engineering Retro',
    description: 'A completed retro used for analytics and feedback.',
    starts_at: atOffset(-12, 15, 0),
    ends_at: atOffset(-12, 16, 0),
    location: 'Video room',
    capacity: 40,
    registered_count: 31,
    type: 'virtual',
    status: 'completed',
    timezone: 'America/New_York',
    meeting_url: 'https://meet.example.com/retro',
    waitlist_enabled: false,
    recurrence_rule: 'weekly',
    tags: ['engineering'],
    agenda: ['What worked', 'What to change'],
  },
  {
    id: 'evt-lab',
    tenant_id: 'tenant-contoso',
    title: 'Contoso Lab Hour',
    description: 'A Contoso-only working session.',
    starts_at: atOffset(9, 11, 0),
    ends_at: atOffset(9, 12, 0),
    location: 'Lab 4',
    capacity: 16,
    registered_count: 6,
    type: 'virtual',
    status: 'published',
    timezone: 'America/Chicago',
    meeting_url: 'https://meet.contoso.example/lab',
    waitlist_enabled: true,
    recurrence_rule: '',
    tags: ['research'],
    agenda: ['Lab update', 'Questions'],
  },
];

const EVENTS_STORAGE_KEY = 'eventbuddy.mock.events';
try {
  const savedEvents = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(EVENTS_STORAGE_KEY) || 'null') : null;
  if (Array.isArray(savedEvents)) events = savedEvents;
} catch {
  // Ignore malformed mock storage and use the fixtures.
}

function persistEvents() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Storage is optional in tests and restricted browser contexts.
  }
}

let rsvps = [
  { event_id: 'evt-summit', user_id: 'user-staff', status: 'going', checked_in_at: null, created_at: atOffset(-1, 11, 0) },
  { event_id: 'evt-workshop', user_id: 'user-lee', status: 'going', checked_in_at: null, created_at: atOffset(-2, 15, 0) },
  { event_id: 'evt-summit', user_id: 'user-jordan', status: 'maybe', checked_in_at: null, created_at: atOffset(-3, 10, 0) },
  { event_id: 'evt-lab', user_id: 'user-casey', status: 'going', checked_in_at: null, created_at: atOffset(-1, 8, 0) },
];

let feedback = [
  { id: 'fb-1', event_id: 'evt-retro', user_id: 'user-staff', rating: 5, comment: 'Clear actions.', eventName: 'Engineering Retro' },
  { id: 'fb-2', event_id: 'evt-retro', user_id: 'user-jordan', rating: 4, comment: 'Could be shorter.', eventName: 'Engineering Retro' },
  { id: 'fb-3', event_id: 'evt-lab', user_id: 'user-casey', rating: 3, comment: 'Useful for the lab.', eventName: 'Contoso Lab Hour' },
];

let messages = [
  {
    id: 'msg-1',
    eventId: 'evt-summit',
    senderId: 'user-lee',
    senderName: 'Lee Chen',
    text: 'I can bring the demo laptop.',
    timestamp: atOffset(-1, 11, 0),
  },
];

let notifications = [
  {
    id: 'ntf-1',
    user_id: 'user-staff',
    type: 'reminder',
    message: 'Quarterly Product Summit is coming up.',
    read: false,
    createdAt: atOffset(0, 8, 0),
  },
  {
    id: 'ntf-2',
    user_id: 'user-admin',
    type: 'feedback',
    message: 'New feedback was posted for Engineering Retro.',
    read: false,
    createdAt: atOffset(-1, 17, 0),
  },
];

let configVersions = {
  'tenant-northwind': [
    { version: 1, snapshot: { settings: TENANTS[0].settings, feature_flags: TENANTS[0].feature_flags }, created_at: atOffset(-20, 9, 0) },
  ],
  'tenant-contoso': [
    { version: 1, snapshot: { settings: TENANTS[1].settings, feature_flags: TENANTS[1].feature_flags }, created_at: atOffset(-15, 9, 0) },
  ],
};

let onboarding = {
  'tenant-northwind': [
    ['create', 'Create tenant', 'done', 'Finn Deployed', atOffset(-20, 9, 0)],
    ['sso', 'Configure SSO', 'done', 'Finn Deployed', atOffset(-18, 9, 0)],
    ['import', 'Import staff', 'done', 'Finn Deployed', atOffset(-16, 9, 0)],
    ['integrations', 'Connect Slack and calendar', 'in_progress', 'Finn Deployed', null],
    ['branding', 'Branding and templates', 'pending', '', null],
    ['test_event', 'Create and run a test event', 'pending', '', null],
    ['golive', 'Go-live sign-off', 'pending', '', null],
  ],
  'tenant-contoso': [
    ['create', 'Create tenant', 'done', 'Finn Deployed', atOffset(-15, 9, 0)],
    ['sso', 'Configure SSO', 'pending', '', null],
    ['import', 'Import staff', 'pending', '', null],
    ['integrations', 'Connect Slack and calendar', 'pending', '', null],
    ['branding', 'Branding and templates', 'pending', '', null],
    ['test_event', 'Create and run a test event', 'pending', '', null],
    ['golive', 'Go-live sign-off', 'pending', '', null],
  ],
};

let integrations = [
  { id: 'int-slack', tenant_id: 'tenant-northwind', provider: 'slack', status: 'active', last_sync_at: atOffset(-1, 9, 0), last_error: '' },
  { id: 'int-gcal', tenant_id: 'tenant-northwind', provider: 'gcal', status: 'error', last_sync_at: atOffset(-4, 9, 0), last_error: 'Calendar token needs re-auth.' },
  { id: 'int-oidc', tenant_id: 'tenant-contoso', provider: 'oidc', status: 'pending', last_sync_at: null, last_error: '' },
];

let deliveries = [
  {
    id: 'wh-1',
    tenant_id: 'tenant-northwind',
    event: 'rsvp.created',
    endpoint: 'https://example.invalid/eventbuddy',
    status_code: 500,
    attempts: 2,
    last_attempt_at: atOffset(-1, 16, 0),
    next_retry_at: atOffset(0, 12, 0),
    payload: { event: 'rsvp.created', event_id: 'evt-summit' },
    response: { ok: false, error: 'upstream timeout' },
  },
  {
    id: 'wh-2',
    tenant_id: 'tenant-contoso',
    event: 'event.published',
    endpoint: 'https://example.invalid/contoso',
    status_code: 200,
    attempts: 1,
    last_attempt_at: atOffset(-3, 11, 0),
    next_retry_at: null,
    payload: { event: 'event.published', event_id: 'evt-lab' },
    response: { ok: true },
  },
];

let syncRuns = [
  { id: 'run-1', integration_id: 'int-slack', status: 'success', duration_ms: 840, at: atOffset(-1, 9, 0) },
  { id: 'run-2', integration_id: 'int-gcal', status: 'error', duration_ms: 2100, at: atOffset(-4, 9, 0) },
  { id: 'run-3', integration_id: 'int-slack', status: 'success', duration_ms: 760, at: atOffset(-5, 9, 0) },
];

let audit = [
  { id: 'aud-1', tenant_id: 'tenant-northwind', actor: 'Finn Deployed', action: 'tenant.view', entity: 'tenants', at: atOffset(-2, 10, 0) },
  { id: 'aud-2', tenant_id: 'tenant-contoso', actor: 'Finn Deployed', action: 'integration.test', entity: 'integrations', at: atOffset(-3, 11, 20) },
  { id: 'aud-3', tenant_id: 'tenant-northwind', actor: 'Avery Admin', action: 'event.publish', entity: 'events', at: atOffset(-6, 14, 0) },
];

let connections = {};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function listEvents() {
  return clone(events);
}

export function getEvent(id) {
  return clone(events.find((event) => event.id === id) || null);
}

export function saveEvent(input, id) {
  if (id) {
    events = events.map((event) => (event.id === id ? { ...event, ...input, id } : event));
    persistEvents();
    return getEvent(id);
  }
  const created = {
    registered_count: 0,
    tenant_id: 'tenant-northwind',
    timezone: 'America/New_York',
    meeting_url: '',
    waitlist_enabled: true,
    tags: [],
    ...input,
    id: crypto.randomUUID(),
  };
  events = [created, ...events];
  persistEvents();
  return clone(created);
}

export function removeEvent(id) {
  const removed = events.find((event) => event.id === id) || null;
  events = events.filter((event) => event.id !== id);
  persistEvents();
  return clone(removed);
}

export function restoreEvent(snapshot) {
  if (!snapshot) return null;
  events = [snapshot, ...events.filter((event) => event.id !== snapshot.id)];
  persistEvents();
  return clone(snapshot);
}

export function duplicateEvent(id) {
  const source = events.find((event) => event.id === id);
  if (!source) throw new Error('Event not found');
  return saveEvent({
    ...source,
    id: undefined,
    title: `${source.title} (copy)`,
    status: 'draft',
    registered_count: 0,
  });
}

export function setEventStatus(id, status) {
  events = events.map((event) => (event.id === id ? { ...event, status } : event));
  persistEvents();
  return getEvent(id);
}

export function listRsvps(userId) {
  return rsvps.filter((row) => row.user_id === userId);
}

export function upsertRsvp(eventId, userId, status) {
  const event = events.find((item) => item.id === eventId);
  if (!event) throw new Error('Event not found');
  const existing = rsvps.find((row) => row.event_id === eventId && row.user_id === userId);
  let nextStatus = status;
  if (status === 'going' && event.waitlist_enabled && event.registered_count >= event.capacity && existing?.status !== 'going') {
    nextStatus = 'waitlist';
  }
  if (existing) {
    if (existing.status === 'going' && nextStatus !== 'going') event.registered_count = Math.max(0, event.registered_count - 1);
    if (existing.status !== 'going' && nextStatus === 'going') event.registered_count += 1;
    existing.status = nextStatus;
  } else {
    rsvps.push({ event_id: eventId, user_id: userId, status: nextStatus, checked_in_at: null, created_at: new Date().toISOString() });
    if (nextStatus === 'going') event.registered_count += 1;
  }
  if (nextStatus === 'declined') promoteWaitlist(eventId);
  persistEvents();
  return { event: getEvent(eventId), status: nextStatus };
}

function promoteWaitlist(eventId) {
  const event = events.find((item) => item.id === eventId);
  if (!event || event.registered_count >= event.capacity) return;
  const waiting = rsvps.find((row) => row.event_id === eventId && row.status === 'waitlist');
  if (!waiting) return;
  waiting.status = 'going';
  event.registered_count += 1;
  notifications.unshift({
    id: crypto.randomUUID(),
    user_id: waiting.user_id,
    type: 'waitlist',
    message: `A seat opened for ${event.title}. You are now going.`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}

export function checkIn(eventId, userId) {
  const row = rsvps.find((item) => item.event_id === eventId && item.user_id === userId);
  if (!row) throw new Error('RSVP before checking in');
  row.checked_in_at = new Date().toISOString();
  return clone(row);
}

export function addFeedback(eventId, userId, input) {
  const event = events.find((item) => item.id === eventId);
  const row = { id: crypto.randomUUID(), event_id: eventId, user_id: userId, eventName: event?.title || 'Event', ...input };
  feedback = [row, ...feedback];
  return clone(row);
}

export function listPeople(tenantId) {
  const rows = PEOPLE.filter((person) => {
    if (person.role === 'fde' || !person.tenant_id) return false;
    return tenantId ? person.tenant_id === tenantId : true;
  });
  return clone(rows);
}

export function listAssignments(userId) {
  const rows = userId ? ASSIGNMENTS.filter((row) => row.user_id === userId) : ASSIGNMENTS;
  return clone(rows);
}

export function listFeedback() {
  return clone(feedback);
}

export function listMessages(eventId) {
  return clone(messages.filter((message) => message.eventId === eventId));
}

export function addMessage(message) {
  const row = { id: crypto.randomUUID(), timestamp: new Date().toISOString(), ...message };
  messages.push(row);
  return clone(row);
}

const chatListeners = new Map();

export function subscribeMessages(eventId, callback) {
  const list = chatListeners.get(eventId) || new Set();
  list.add(callback);
  chatListeners.set(eventId, list);
  return () => list.delete(callback);
}

export function publishMessage(message) {
  const row = addMessage(message);
  (chatListeners.get(message.eventId) || []).forEach((callback) => callback(row));
  return row;
}

export function listNotifications(userId) {
  return clone(notifications.filter((item) => !userId || item.user_id === userId));
}

export function markNotification(id, userId) {
  notifications = notifications.map((item) => (
    item.id === id && item.user_id === userId ? { ...item, read: true } : item
  ));
}

export function markAllNotifications(userId) {
  notifications = notifications.map((item) => (
    item.user_id === userId ? { ...item, read: true } : item
  ));
}

export function listTenants() {
  return clone(TENANTS);
}

export function updateTenant(id, patch) {
  const tenant = TENANTS.find((item) => item.id === id);
  if (!tenant) throw new Error('Tenant not found');
  Object.assign(tenant, patch);
  return clone(tenant);
}

export function addTenant(input) {
  const tenant = {
    id: crypto.randomUUID(),
    plan: 'team',
    brand_color: input.settings?.branding?.brandColor || '#FE2C23',
    health: 100,
    last_sync: null,
    adoption: 0,
    open_issues: 0,
    feature_flags: { aiAssist: false, waitlist: true, reminders: true, recurringEvents: true },
    ...input,
  };
  TENANTS.push(tenant);
  onboarding[tenant.id] = onboarding['tenant-contoso'].map(([key, title]) => [key, title, key === 'create' ? 'done' : 'pending']);
  configVersions[tenant.id] = [];
  return clone(tenant);
}

export function listOnboarding(tenantId) {
  const rows = onboarding[tenantId] || [];
  return rows.map(([key, title, status, owner, completed_at]) => ({
    key,
    title,
    status,
    owner: owner || '',
    completed_at: completed_at || null,
  }));
}

export function setOnboarding(tenantId, key, status, extra = {}) {
  const rows = onboarding[tenantId];
  if (!rows) return;
  const row = rows.find((item) => item[0] === key);
  if (!row) return;
  row[2] = status;
  if (extra.owner) row[3] = extra.owner;
  if (status === 'done') row[4] = new Date().toISOString();
}

export function setPersonStatus(id, status) {
  const person = PEOPLE.find((item) => item.id === id);
  if (!person || person.role === 'fde') throw new Error('Person not found');
  person.status = status;
  return clone(person);
}

export function listIntegrations(tenantId) {
  return clone(integrations.filter((item) => !tenantId || item.tenant_id === tenantId));
}

export function setIntegrationStatus(id, status, lastError = '') {
  const started = Date.now();
  integrations = integrations.map((item) => (
    item.id === id ? { ...item, status, last_error: lastError, last_sync_at: new Date().toISOString() } : item
  ));
  syncRuns = [
    { id: crypto.randomUUID(), integration_id: id, status: status === 'error' ? 'error' : 'success', duration_ms: Date.now() - started + 400, at: new Date().toISOString() },
    ...syncRuns,
  ].slice(0, 10);
}

export function listSyncRuns(integrationId) {
  return clone(syncRuns.filter((run) => run.integration_id === integrationId).slice(0, 10));
}

export function listDeliveries(tenantId) {
  return clone(deliveries.filter((item) => item.tenant_id === tenantId));
}

export function replayDelivery(id) {
  deliveries = deliveries.map((item) => (
    item.id === id ? { ...item, status_code: 200, attempts: item.attempts + 1 } : item
  ));
}

export function listConfigVersions(tenantId) {
  return clone(configVersions[tenantId] || []);
}

export function pushConfigVersion(tenantId, snapshot, meta = {}) {
  const versions = configVersions[tenantId] || [];
  const version = versions.length + 1;
  versions.push({
    version,
    snapshot,
    created_at: new Date().toISOString(),
    note: meta.note || '',
    author: meta.author || 'Finn Deployed',
  });
  configVersions[tenantId] = versions;
  updateTenant(tenantId, snapshot);
  return version;
}

export function rollbackConfig(tenantId, version) {
  const match = (configVersions[tenantId] || []).find((item) => item.version === version);
  if (!match) throw new Error('Version not found');
  updateTenant(tenantId, match.snapshot);
  return clone(match);
}

export function listAudit() {
  return clone(audit);
}

export function addAudit(entry) {
  audit.unshift({ id: crypto.randomUUID(), at: new Date().toISOString(), ...entry });
}

function titleCase(value) {
  return String(value || '').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function listActivity(tenantId) {
  return rsvps
    .map((row) => {
      const person = PEOPLE.find((item) => item.id === row.user_id);
      const event = events.find((item) => item.id === row.event_id);
      if (!person || !event || person.role === 'fde') return null;
      if (tenantId && event.tenant_id !== tenantId) return null;
      return {
        id: `${row.event_id}-${row.user_id}`,
        name: person.name,
        email: person.email,
        status: row.status,
        eventTitle: event.title,
        at: row.created_at,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.at) - new Date(a.at));
}

export function listAttendees(eventId) {
  return rsvps
    .filter((row) => row.event_id === eventId)
    .map((row) => {
      const person = PEOPLE.find((item) => item.id === row.user_id);
      if (!person || person.role === 'fde') return null;
      return {
        id: person.id,
        name: person.name,
        email: person.email,
        title: person.title,
        department: person.department,
        status: row.status,
        checked_in_at: row.checked_in_at,
      };
    })
    .filter(Boolean);
}

export function connectPeople(userId, otherId) {
  const mine = connections[userId] || {};
  mine[otherId] = mine[otherId] === 'requested' ? 'connected' : 'requested';
  connections[userId] = mine;
  return mine[otherId];
}

export function adoptionTrend(tenantId) {
  const tenants = !tenantId || tenantId === 'all' ? TENANTS : TENANTS.filter((tenant) => tenant.id === tenantId);
  const weeks = [];
  for (let index = 11; index >= 0; index -= 1) {
    const when = new Date();
    when.setDate(when.getDate() - index * 7);
    const label = when.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const adoption = tenants.reduce((sum, tenant) => sum + (tenant.adoption || 0), 0) / (tenants.length || 1);
    weeks.push({
      week: label,
      dau: Math.round(adoption * 1.2 + (11 - index)),
      wau: Math.round(adoption * 3 + (11 - index) * 2),
      rsvp: Math.max(0, Math.min(100, Math.round(adoption - index + 8))),
    });
  }
  return weeks;
}

export function networkingFor(userId) {
  const me = PEOPLE.find((person) => person.id === userId) || PEOPLE[1];
  const mine = connections[userId] || {};
  return PEOPLE
    .filter((person) => person.id !== me.id && person.role !== 'fde' && person.tenant_id && person.tenant_id === me.tenant_id)
    .map((person) => {
      const commonInterests = person.interests
        .filter((interest) => me.interests.includes(interest))
        .map(titleCase);
      const commonEvents = events
        .filter((event) => event.tenant_id === me.tenant_id && rsvps.some((row) => row.event_id === event.id && row.user_id === person.id && (row.status === 'going' || row.status === 'maybe')))
        .map((event) => event.title);
      const sameDepartment = person.department === me.department;
      const score = Math.min(100, commonInterests.length * 30 + commonEvents.length * 20 + (sameDepartment ? 20 : 10));
      const reasons = [
        ...commonInterests.map((interest) => interest),
        ...commonEvents.map((title) => title),
        ...(sameDepartment ? [person.department] : []),
      ];
      return {
        id: person.id,
        name: person.name,
        email: person.email,
        title: person.title,
        department: person.department,
        commonInterests,
        commonEvents,
        reasons,
        score,
        connection: mine[person.id] || '',
      };
    })
    .sort((a, b) => b.score - a.score);
}
