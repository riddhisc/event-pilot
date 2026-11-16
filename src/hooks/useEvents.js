import { useQuery } from '@tanstack/react-query';
import { isPublishedUpcoming } from '../lib/analytics';
import { useAuth } from './useAuth';
import { fetchEvents } from '../services/eventService';

export const useEvents = () => {
  const { currentUser } = useAuth();
  const tenantId = currentUser?.role === 'fde' ? null : currentUser?.tenant_id;
  const query = useQuery({
    queryKey: ['events', currentUser?.id, tenantId || 'all'],
    queryFn: () => fetchEvents(tenantId),
    enabled: Boolean(currentUser),
  });
  const events = query.data || [];
  return {
    events,
    upcomingEvents: events.filter((event) => isPublishedUpcoming(event)),
    isLoading: query.isLoading,
    error: query.error?.message || null,
  };
};
