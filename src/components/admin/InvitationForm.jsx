import { useState } from 'react';
import { resendInvite } from '../../services/platformService';

const InvitationForm = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendInvitation = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await resendInvite(email);
      setMessage(`Invite queued for ${email}.`);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Invite failed');
    }
  };

  return (
    <form className="card" onSubmit={handleSendInvitation}>
      <h2>Invite staff</h2>
      <label htmlFor="invite-email">Email</label>
      <input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label htmlFor="invite-role">Role</label>
      <select id="invite-role" value={role} onChange={(event) => setRole(event.target.value)}>
        <option value="staff">Staff</option>
        <option value="admin">Admin</option>
      </select>
      <button className="btn" type="submit">Send invite</button>
      {message && <p role="status">{message}</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
    </form>
  );
};

export default InvitationForm;
