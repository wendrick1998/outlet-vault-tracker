import { Store } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  onNavigate?: (page: string) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const Header = ({ 
  title = "Cofre Tracker", 
  showBack = false, 
  onBack, 
  onNavigate, 
  onProfileClick, 
  onSettingsClick 
}: HeaderProps) => {
  const { user } = useAuth();

  return (
    <>
      {user && (
        <UserMenu 
          userEmail={user.email} 
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
        />
      )}
    </>
  );
};