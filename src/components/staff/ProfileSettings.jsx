import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfileSettings = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    role: currentUser?.role || '',
  });
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    setProfile({ ...profile, [event.target.name]: event.target.value });
  };

  return (
    <form className="card" onSubmit={(event) => { event.preventDefault(); setMessage('Profile kept locally for this session.'); }}>
      <h2>Profile</h2>
      <input name="name" value={profile.name} onChange={handleChange} aria-label="Name" />
      <input name="email" type="email" value={profile.email} onChange={handleChange} aria-label="Email" />
      <input name="role" value={profile.role} readOnly aria-label="Role" />
      <button className="btn" type="submit">Save</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
};

export default ProfileSettings;
