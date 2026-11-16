import { describe, expect, it } from 'vitest';
import { groupFeedback, isPublishedUpcoming, shapeAnalytics } from '../lib/analytics';
import { homeFor } from '../lib/roles';
import { featureFlagsSchema, tenantSettingsSchema } from '../lib/schemas';
import { slugify, uniqueSlug } from '../lib/slug';
import { scopeToTenant, withoutFde } from '../lib/tenant';
import { formatDate, formatRelative } from '../utils/dateUtils';
import { pluralize } from '../utils/formatters';
import { eventToIcs } from '../lib/ics';
import { login } from '../services/authService';
import { eventFormSchema } from '../lib/schemas';
import * as store from '../mock/store';

describe('analytics', () => {
  it('returns every field the admin dashboard reads', () => {
    const summary = shapeAnalytics(
      [{
        id: 'evt-1',
        title: 'Demo',
        starts_at: new Date(Date.now() + 86400000).toISOString(),
        ends_at: new Date(Date.now() + 90000000).toISOString(),
        capacity: 10,
        registered_count: 4,
        status: 'published',
      }],
      [{ id: 'user-1', name: 'Sam', email: 'sam@example.com', department: 'Engineering', engagement: 80 }],
      [{ eventName: 'Demo', rating: 5 }],
    );
    expect(summary.totalStaff).toBe(1);
    expect(summary.avgParticipation).toBe(40);
    expect(summary.participationData.length).toBeGreaterThan(0);
    expect(summary.engagementData[0].engagementScore).toBe(80);
    expect(summary.recentParticipants[0].name).toBe('Sam');
    expect(summary.feedbackData[0].avgRating).toBe(5);
    expect(summary.feedbackData[0].eventTitle).toBe('Demo');
    expect(summary.upcomingEvents).toBe(1);
  });

  it('treats a published future event as upcoming', () => {
    expect(isPublishedUpcoming({
      status: 'published',
      starts_at: new Date(Date.now() + 3600000).toISOString(),
    })).toBe(true);
  });
});

