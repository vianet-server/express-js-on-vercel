import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  loginPath: string;
  allowedRoles: string[];
}

export function ProtectedRoute({ children, loginPath, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, token, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  const userRole = user?.role;
  if (!userRole || (!allowedRoles.includes(userRole) && userRole !== 'admin')) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
