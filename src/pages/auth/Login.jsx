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
    document.title = 'Sign in · EventBuddy';
  }, []);

  return (
    <div className="login-page">
      <div className="brand-blush">
      <div className="login-container">
        <div className="logo-section">
          <img src="/logo.svg" alt="" width="56" height="56" />
          <p className="eyebrow">EventBuddy</p>
          <h1>Welcome back</h1>
          <p>Sign in with your work email. Your account already knows whether you are staff, an admin, or an FDE.</p>
        </div>
        <LoginForm
          email={email}
          onEmailChange={setEmail}
          login={login}
          onLoginSuccess={(user) => navigate(homeFor(user))}
        />
        <p className="login-footer">
          <Link to="/forgot-password">Forgot password?</Link>
        </p>
      </div>
      </div>
      <aside className="brand-red" aria-hidden="true">
        <div className="mark-tile">
          <img src="/logo.svg" alt="" />
        </div>
      </aside>
    </div>
  );
};

export default Login;
