import { Store } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { useAuth } from "@/contexts/AuthContext";
import cofreTrackerLogo from "@/assets/cofre-tracker-logo.svg";

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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <img 
          src={cofreTrackerLogo} 
          alt="Cofre Tracker Logo" 
          className="h-8 w-8"
        />
        <span className="font-semibold text-lg">{title}</span>
      </div>
      
      {user && (
        <UserMenu 
          userEmail={user.email} 
          onProfileClick={onProfileClick}
          onSettingsClick={onSettingsClick}
        />
      )}
    </div>
  );
};