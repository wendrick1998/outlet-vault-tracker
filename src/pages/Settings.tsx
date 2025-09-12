import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAllProfiles, useUpdateUserRole } from '@/hooks/useProfile';
import { AdminOnly } from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, Shield, Settings as SettingsIcon } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { AdminCadastrosModal } from '@/components/admin/AdminCadastrosModal';

type AppRole = Database['public']['Enums']['app_role'];

interface SettingsProps {
  onBack: () => void;
}

export const Settings = ({ onBack }: SettingsProps) => {
  const { profile } = useAuth();
  const { data: profiles, isLoading } = useAllProfiles();
  const updateUserRole = useUpdateUserRole();

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    updateUserRole.mutate({ userId, role: newRole });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'user': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'user': return 'Usuário';
      default: return role;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        </div>

        {/* Admin Management Section */}
        <AdminOnly showMessage={false}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <AdminCadastrosModal />
              </div>
              
              <h3 className="font-semibold mb-4">Gerenciar Usuários</h3>
              <div className="space-y-4">
                {profiles?.map((userProfile) => (
                  <div key={userProfile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile.avatar_url || ''} alt={userProfile.full_name || 'Avatar'} />
                        <AvatarFallback>
                          {userProfile.full_name?.split(' ').map(n => n[0]).join('') || userProfile.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{userProfile.full_name || 'Nome não definido'}</p>
                        <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                      </div>
                      <Badge variant={getRoleColor(userProfile.role)}>
                        <Shield className="mr-1 h-3 w-3" />
                        {getRoleLabel(userProfile.role)}
                      </Badge>
                      {!userProfile.is_active && (
                        <Badge variant="outline">Inativo</Badge>
                      )}
                    </div>
                    
                    {profile?.id !== userProfile.id && (
                      <Select
                        value={userProfile.role}
                        onValueChange={(value: AppRole) => handleRoleChange(userProfile.id, value)}
                        disabled={updateUserRole.isPending}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    
                    {profile?.id === userProfile.id && (
                      <Badge variant="outline">Você</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AdminOnly>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Total de Usuários:</p>
                <p className="text-muted-foreground">{profiles?.length || 0}</p>
              </div>
              <div>
                <p className="font-medium">Administradores:</p>
                <p className="text-muted-foreground">
                  {profiles?.filter(p => p.role === 'admin').length || 0}
                </p>
              </div>
              <div>
                <p className="font-medium">Gerentes:</p>
                <p className="text-muted-foreground">
                  {profiles?.filter(p => p.role === 'manager').length || 0}
                </p>
              </div>
              <div>
                <p className="font-medium">Usuários Ativos:</p>
                <p className="text-muted-foreground">
                  {profiles?.filter(p => p.is_active).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Information */}
        <Card>
          <CardHeader>
            <CardTitle>Seu Nível de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge variant={getRoleColor(profile?.role || 'user')} className="text-sm">
                <Shield className="mr-1 h-3 w-3" />
                {getRoleLabel(profile?.role || 'user')}
              </Badge>
              
              <div className="text-sm text-muted-foreground space-y-1">
                {profile?.role === 'admin' && (
                  <>
                    <p>• Acesso total ao sistema</p>
                    <p>• Gerenciar usuários e permissões</p>
                    <p>• Gerenciar clientes, vendedores e motivos</p>
                    <p>• Visualizar e gerenciar inventário e empréstimos</p>
                  </>
                )}
                {profile?.role === 'manager' && (
                  <>
                    <p>• Gerenciar clientes e inventário</p>
                    <p>• Processar empréstimos e devoluções</p>
                    <p>• Visualizar relatórios</p>
                  </>
                )}
                {profile?.role === 'user' && (
                  <>
                    <p>• Visualizar inventário e empréstimos</p>
                    <p>• Adicionar notas aos itens</p>
                    <p>• Visualizar relatórios básicos</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};