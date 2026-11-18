import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';
import { homeFor } from '../../lib/roles';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  useEffect(() => {
    document.title = 'Sign in · Event Pilot';
  }, []);

  return (
    <div className="login-page">
      <div className="brand-blush">
      <div className="login-container">
        <div className="logo-section">
          <div className="login-brand">
            <img src="/logo.svg" alt="" width="40" height="40" />
            <strong>Event Pilot</strong>
          </div>
          <p className="product-tagline">Plan. Track. Connect.</p>
          <h1>Welcome back</h1>
          <p>Sign in with your work email to continue to your workspace.</p>
        </div>
        <LoginForm
          email={email}
          onEmailChange={setEmail}
          login={login}
          onLoginSuccess={(user) => navigate(homeFor(user))}
        />
        <p className="login-footer">
          <Link to="/forgot-password">Forgot password?</Link>
          <span className="login-footer-divider" aria-hidden="true">·</span>
          <span>Need an account? <Link to="/#request-demo">Request access</Link></span>
        </p>
      </div>
      </div>
      <aside className="brand-red" aria-hidden="true">
        <div className="login-brand-panel">
          <div className="mark-tile">
            <img src="/logo.svg" alt="" />
          </div>
          <div className="login-brand-copy">
            <strong>Event Pilot</strong>
            <span>Plan. Track. Connect.</span>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;
