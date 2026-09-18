import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// requiredRole: 'user' | 'admin' | undefined (any authenticated role)
export default function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <div className="page-center">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}
