import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { eventFormSchema } from '../../lib/schemas';
import { createEvent, updateEvent } from '../../services/eventService';

function toLocalInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const EventForm = ({ event, onSave, onCancel, mode = 'create' }) => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      starts_at: toLocalInput(event?.starts_at),
      ends_at: toLocalInput(event?.ends_at),
      timezone: event?.timezone || 'America/New_York',
      location: event?.location || '',
      meeting_url: event?.meeting_url || '',
      capacity: event?.capacity || 30,
      waitlist_enabled: event?.waitlist_enabled ?? true,
      type: event?.type || 'in_person',
      status: event?.status || 'published',
      recurrence_rule: event?.recurrence_rule || '',
    },
  });
  const type = watch('type');

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      starts_at: new Date(values.starts_at).toISOString(),
      ends_at: new Date(values.ends_at).toISOString(),
      recurrence_rule: values.recurrence_rule || '',
    };
    const saved = mode === 'edit' && event ? await updateEvent(event.id, payload) : await createEvent(payload);
    onSave(saved);
  };

  return (
    <form className="create-event-form" onSubmit={handleSubmit(onSubmit)}>
      <label htmlFor="title">Title</label>
      <input id="title" data-testid="event-title" {...register('title')} />
      {errors.title && <p className="error-message" role="alert">{errors.title.message}</p>}
      <label htmlFor="description">Description</label>
      <textarea id="description" rows="3" {...register('description')} />
      {errors.description && <p className="error-message" role="alert">{errors.description.message}</p>}
      <label htmlFor="type">Type</label>
      <select id="type" {...register('type')}>
        <option value="in_person">In person</option>
        <option value="virtual">Virtual</option>
        <option value="hybrid">Hybrid</option>
      </select>
      <label htmlFor="starts_at">Start</label>
      <input id="starts_at" type="datetime-local" data-testid="event-start" {...register('starts_at')} />
      {errors.starts_at && <p className="error-message" role="alert">{errors.starts_at.message}</p>}
      <label htmlFor="ends_at">End</label>
      <input id="ends_at" type="datetime-local" {...register('ends_at')} />
      {errors.ends_at && <p className="error-message" role="alert">{errors.ends_at.message}</p>}
      <label htmlFor="timezone">Timezone</label>
      <input id="timezone" {...register('timezone')} />
      {errors.timezone && <p className="error-message" role="alert">{errors.timezone.message}</p>}
      {type !== 'virtual' && (
        <>
          <label htmlFor="location">Location</label>
          <input id="location" {...register('location')} />
          {errors.location && <p className="error-message" role="alert">{errors.location.message}</p>}
        </>
      )}
      {type !== 'in_person' && (
        <>
          <label htmlFor="meeting_url">Meeting link</label>
          <input id="meeting_url" {...register('meeting_url')} />
          {errors.meeting_url && <p className="error-message" role="alert">{errors.meeting_url.message}</p>}
        </>
      )}
      <label htmlFor="capacity">Capacity</label>
      <input id="capacity" type="number" min="1" {...register('capacity')} />
      {errors.capacity && <p className="error-message" role="alert">{errors.capacity.message}</p>}
      <label><input type="checkbox" {...register('waitlist_enabled')} /> Waitlist</label>
      <label htmlFor="status">Status</label>
      <select id="status" {...register('status')}>
        <option value="draft">Draft</option>
        <option value="published">Published</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" data-testid="event-save" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
};

export default EventForm;
