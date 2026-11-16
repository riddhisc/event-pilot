import { MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { downloadIcs } from '../../lib/ics';
import { rsvpToEvent } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';
import { pluralize } from '../../utils/formatters';
import { useToast } from '../ui/Toast';
import { Badge, Progress } from '../ui/kit';

const OPTIONS = [['going', 'Going'], ['maybe', 'Maybe'], ['declined', "Can't go"]];

const EventCard = ({ event }) => {
  const { push } = useToast();
  const [status, setStatus] = useState(event.rsvpStatus || 'none');
  const [busy, setBusy] = useState(false);
  const spots = Math.max(0, (event.capacity || 0) - (event.registered_count || 0));

  const choose = async (next) => {
    const previous = status;
    setStatus(next);
    setBusy(true);
    try {
      const result = await rsvpToEvent(event.id, next);
      setStatus(result.status || next);
      push({ title: next === 'going' ? 'You are going' : next === 'maybe' ? 'Marked as maybe' : 'RSVP updated' });
    } catch (error) {
      setStatus(previous);
      push({ title: error.message || 'RSVP failed', tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="card event-card">
      <Badge status={event.type}>{event.type === 'in_person' ? 'In person' : event.type === 'virtual' ? 'Virtual' : 'Hybrid'}</Badge>
      <h3>{event.title}</h3>
      <p><span className="chip">{formatDate(event.starts_at)}</span> {formatTime(event.starts_at)} – {formatTime(event.ends_at)}</p>
      <p><MapPin size={14} aria-hidden="true" /> {event.location || 'Online'}</p>
      <p className="desc-clamp">{event.description}</p>
      <p>{pluralize(event.registered_count || 0, 'person', 'people')} going · {pluralize(spots, 'spot')} left</p>
      <Progress value={event.registered_count || 0} max={event.capacity || 1} label="Capacity" />
      <div className="segmented" role="group" aria-label={`RSVP for ${event.title}`}>
        {OPTIONS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={status === id} disabled={busy} onClick={() => choose(id)}>{busy && status === id ? 'Saving...' : label}</button>
        ))}
      </div>
      <div className="form-actions">
        <Link className="btn btn-ghost" to={`/staff/events/${event.id}`}>View details</Link>
        <button type="button" className="btn btn-ghost" onClick={() => { downloadIcs(event); push({ title: 'Calendar file downloaded' }); }}>Add to calendar</button>
      </div>
    </article>
  );
};

export default EventCard;
