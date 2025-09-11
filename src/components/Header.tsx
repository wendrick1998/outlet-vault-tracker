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
    <header className="bg-primary text-primary-foreground shadow-medium">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-primary-hover rounded-lg transition-colors"
                aria-label="Voltar"
              >
                ←
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <Store className="h-7 w-7" />
              <div>
                <h1 className="text-xl font-bold">Outlet Store Plus</h1>
                <p className="text-sm opacity-90 text-primary-foreground/80">{title}</p>
              </div>
            </div>
          </div>

          {user && (
            <UserMenu 
              userEmail={user.email} 
              onProfileClick={onProfileClick}
              onSettingsClick={onSettingsClick}
            />
          )}
        </div>
      </div>
    </header>
  );
};