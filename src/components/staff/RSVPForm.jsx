import { useState } from 'react';
import { rsvpToEvent } from '../../services/eventService';

const RSVPForm = ({ eventId }) => {
  const [status, setStatus] = useState('going');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRSVP = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const result = await rsvpToEvent(eventId, status);
      setMessage(result.status === 'waitlist' ? 'The event is full. You are on the waitlist.' : 'RSVP saved.');
    } catch (err) {
      setError(err.message || 'RSVP failed');
    }
  };

  return (
    <form onSubmit={handleRSVP} className="card">
      <h2>RSVP</h2>
      <label htmlFor="rsvp-status">Response</label>
      <select id="rsvp-status" value={status} onChange={(event) => setStatus(event.target.value)}>
        <option value="going">Going</option>
        <option value="maybe">Maybe</option>
        <option value="declined">Can&apos;t go</option>
      </select>
      <button className="btn" type="submit">Submit RSVP</button>
      {message && <p role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </form>
  );
};

export default RSVPForm;
