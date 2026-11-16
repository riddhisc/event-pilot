import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppLayout from '../../components/common/AppLayout';
import CreateEventForm from '../../components/admin/CreateEventForm';
import EditEventForm from '../../components/admin/EditEventForm';
import { Badge, ConfirmDialog, DataTable, Modal, PageHeader, Progress, Skeleton, Tabs } from '../../components/ui/kit';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { cancelEvent, deleteEvent, duplicateEvent, fetchEvents, restoreEvent } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';

const EventManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { currentUser } = useAuth();
  const events = useQuery({ queryKey: ['events', currentUser?.tenant_id], queryFn: () => fetchEvents(currentUser?.tenant_id), enabled: Boolean(currentUser?.tenant_id) });
  const [tab, setTab] = useState('upcoming');
  const [open, setOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [pendingCancel, setPendingCancel] = useState(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const now = new Date();
    return (events.data || []).filter((event) => {
      if (tab === 'drafts') return event.status === 'draft';
      if (tab === 'past') return new Date(event.ends_at) < now || event.status === 'completed';
      return event.status !== 'draft' && new Date(event.ends_at) >= now;
    }).map((event) => ({ ...event, onOpen: () => navigate(`/admin/events/${event.id}`) }));
  }, [events.data, tab, navigate]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const remove = async () => {
    setBusy(true);
    const snapshot = await deleteEvent(pendingDelete.id);
    setPendingDelete(null);
    setBusy(false);
    await refresh();
    push({
      title: 'Event deleted',
      tone: 'success',
      action: { label: 'Undo', onClick: async () => { await restoreEvent(snapshot); await refresh(); push({ title: 'Event restored' }); } },
    });
  };

  return (
    <AppLayout role="admin">
      <PageHeader
        title="Events"
        actions={<button type="button" className="btn" data-testid="create-event" onClick={() => { setEditEvent(null); setOpen(true); }}>Create event</button>}
      />
      <Tabs label="Event lists" value={tab} onChange={setTab} tabs={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'past', label: 'Past' }, { id: 'drafts', label: 'Drafts' }]} />
      {events.isLoading ? <Skeleton /> : (
        <DataTable
          rows={rows}
          searchKeys={['title', 'location']}
          empty="No events in this tab."
          columns={[
            { key: 'title', header: 'Title', render: (row) => row.title },
            { key: 'starts_at', header: 'When', sortValue: (row) => row.starts_at, render: (row) => `${formatDate(row.starts_at)} ${formatTime(row.starts_at)}` },
            { key: 'location', header: 'Location' },
            { key: 'status', header: 'Status', render: (row) => <Badge status={row.status}>{row.status}</Badge> },
            { key: 'registered_count', header: 'Capacity', sortValue: (row) => row.registered_count, render: (row) => <Progress value={row.registered_count} max={row.capacity} label={`${row.registered_count} of ${row.capacity}`} /> },
          ]}
          rowActions={(row) => [
            { label: 'Edit', onClick: () => { setEditEvent(row); setOpen(true); } },
            { label: 'Duplicate', onClick: async () => { await duplicateEvent(row.id); await refresh(); push({ title: 'Event duplicated' }); } },
            { label: 'Cancel', onClick: () => setPendingCancel(row) },
            { label: 'Delete', danger: true, onClick: () => setPendingDelete(row) },
          ]}
        />
      )}
      <Modal open={open} title={editEvent ? 'Edit event' : 'Create event'} onClose={() => setOpen(false)} wide>
        {editEvent ? <EditEventForm event={editEvent} onCancel={() => setOpen(false)} onSave={async () => { setOpen(false); await refresh(); push({ title: 'Event saved' }); }} /> : <CreateEventForm onCancel={() => setOpen(false)} onSave={async () => { setOpen(false); await refresh(); push({ title: 'Event created' }); }} />}
      </Modal>
      <ConfirmDialog open={Boolean(pendingDelete)} title="Delete this event?" body="This removes the event. You can undo from the toast." confirmLabel="Delete" tone="danger" busy={busy} onClose={() => setPendingDelete(null)} onConfirm={remove} />
      <ConfirmDialog
        open={Boolean(pendingCancel)}
        title="Cancel this event?"
        body="Registered people will see the event as cancelled."
        confirmLabel="Cancel event"
        tone="danger"
        busy={busy}
        onClose={() => setPendingCancel(null)}
        onConfirm={async () => {
          setBusy(true);
          await cancelEvent(pendingCancel.id);
          setPendingCancel(null);
          setBusy(false);
          await refresh();
          push({ title: 'Event cancelled' });
        }}
      />
    </AppLayout>
  );
};

export default EventManagement;
