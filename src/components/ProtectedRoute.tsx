import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';
import { Auth } from '@/pages/Auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return fallback || <Auth onLoginSuccess={() => {}} />;
  }

  return <>{children}</>;
};