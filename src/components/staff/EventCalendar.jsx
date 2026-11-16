import { useState } from 'react';
import { Link } from 'react-router-dom';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const EventCalendar = ({ events }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const cells = [];

  for (let index = 0; index < 42; index += 1) {
    const day = index - firstDay + 1;
    const date = new Date(year, month, day);
    const inMonth = date.getMonth() === month;
    const dayEvents = events.filter((event) => {
      const date = new Date(event.starts_at);
      return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
    });
    cells.push(
      <div key={index} className={`calendar-day ${inMonth ? '' : 'muted-day'}`} role="gridcell" tabIndex={inMonth ? 0 : -1} onKeyDown={(event) => { if (event.key === 'Enter' && dayEvents[0]) window.location.href = `/staff/events/${dayEvents[0].id}`; }}>
        <div>{date.getDate()}</div>
        {dayEvents.map((event) => (
          <Link key={event.id} to={`/staff/events/${event.id}`} className={`calendar-event cal-${event.rsvpStatus || 'going'}`}>{event.title}</Link>
        ))}
      </div>,
    );
  }

  return (
    <div className="card">
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>Previous</button>
        <h2>{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
        <button type="button" className="btn btn-ghost" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>Next</button>
      </div>
      <div className="calendar-grid" role="grid" aria-label={currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}>
        {WEEKDAYS.map((day) => <div key={day} className="muted">{day}</div>)}
        {cells}
      </div>
    </div>
  );
};

export default EventCalendar;
