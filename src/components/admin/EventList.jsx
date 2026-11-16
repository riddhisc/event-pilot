import { deleteEvent } from '../../services/eventService';
import { formatDate, formatTime } from '../../utils/formatters';

const EventList = ({ events, onEdit, onDelete }) => {
  const handleDelete = async (id) => {
    await deleteEvent(id);
    onDelete(id);
  };

  if (!events.length) return <p>No events yet.</p>;

  return (
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id}>
          <div>
            <strong>{event.title}</strong>
            <p>{formatDate(event.starts_at)} at {formatTime(event.starts_at)} · {event.location} · {event.status}</p>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => onEdit(event)}>Edit</button>
            <button type="button" className="btn btn-ghost" onClick={() => handleDelete(event.id)}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default EventList;
