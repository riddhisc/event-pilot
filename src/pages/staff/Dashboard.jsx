import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import EventCalendar from '../../components/staff/EventCalendar';
import EventCard from '../../components/staff/EventCard';
import NotificationCenter from '../../components/staff/NotificationCenter';
import { EmptyState, PageHeader, Skeleton } from '../../components/ui/kit';
import { useAuth } from '../../hooks/useAuth';
import { isPublishedUpcoming } from '../../lib/analytics';
import { fetchEvents } from '../../services/eventService';

function countdown(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

const StaffDashboard = () => {
  const [view, setView] = useState('cards');
  const { currentUser } = useAuth();
  const events = useQuery({
    queryKey: ['events', currentUser?.tenant_id],
    queryFn: () => fetchEvents(currentUser?.tenant_id),
    enabled: Boolean(currentUser?.tenant_id),
  });
  const upcoming = (events.data || []).filter((event) => isPublishedUpcoming(event));
  const next = [...upcoming].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0];

  return (
    <AppLayout role="staff">
      <PageHeader
        title="Dashboard"
        eyebrow={next ? `Next event in ${countdown(next.starts_at)}` : 'No upcoming event'}
        actions={(
          <div className="segmented" role="group" aria-label="Event view">
            <button type="button" aria-pressed={view === 'cards'} onClick={() => setView('cards')}>Cards</button>
            <button type="button" aria-pressed={view === 'calendar'} onClick={() => setView('calendar')}>Calendar</button>
          </div>
        )}
      />
      <NotificationCenter />
      {events.isLoading ? <Skeleton /> : events.error ? <EmptyState title="Could not load events" action={<button type="button" className="btn" onClick={() => events.refetch()}>Retry</button>} /> : upcoming.length === 0 ? <EmptyState title="No upcoming events" /> : (
        view === 'cards'
          ? <div className="section-gap">{upcoming.map((event) => <EventCard key={event.id} event={event} />)}</div>
          : <EventCalendar events={events.data || []} />
      )}
    </AppLayout>
  );
};

export default StaffDashboard;
