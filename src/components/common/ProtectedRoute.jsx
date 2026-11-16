import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { homeFor } from '../../lib/roles';
import Loader from './Loader';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { currentUser, loading } = useAuth();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (allowedRole && currentUser.role !== allowedRole) {
    return <Navigate to={homeFor(currentUser)} replace />;
  }
  return children;
};

export default ProtectedRoute;
