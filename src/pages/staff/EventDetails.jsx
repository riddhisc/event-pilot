import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import LiveChat from '../../components/staff/LiveChat';
import { Avatar, Badge, EmptyState, PageHeader, Progress, Skeleton } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { downloadIcs } from '../../lib/ics';
import { fetchAttendees, fetchEvent, rsvpToEvent, submitFeedback } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';

const OPTIONS = [['going', 'Going'], ['maybe', 'Maybe'], ['declined', "Can't go"]];

const EventDetails = () => {
  const { id } = useParams();
  const { push } = useToast();
  const queryClient = useQueryClient();
  const event = useQuery({ queryKey: ['events', id], queryFn: () => fetchEvent(id) });
  const attendees = useQuery({ queryKey: ['attendees', id], queryFn: () => fetchAttendees(id) });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const item = event.data;

  const choose = async (next) => {
    setBusy(true);
    setStatus(next);
    try {
      const result = await rsvpToEvent(id, next);
      setStatus(result.status || next);
      await queryClient.invalidateQueries({ queryKey: ['attendees', id] });
      push({ title: 'RSVP updated' });
    } catch (error) {
      push({ title: error.message || 'RSVP failed', tone: 'danger' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout role="staff">
      <PageHeader title={item?.title || 'Event'} crumbs={[{ label: 'Dashboard', to: '/staff/dashboard' }, { label: item?.title || 'Event' }]} />
      {event.isLoading ? <Skeleton /> : !item ? <EmptyState title="Event not found" /> : (
        <div className="section-gap">
          <section className="card">
            <Badge status={item.type}>{item.type}</Badge>
            <p>{formatDate(item.starts_at)} · {formatTime(item.starts_at)} – {formatTime(item.ends_at)}</p>
            <p>{item.meeting_url ? <a href={item.meeting_url}>Join meeting</a> : <><MapPin size={14} aria-hidden="true" /> {item.location}</>}</p>
            <p>{item.description}</p>
            <div className="segmented" role="group" aria-label="RSVP">
              {OPTIONS.map(([value, label]) => (
                <button key={value} type="button" aria-pressed={(status || item.rsvpStatus) === value} disabled={busy} onClick={() => choose(value)}>{label}</button>
              ))}
            </div>
            <button type="button" className="btn" onClick={() => { downloadIcs(item); push({ title: 'Calendar file downloaded' }); }}>Add to calendar</button>
          </section>
          <section className="card">
            <h2>Attendees</h2>
            <div className="chip-row">{(attendees.data || []).map((person) => <Avatar key={person.id} name={person.name} />)}</div>
            {(attendees.data || []).length === 0 && <EmptyState title="No attendees yet" />}
          </section>
          <section className="card">
            <h2>Agenda</h2>
            {(item.agenda || []).length === 0 ? <EmptyState title="No agenda yet" /> : (item.agenda || []).map((step) => <p key={step}>{step}</p>)}
            <Progress value={(attendees.data || []).length} max={item.capacity} label="Attendance" />
          </section>
          {new Date(item.ends_at) < new Date() && (
            <form className="card" onSubmit={async (submit) => {
              submit.preventDefault();
              await submitFeedback(item.id, { rating: Number(rating), comment });
              push({ title: 'Thanks for the feedback' });
            }}>
              <h2>Feedback</h2>
              <label htmlFor="rating">Rating</label>
              <input id="rating" type="number" min="1" max="5" value={rating} onChange={(input) => setRating(input.target.value)} />
              <label htmlFor="comment">Comment</label>
              <textarea id="comment" value={comment} onChange={(input) => setComment(input.target.value)} />
              <button className="btn" type="submit">Send feedback</button>
            </form>
          )}
          <LiveChat eventId={item.id} />
        </div>
      )}
    </AppLayout>
  );
};

export default EventDetails;
