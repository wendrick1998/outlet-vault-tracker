import { ReactNode } from 'react';
import { useHasPermission } from '@/hooks/usePermissions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock } from 'lucide-react';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import type { Database } from '@/integrations/supabase/types';

type Permission = Database['public']['Enums']['permission'];

interface PermissionGuardProps {
  children: ReactNode;
  permission: Permission;
  fallback?: ReactNode;
  showMessage?: boolean;
  className?: string;
}

export const PermissionGuard = ({ 
  children, 
  permission, 
  fallback,
  showMessage = true,
  className = ''
}: PermissionGuardProps) => {
  const { data: hasPermission, isLoading } = useHasPermission(permission);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <Alert className={`mx-4 my-4 ${className}`}>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta funcionalidade.
            Entre em contato com um administrador se necessário.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

// Wrapper that only shows when granular permissions feature is enabled
export const GranularPermissionGuard = ({ 
  children, 
  permission,
  fallback,
  ...props 
}: PermissionGuardProps) => (
  <FeatureFlagWrapper flag={FEATURE_FLAGS.GRANULAR_PERMISSIONS}>
    <PermissionGuard 
      permission={permission} 
      fallback={fallback}
      {...props}
    >
      {children}
    </PermissionGuard>
  </FeatureFlagWrapper>
);

// Helper components for common permissions
interface PermissionProps {
  children: ReactNode;
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const InventoryCreateGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="inventory.create" {...props}>
    {children}
  </PermissionGuard>
);

export const InventoryDeleteGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="inventory.delete" {...props}>
    {children}
  </PermissionGuard>
);

export const InventoryBulkGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="inventory.bulk_operations" {...props}>
    {children}
  </PermissionGuard>
);

export const UserManagementGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="users.manage_roles" {...props}>
    {children}
  </PermissionGuard>
);

export const SystemConfigGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="system.config" {...props}>
    {children}
  </PermissionGuard>
);

export const SystemFeaturesGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="system.features" {...props}>
    {children}
  </PermissionGuard>
);

export const AuditGuard = ({ children, ...props }: PermissionProps) => (
  <PermissionGuard permission="audit.view" {...props}>
    {children}
  </PermissionGuard>
);

// Multi-permission guard (requires ALL permissions)
interface MultiPermissionGuardProps {
  children: ReactNode;
  permissions: Permission[];
  fallback?: ReactNode;
  showMessage?: boolean;
}

export const MultiPermissionGuard = ({ 
  children, 
  permissions, 
  fallback,
  showMessage = true 
}: MultiPermissionGuardProps) => {
  // Use individual hook calls instead of map to follow Rules of Hooks
  const firstPermission = permissions[0] ? useHasPermission(permissions[0]) : { data: true, isLoading: false };
  const secondPermission = permissions[1] ? useHasPermission(permissions[1]) : { data: true, isLoading: false };
  const thirdPermission = permissions[2] ? useHasPermission(permissions[2]) : { data: true, isLoading: false };
  
  const isLoading = firstPermission.isLoading || secondPermission.isLoading || thirdPermission.isLoading;
  const hasAllPermissions = firstPermission.data && secondPermission.data && thirdPermission.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAllPermissions) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showMessage) {
      return (
        <Alert className="mx-4 my-4">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem todas as permissões necessárias para acessar esta funcionalidade.
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};