import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loading } from '@/components/ui/loading';
import { Auth } from '@/pages/Auth';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute = ({ children, fallback }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, mustChangePassword, clearMustChangePassword, refetchProfile } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return fallback || <Auth onLoginSuccess={() => {}} />;
  }

  // Show change password dialog if user must change password
  if (mustChangePassword && !showChangePassword) {
    setShowChangePassword(true);
  }

  const handlePasswordChangeSuccess = async () => {
    setShowChangePassword(false);
    clearMustChangePassword();
    await refetchProfile(); // Refresh profile to confirm password change
  };

  return (
    <>
      <ChangePasswordDialog
        open={showChangePassword}
        onOpenChange={setShowChangePassword}
        onSuccess={handlePasswordChangeSuccess}
        isMandatory={mustChangePassword}
      />
      {mustChangePassword ? null : children}
    </>
  );
};