describe('event schema', () => {
  it('rejects an end time before the start', () => {
    const parsed = eventFormSchema.safeParse({
      title: 'Retro',
      description: 'Look back',
      starts_at: '2026-12-01T10:00',
      ends_at: '2026-12-01T09:00',
      location: 'Studio',
      capacity: 8,
      type: 'in_person',
      status: 'published',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('mock store', () => {
  it('promotes the waitlist when a seat opens', () => {
    const event = store.saveEvent({
      title: 'Full room',
      description: 'Capacity test',
      starts_at: new Date(Date.now() + 86400000).toISOString(),
      ends_at: new Date(Date.now() + 90000000).toISOString(),
      location: 'Lab',
      capacity: 1,
      type: 'in_person',
      status: 'published',
      waitlist_enabled: true,
    });
    expect(store.upsertRsvp(event.id, 'user-staff', 'going').status).toBe('going');
    expect(store.upsertRsvp(event.id, 'user-lee', 'going').status).toBe('waitlist');
    store.upsertRsvp(event.id, 'user-staff', 'declined');
    const promoted = store.listRsvps('user-lee').find((row) => row.event_id === event.id);
    expect(promoted.status).toBe('going');
  });

  it('keeps networking suggestions inside the caller tenant', () => {
    const suggestions = store.networkingFor('user-staff');
    const names = suggestions.map((person) => person.id);
    expect(names).not.toContain('user-casey');
    expect(names).not.toContain('user-fde');
    expect(suggestions.every((person) => person.email.endsWith('@northwind.example'))).toBe(true);
    expect(names.length).toBeGreaterThan(0);
  });

  it('keeps each tenant on its own email domain and leaves the FDE unassigned', () => {
    const northwind = store.listPeople('tenant-northwind');
    const contoso = store.listPeople('tenant-contoso');
    expect(northwind.every((person) => person.email.endsWith('@northwind.example') && person.role !== 'fde')).toBe(true);
    expect(contoso.every((person) => person.email.endsWith('@contoso.example') && person.role !== 'fde')).toBe(true);
    expect(northwind.map((person) => person.email)).not.toContain('admin@eventbuddy.com');
    expect(store.listAssignments('user-fde').map((row) => row.tenant_id)).toEqual(['tenant-northwind', 'tenant-contoso']);
  });
});

describe('feedback grouping', () => {
  it('returns one row per event with an average rating', () => {
    const rows = groupFeedback([
      { event_id: 'evt-retro', eventName: 'Engineering Retro', rating: 5 },
      { event_id: 'evt-retro', eventName: 'Engineering Retro', rating: 4 },
      { event_id: 'evt-lab', eventName: 'Contoso Lab Hour', rating: 3 },
    ]);
    const retro = rows.find((row) => row.eventId === 'evt-retro');
    expect(rows.filter((row) => row.eventTitle === 'Engineering Retro')).toHaveLength(1);
    expect(retro).toEqual({
      eventId: 'evt-retro',
      eventTitle: 'Engineering Retro',
      avgRating: 4.5,
      responseCount: 2,
    });
  });
});

describe('copy helpers', () => {
  it('pluralizes a single completed event', () => {
    expect(pluralize(1, 'completed event')).toBe('1 completed event');
    expect(pluralize(2, 'completed event')).toBe('2 completed events');
  });

  it('formats dates for the user locale instead of raw ISO', () => {
    const stamp = '2026-11-15T03:30:00.000Z';
    expect(formatDate(stamp)).not.toContain('T');
    expect(formatDate(stamp)).not.toContain('Z');
    const now = new Date('2026-11-16T03:30:00.000Z');
    expect(formatRelative(stamp, now, 'en')).toMatch(/yesterday|day/i);
  });
});

describe('tenant selectors', () => {
  it('keeps a Northwind admin away from Contoso data and FDE users', () => {
    const people = withoutFde(scopeToTenant(store.listPeople('tenant-northwind'), 'tenant-northwind'));
    const events = scopeToTenant(store.listEvents(), 'tenant-northwind');
    expect(people.every((person) => person.email.endsWith('@northwind.example') && person.role !== 'fde')).toBe(true);
    expect(events.every((event) => event.tenant_id === 'tenant-northwind')).toBe(true);
    expect(events.map((event) => event.id)).not.toContain('evt-lab');
    expect(people.map((person) => person.id)).not.toContain('user-fde');
    expect(people.map((person) => person.id)).not.toContain('user-casey');
  });
});

describe('slug and config', () => {
  it('builds a unique lowercase slug', () => {
    expect(slugify('Northwind Offices')).toBe('northwind-offices');
    expect(uniqueSlug('Northwind', ['northwind'])).toBe('northwind-2');
  });

  it('rejects config that does not match the schema', () => {
    const settings = tenantSettingsSchema.safeParse({ eventTypes: [], approvalRequired: true, departments: [], workingHours: { start: '9', end: '17:00' }, branding: { brandColor: 'red' }, notificationTemplates: { reminder: '' } });
    const flags = featureFlagsSchema.safeParse({ aiAssist: 'yes' });
    expect(settings.success).toBe(false);
    expect(flags.success).toBe(false);
  });
});

describe('role homes', () => {
  it('sends each role to its own home', () => {
    expect(homeFor({ role: 'admin' })).toBe('/admin/dashboard');
    expect(homeFor({ role: 'staff' })).toBe('/staff/dashboard');
    expect(homeFor({ role: 'fde' })).toBe('/fde');
  });
});

describe('calendar export', () => {
  it('builds an ics document', () => {
    const text = eventToIcs({
      id: 'evt-1',
      title: 'Summit',
      starts_at: '2026-12-01T15:00:00.000Z',
      ends_at: '2026-12-01T16:00:00.000Z',
      location: 'Atrium',
      description: 'Hello',
    });
    expect(text).toContain('SUMMARY:Summit');
    expect(text).toContain('BEGIN:VCALENDAR');
  });
});

describe('mock login', () => {
  it('rejects a password that does not match', async () => {
    await expect(login({ email: 'admin@eventbuddy.com', password: 'not-the-password' })).rejects.toThrow(/do not match/i);
  });
});
