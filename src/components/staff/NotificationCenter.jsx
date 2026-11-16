import { Bell } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import RelativeTime from '../common/RelativeTime';
import { EmptyState } from '../ui/kit';

const NotificationCenter = () => {
  const { notifications, error, markAsRead, markAllAsRead } = useNotifications();

  return (
    <section className="card" aria-label="Notifications">
      <div className="page-header">
        <h2>Notifications</h2>
        <button type="button" className="btn btn-ghost" onClick={markAllAsRead}>Mark all read</button>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {notifications.length === 0 ? <EmptyState title="No notifications" body="Reminders and RSVP updates will show up here." /> : notifications.map((notification) => (
        <article key={notification.id} className="event-card">
          <p><Bell size={14} aria-hidden="true" /> {notification.message} {!notification.read && <span className="badge badge-info">Unread</span>}</p>
          <RelativeTime value={notification.createdAt} />
          {!notification.read && <button type="button" className="btn btn-ghost" onClick={() => markAsRead(notification.id)}>Mark read</button>}
        </article>
      ))}
    </section>
  );
};

export default NotificationCenter;
