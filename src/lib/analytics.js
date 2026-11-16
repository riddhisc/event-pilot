export function isPublishedUpcoming(event, now = new Date()) {
  return event.status === 'published' && new Date(event.starts_at) > now;
}

export function isPastEvent(event, now = new Date()) {
  return new Date(event.ends_at) <= now || event.status === 'completed';
}

export function groupFeedback(feedback = []) {
  const groups = new Map();
  const rows = Array.isArray(feedback) ? feedback : [];
  rows.forEach((row) => {
    const eventId = row.eventId || row.event_id || row.eventTitle || row.eventName || 'event';
    const eventTitle = row.eventTitle || row.eventName || row.title || 'Event';
    const current = groups.get(eventId) || { eventId, eventTitle, total: 0, responseCount: 0 };
    if (row.rating == null && row.avgRating != null && row.responseCount) {
      const responses = Number(row.responseCount) || 0;
      current.total += Number(row.avgRating) * responses;
      current.responseCount += responses;
    } else {
      current.total += Number(row.rating) || 0;
      current.responseCount += 1;
    }
    groups.set(eventId, current);
  });
  return Array.from(groups.values()).map((row) => ({
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    avgRating: row.responseCount ? Math.round((row.total / row.responseCount) * 10) / 10 : 0,
    responseCount: row.responseCount,
  }));
}

export function shapeAnalytics(events, staff, feedback) {
  const now = new Date();
  const directory = staff.filter((person) => person.role !== 'fde');
  const upcoming = events.filter((event) => isPublishedUpcoming(event, now));
  const past = events.filter((event) => isPastEvent(event, now));
  const ratios = events
    .filter((event) => event.capacity > 0)
    .map((event) => ((event.registered_count || 0) / event.capacity) * 100);
  const avgParticipation = ratios.length
    ? Math.round(ratios.reduce((sum, value) => sum + value, 0) / ratios.length)
    : 0;

  const byMonth = new Map();
  events.forEach((event) => {
    const label = new Date(event.starts_at).toLocaleString('en-US', { month: 'short' });
    const current = byMonth.get(label) || { name: label, invites: 0, attendees: 0 };
    current.invites += event.capacity || 0;
    current.attendees += event.registered_count || 0;
    byMonth.set(label, current);
  });

  const departments = new Map();
  directory.forEach((person) => {
    const key = person.department || 'General';
    const current = departments.get(key) || { date: key, engagementScore: 0, count: 0 };
    current.engagementScore += person.engagement || 70;
    current.count += 1;
    departments.set(key, current);
  });

  return {
    totalEvents: events.length,
    upcomingEvents: upcoming.length,
    pastEvents: past.length,
    totalStaff: directory.length,
    avgParticipation,
    participationData: Array.from(byMonth.values()),
    engagementData: Array.from(departments.values()).map((row) => ({
      date: row.date,
      engagementScore: Math.round(row.engagementScore / row.count),
    })),
    recentParticipants: directory.slice(0, 5).map((person) => ({
      id: person.id,
      name: person.name,
      email: person.email,
      role: person.role,
    })),
    feedbackData: groupFeedback(feedback),
  };
}
