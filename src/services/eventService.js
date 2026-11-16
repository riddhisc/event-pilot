import { groupFeedback, isPastEvent, isPublishedUpcoming, shapeAnalytics } from '../lib/analytics';
import { isSupabaseConfigured, useMock } from '../lib/env';
import { inDashboardRange } from '../lib/range';
import { supabase } from '../lib/supabaseClient';
import * as store from '../mock/store';

function sessionUser() {
  try {
    return JSON.parse(localStorage.getItem('eventbuddy.session') || 'null');
  } catch {
    return null;
  }
}

function live() {
  return !useMock && isSupabaseConfigured && supabase;
}

export async function fetchEvents(tenantId = undefined) {
  if (live()) {
    const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: true });
    if (error) throw error;
    const rows = data || [];
    return tenantId ? rows.filter((event) => event.tenant_id === tenantId) : rows;
  }
  const user = sessionUser();
  const tenant = tenantId === undefined ? (user?.role === 'fde' ? null : user?.tenant_id) : tenantId;
  const rows = store.listEvents();
  const scoped = tenant ? rows.filter((event) => event.tenant_id === tenant) : rows;
  const mine = store.listRsvps(user?.id);
  return scoped.map((event) => ({
    ...event,
    rsvpStatus: mine.find((row) => row.event_id === event.id)?.status || 'none',
  }));
}

export async function fetchUpcomingEvents() {
  const events = await fetchEvents();
  return events.filter((event) => isPublishedUpcoming(event));
}

export async function fetchEvent(id) {
  if (live()) {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }
  return store.getEvent(id);
}

export async function createEvent(eventData) {
  const user = sessionUser();
  const payload = { ...eventData };
  if (!payload.tenant_id && user?.tenant_id) payload.tenant_id = user.tenant_id;
  if (live()) {
    const { data, error } = await supabase.from('events').insert(payload).select().single();
    if (error) throw error;
    return data;
  }
  return store.saveEvent(payload);
}

export async function updateEvent(id, eventData) {
  if (live()) {
    const { data, error } = await supabase.from('events').update(eventData).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }
  return store.saveEvent(eventData, id);
}

export async function deleteEvent(id) {
  if (live()) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
  return store.removeEvent(id);
}

export async function restoreEvent(snapshot) {
  if (live()) return createEvent(snapshot);
  return store.restoreEvent(snapshot);
}

export async function duplicateEvent(id) {
  if (live()) {
    const source = await fetchEvent(id);
    if (!source) throw new Error('Event not found');
    const { id: _id, ...rest } = source;
    return createEvent({ ...rest, title: `${source.title} (copy)`, status: 'draft' });
  }
  return store.duplicateEvent(id);
}

export async function cancelEvent(id) {
  if (live()) return updateEvent(id, { status: 'cancelled' });
  return store.setEventStatus(id, 'cancelled');
}

export async function fetchMyEvents() {
  const user = sessionUser();
  const events = await fetchEvents();
  if (live()) {
    const { data, error } = await supabase.from('rsvps').select('event_id, status').eq('user_id', user?.id);
    if (error) throw error;
    return (data || []).map((row) => {
      const event = events.find((item) => item.id === row.event_id);
      return event ? { ...event, rsvpStatus: row.status } : null;
    }).filter(Boolean);
  }
  const mine = store.listRsvps(user?.id);
  return events
    .map((event) => {
      const row = mine.find((item) => item.event_id === event.id);
      return row ? { ...event, rsvpStatus: row.status } : null;
    })
    .filter(Boolean);
}

export async function rsvpToEvent(eventId, status) {
  const user = sessionUser();
  if (!user) throw new Error('Sign in before RSVP');
  const normalized = status === 'attending' ? 'going' : status;
  if (live()) {
    const { data, error } = await supabase.from('rsvps').upsert({
      event_id: eventId,
      user_id: user.id,
      tenant_id: user.tenant_id,
      status: normalized,
    }, { onConflict: 'event_id,user_id' }).select().single();
    if (error) throw error;
    return data;
  }
  return store.upsertRsvp(eventId, user.id, normalized);
}

export async function checkInToEvent(eventId) {
  const user = sessionUser();
  if (!user) throw new Error('Sign in before check-in');
  if (live()) {
    const { data, error } = await supabase.from('rsvps').update({
      checked_in_at: new Date().toISOString(),
    }).eq('event_id', eventId).eq('user_id', user.id).select().single();
    if (error) throw error;
    return data;
  }
  return store.checkIn(eventId, user.id);
}

