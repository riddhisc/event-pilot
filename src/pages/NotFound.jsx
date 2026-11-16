import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { homeFor } from '../lib/roles';

const NotFound = () => {
  const { currentUser } = useAuth();
  useEffect(() => {
    document.title = 'Page not found · EventBuddy';
  }, []);
  return (
    <main className="login-page">
      <div className="login-container">
        <h1>Page not found</h1>
        <p>That address is not part of EventBuddy.</p>
        <Link className="btn" to={homeFor(currentUser)}>Back home</Link>
      </div>
    </main>
  );
};

export default NotFound;
