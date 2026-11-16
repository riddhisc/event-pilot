import { createContext, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isPublishedUpcoming } from '../lib/analytics';
import { useAuth } from '../hooks/useAuth';
import { createEvent, deleteEvent, fetchEvents, updateEvent } from '../services/eventService';

export const EventContext = createContext(null);

export const EventProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const tenantId = currentUser?.role === 'fde' ? null : currentUser?.tenant_id;
  const eventsQuery = useQuery({
    queryKey: ['events', currentUser?.id || 'anon', tenantId || 'all'],
    queryFn: () => fetchEvents(tenantId),
    enabled: Boolean(currentUser),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const createMutation = useMutation({ mutationFn: createEvent, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, event }) => updateEvent(id, event),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({ mutationFn: deleteEvent, onSuccess: invalidate });

  const events = eventsQuery.data || [];
  const value = useMemo(() => ({
    events,
    upcomingEvents: events.filter((event) => isPublishedUpcoming(event)),
    loading: eventsQuery.isLoading,
    error: eventsQuery.error?.message || null,
    refreshEvents: invalidate,
    addEvent: createMutation.mutateAsync,
    updateEvent: (id, event) => updateMutation.mutateAsync({ id, event }),
    removeEvent: deleteMutation.mutateAsync,
  }), [events, eventsQuery.isLoading, eventsQuery.error, createMutation, updateMutation, deleteMutation]);

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
