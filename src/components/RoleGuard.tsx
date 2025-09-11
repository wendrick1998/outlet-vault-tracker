import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AppRole[];
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const RoleGuard = ({ 
  children, 
  allowedRoles, 
  fallback,
  showMessage = true 
}: RoleGuardProps) => {
  const { profile, profileLoading } = useAuth();

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasPermission = profile && 
    allowedRoles.includes(profile.role) && 
    profile.is_active;

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <Alert className="mx-4 my-6">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta área. 
            Contacte um administrador se você acredita que isso é um erro.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

// Helper components for common role checks
export const AdminOnly = ({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) => (
  <RoleGuard allowedRoles={['admin']} {...props}>
    {children}
  </RoleGuard>
);

export const AdminOrManager = ({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) => (
  <RoleGuard allowedRoles={['admin', 'manager']} {...props}>
    {children}
  </RoleGuard>
);