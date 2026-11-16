const days = (a, b) => Math.ceil((new Date(a).getTime() - new Date(b).getTime()) / 86400000);

export function buildAttentionItems(events = [], people = [], now = new Date()) {
  const items = [];
  events.forEach((event) => {
    const ratio = event.capacity ? (event.registered_count || 0) / event.capacity : 0;
    const until = days(event.starts_at, now);
    if (event.status !== 'cancelled' && event.status !== 'completed' && until >= 0 && until <= 7 && ratio < 0.4) {
      items.push({ id: `rsvp-${event.id}`, severity: 'warning', action: 'Send reminder', type: 'low_rsvp', event, message: `${event.title} starts within 7 days but is only ${Math.round(ratio * 100)}% full.` });
    }
    if (event.status !== 'cancelled' && ratio >= 0.9) items.push({ id: `capacity-${event.id}`, severity: 'info', action: 'Enable waitlist', type: 'capacity', event, message: `${event.title} is at ${Math.round(ratio * 100)}% capacity.` });
    if (event.status !== 'cancelled' && !event.location && !event.meeting_url) items.push({ id: `location-${event.id}`, severity: 'danger', action: 'Edit event', type: 'missing_location', event, message: `${event.title} has no location or meeting link.` });
    if (event.status === 'completed' && days(now, event.ends_at) >= 3) items.push({ id: `feedback-${event.id}`, severity: 'warning', action: 'Edit event', type: 'no_feedback', event, message: `${event.title} has no feedback after 3 days.` });
  });
  people.filter((person) => person.status === 'invited' && person.invited_at && days(now, person.invited_at) > 7).forEach((person) => {
    items.push({ id: `invite-${person.id}`, severity: 'warning', action: 'Resend invite', type: 'pending_invite', person, message: `${person.name || person.email} has had a pending invite for more than 7 days.` });
  });
  return items;
}
