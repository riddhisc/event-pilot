import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readResetToken, resetPassword } from '../../services/authService';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const pending = readResetToken();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token') || pending?.token;
      const result = await resetPassword(token, password);
      setMessage(result.message);
    } catch (err) {
      setError(err.message || 'Could not reset the password.');
    }
  };

  return (
    <div className="login-page">
      <form className="login-container" onSubmit={handleSubmit}>
        <img src="/logo.svg" alt="" width="48" height="48" />
        <h1>Choose a new password</h1>
        <p>{pending?.email ? `Resetting ${pending.email}.` : 'Use the reset link from your email, or start again from forgot password.'}</p>
        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button className="btn btn-block" type="submit">Update password</button>
        {message && <Link className="btn btn-ghost btn-block" to="/login">Sign in</Link>}
        {!message && <Link to="/login">Back to login</Link>}
      </form>
    </div>
  );
};

export default ResetPassword;
