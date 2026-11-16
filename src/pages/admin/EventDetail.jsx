import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import AppLayout from '../../components/common/AppLayout';
import { Avatar, Badge, EmptyState, PageHeader, Skeleton } from '../../components/ui/kit';
import { fetchAttendees, fetchEvent } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';
import RelativeTime from '../../components/common/RelativeTime';

const EventDetail = () => {
  const { id } = useParams();
  const event = useQuery({ queryKey: ['events', id], queryFn: () => fetchEvent(id) });
  const attendees = useQuery({ queryKey: ['attendees', id], queryFn: () => fetchAttendees(id) });

  return (
    <AppLayout role="admin">
      <PageHeader title={event.data?.title || 'Event'} crumbs={[{ label: 'Events', to: '/admin/events' }, { label: event.data?.title || 'Detail' }]} />
      {event.isLoading ? <Skeleton /> : !event.data ? <EmptyState title="Event not found" /> : (
        <section className="card">
          <Badge status={event.data.status}>{event.data.status}</Badge>
          <p>{formatDate(event.data.starts_at)} · {formatTime(event.data.starts_at)} – {formatTime(event.data.ends_at)} · {event.data.timezone}</p>
          <p>{event.data.location || event.data.meeting_url}</p>
          <h2>Attendees</h2>
          {(attendees.data || []).length === 0 ? <EmptyState title="No attendees yet" /> : (attendees.data || []).map((person) => (
            <p key={person.id}><Avatar name={person.name} /> {person.name} · <Badge status={person.status}>{person.status}</Badge> {person.checked_in_at && <>· checked in <RelativeTime value={person.checked_in_at} /></>}</p>
          ))}
        </section>
      )}
    </AppLayout>
  );
};

export default EventDetail;
