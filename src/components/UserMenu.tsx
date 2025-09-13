import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Settings, LogOut, Shield } from 'lucide-react';
import cofreTrackerLogo from "@/assets/cofre-tracker-logo.svg";

interface UserMenuProps {
  userEmail?: string;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export const UserMenu = ({ userEmail, onProfileClick, onSettingsClick }: UserMenuProps) => {
  const { signOut, profile } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout",
        variant: "destructive"
      });
    }
  };

  const getInitials = (email?: string, fullName?: string) => {
    if (fullName) {
      return fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
    if (!email) return 'U';
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  const displayName = profile?.full_name || userEmail || 'Usuário';
  const displayEmail = userEmail || profile?.email || '';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || cofreTrackerLogo} alt="Avatar" />
            <AvatarFallback>{getInitials(displayEmail, profile?.full_name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              {profile && (
                <Badge variant="outline" className="text-xs">
                  {getRoleLabel(profile.role)}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
            {profile?.role === 'admin' && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                Acesso total ao sistema
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onProfileClick}>
          <User className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSettingsClick}>
          <Settings className="mr-2 h-4 w-4" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};