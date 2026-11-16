import { useState } from 'react';
import { isSupabaseConfigured } from '../../lib/env';

const BYPASS = [
  { role: 'admin', label: 'Continue as Admin' },
  { role: 'staff', label: 'Continue as Staff' },
  { role: 'fde', label: 'Continue as FDE' },
];

function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" /></svg>;
}
function MicrosoftIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="5" height="5" fill="currentColor" /><rect x="9" y="2" width="5" height="5" fill="currentColor" /><rect x="2" y="9" width="5" height="5" fill="currentColor" /><rect x="9" y="9" width="5" height="5" fill="currentColor" /></svg>;
}

const LoginForm = ({ email, onEmailChange, onLoginSuccess, login }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const showDemo = import.meta.env.DEV || import.meta.env.VITE_USE_MOCK === 'true';

  const validate = () => {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startOAuth = async (provider) => {
    setError('');
    setLoading(true);
    try {
      await login({ provider });
    } catch (err) {
      setError(err.message || 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const continueAs = async (role) => {
    setError('');
    setLoading(true);
    try {
      const user = await login({ demoRole: role });
      if (user) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <div className="error-message" role="alert">{error}</div>}
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input id="email" data-testid="login-email" type="email" autoComplete="username" value={email} onChange={(event) => onEmailChange(event.target.value)} required />
        {fieldErrors.email && <p className="error-message" role="alert">{fieldErrors.email}</p>}
      </div>
      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input id="password" data-testid="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        <button type="button" className="btn btn-ghost" onClick={() => setShowPassword((value) => !value)}>{showPassword ? 'Hide password' : 'Show password'}</button>
        {fieldErrors.password && <p className="error-message" role="alert">{fieldErrors.password}</p>}
      </div>
      <button type="submit" className="btn btn-block" data-testid="login-submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
      <button type="button" className="btn btn-outline btn-block" onClick={() => startOAuth('google')} disabled={!isSupabaseConfigured || loading}><GoogleIcon /> Continue with Google</button>
      <button type="button" className="btn btn-outline btn-block" onClick={() => startOAuth('azure')} disabled={!isSupabaseConfigured || loading}><MicrosoftIcon /> Continue with Microsoft</button>
      {showDemo && (
        <div className="demo-accounts">
          <button type="button" className="btn btn-ghost btn-block" aria-expanded={demoOpen} onClick={() => setDemoOpen((value) => !value)}>Demo accounts</button>
          {demoOpen && BYPASS.map((entry) => (
            <button key={entry.role} type="button" className="btn btn-outline btn-block" onClick={() => continueAs(entry.role)} disabled={loading}>{entry.label}</button>
          ))}
        </div>
      )}
    </form>
  );
};

export default LoginForm;