export async function submitFeedback(eventId, input) {
  const user = sessionUser();
  if (!user) throw new Error('Sign in before sending feedback');
  if (live()) {
    const { data, error } = await supabase.from('feedback').insert({
      event_id: eventId,
      user_id: user.id,
      tenant_id: user.tenant_id,
      rating: input.rating,
      comment: input.comment || '',
    }).select().single();
    if (error) throw error;
    return data;
  }
  return store.addFeedback(eventId, user.id, input);
}

export async function fetchParticipants(eventId) {
  if (live()) {
    const { data, error } = await supabase.from('rsvps').select('user_id, status, profiles(full_name, email)').eq('event_id', eventId);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.user_id,
      name: row.profiles?.full_name || 'Staff',
      email: row.profiles?.email || '',
      status: row.status,
    }));
  }
  const event = store.getEvent(eventId);
  if (!event) return [];
  return store.listPeople(event.tenant_id).slice(0, 3).map((person) => ({ id: person.id, name: person.name, email: person.email }));
}

export async function fetchAttendees(eventId) {
  if (live()) return fetchParticipants(eventId);
  return store.listAttendees(eventId);
}

export async function fetchActivity() {
  const user = sessionUser();
  if (live()) return [];
  return store.listActivity(user?.tenant_id);
}

export async function fetchAttention() {
  const events = await fetchEvents();
  return events.filter((event) => {
    if (event.status === 'cancelled' || event.status === 'draft') return false;
    const capacity = event.capacity || 0;
    if (!capacity) return false;
    const ratio = (event.registered_count || 0) / capacity;
    return ratio < 0.4 || (event.registered_count || 0) >= capacity;
  });
}

export async function fetchScopedAnalytics(tenantId) {
  if (live()) return fetchAnalytics();
  const events = store.listEvents().filter((event) => !tenantId || tenantId === 'all' || event.tenant_id === tenantId);
  const eventIds = new Set(events.map((event) => event.id));
  const feedback = store.listFeedback().filter((row) => eventIds.has(row.event_id));
  const people = !tenantId || tenantId === 'all' ? store.listPeople() : store.listPeople(tenantId);
  return shapeAnalytics(events, people, feedback);
}

export async function fetchAnalytics(range = '90') {
  if (live()) {
    const { data, error } = await supabase.rpc('analytics_summary');
    if (error) throw error;
    return {
      ...(data || {}),
      recentParticipants: (data?.recentParticipants || []).filter((person) => person.role !== 'fde'),
      feedbackData: groupFeedback(data?.feedbackData || []),
    };
  }
  const user = sessionUser();
  const events = store.listEvents()
    .filter((event) => !user?.tenant_id || event.tenant_id === user.tenant_id)
    .filter((event) => inDashboardRange(event.starts_at, range));
  const eventIds = new Set(events.map((event) => event.id));
  const feedback = store.listFeedback().filter((row) => eventIds.has(row.event_id));
  const people = user?.tenant_id ? store.listPeople(user.tenant_id) : store.listPeople();
  return shapeAnalytics(events, people, feedback);
}

export async function fetchNetworkingSuggestions() {
  const user = sessionUser();
  if (live()) {
    const { data, error } = await supabase.rpc('networking_suggestions', { target_user: user?.id });
    if (error) throw error;
    return data || [];
  }
  return store.networkingFor(user?.id);
}

export async function connectWith(personId) {
  const user = sessionUser();
  if (!user) throw new Error('Sign in first');
  if (live()) return { status: 'requested' };
  return { status: store.connectPeople(user.id, personId) };
}

export async function updateStaffStatus(id, status) {
  if (live()) {
    const { error } = await supabase.from('profiles').update({ status }).eq('id', id);
    if (error) throw error;
    return true;
  }
  return store.setPersonStatus(id, status);
}

export async function fetchStaff() {
  if (live()) {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name');
    if (error) throw error;
    return (data || []).map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: profile.role,
      title: profile.title,
      department: profile.department,
      status: profile.status,
      tenant_id: profile.tenant_id,
    })).filter((person) => person.role !== 'fde');
  }
  const user = sessionUser();
  return store.listPeople(user?.role === 'fde' ? undefined : user?.tenant_id);
}

export { isPastEvent };
