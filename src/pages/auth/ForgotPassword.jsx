import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMock } from '../../lib/env';
import { requestPasswordReset } from '../../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err.message || 'Could not start a password reset.');
    }
  };

  return (
    <div className="login-page">
      <form className="login-container" onSubmit={handleSubmit}>
        <img src="/logo.svg" alt="" width="48" height="48" />
        <h1>Reset your password</h1>
        <p>We will prepare a reset for this browser session in mock mode.</p>
        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="error-message" role="alert">{error}</p>}
        <label htmlFor="reset-email">Email</label>
        <input id="reset-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
        <button className="btn btn-block" type="submit">Send reset link</button>
        {useMock && message && <Link className="btn btn-ghost btn-block" to="/reset-password">Choose a new password</Link>}
        <Link to="/login">Back to login</Link>
      </form>
    </div>
  );
};

export default ForgotPassword;
