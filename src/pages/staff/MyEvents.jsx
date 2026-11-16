import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import AppLayout from '../../components/common/AppLayout';
import { Badge, EmptyState, PageHeader, Skeleton, Tabs } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { downloadIcs } from '../../lib/ics';
import { fetchMyEvents, rsvpToEvent } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'other', label: 'Maybe / Declined' },
];

const MyEvents = () => {
  const [tab, setTab] = useState('upcoming');
  const [busy, setBusy] = useState('');
  const queryClient = useQueryClient();
  const { push } = useToast();
  const events = useQuery({ queryKey: ['events', 'mine'], queryFn: fetchMyEvents });
  const now = new Date();
  const rows = (events.data || []).filter((event) => {
    const past = new Date(event.ends_at) < now;
    if (tab === 'past') return past;
    if (tab === 'other') return event.rsvpStatus === 'maybe' || event.rsvpStatus === 'declined';
    return !past && event.rsvpStatus === 'going';
  });

  const change = async (event, status) => {
    setBusy(event.id);
    try {
      await rsvpToEvent(event.id, status);
      await queryClient.invalidateQueries({ queryKey: ['events', 'mine'] });
      push({ title: 'RSVP updated' });
    } catch (error) {
      push({ title: error.message || 'RSVP failed', tone: 'danger' });
    } finally {
      setBusy('');
    }
  };

  return (
    <AppLayout role="staff">
      <PageHeader title="My events" />
      <Tabs tabs={TABS} value={tab} onChange={setTab} label="My events" />
      {events.isLoading ? <Skeleton /> : rows.length === 0 ? (
        <EmptyState title="Nothing in this tab" body="RSVP from the dashboard to fill this list." action={<Link className="btn" to="/staff/dashboard">Go to dashboard</Link>} />
      ) : rows.map((event) => (
        <article key={event.id} className="card event-card">
          <p>{formatDate(event.starts_at)} · {formatTime(event.starts_at)}</p>
          <h2>{event.title}</h2>
          <p><MapPin size={14} aria-hidden="true" /> {event.location || 'Online'}</p>
          <Badge status={event.rsvpStatus}>{event.rsvpStatus}</Badge>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" disabled={busy === event.id} onClick={() => change(event, event.rsvpStatus === 'going' ? 'maybe' : 'going')}>{busy === event.id ? 'Saving...' : 'Change RSVP'}</button>
            <button type="button" className="btn btn-ghost" disabled={busy === event.id} onClick={() => change(event, 'declined')}>Cancel</button>
            <button type="button" className="btn btn-ghost" onClick={() => { downloadIcs(event); push({ title: 'Calendar file downloaded' }); }}>Add to calendar</button>
          </div>
        </article>
      ))}
    </AppLayout>
  );
};

export default MyEvents;
