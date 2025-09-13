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
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <img 
          src="/cofre-tracker-logo.svg" 
          alt="Cofre Tracker Logo" 
          className="h-8 w-8"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center hidden">
          <Store className="h-5 w-5 text-primary" />
        </div>
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