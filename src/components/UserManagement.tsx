import { useState } from 'react';
import { useAllProfiles, useUpdateProfile, useUpdateUserRole } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Settings, Shield, Clock, Users } from 'lucide-react';
import { AdminOnly } from '@/components/RoleGuard';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type AppRole = Database['public']['Enums']['app_role'];

interface UserFormData {
  full_name: string;
  email: string;
  role: AppRole;
  turno?: string;
  telefone?: string;
  observacoes?: string;
  horario_inicio?: string;
  horario_fim?: string;
  is_active: boolean;
}

export const UserManagement = () => {
  const { profile: currentUser } = useAuth();
  const { data: profiles, isLoading } = useAllProfiles();
  const updateProfile = useUpdateProfile();
  const updateRole = useUpdateUserRole();
  
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: '',
    email: '',
    role: 'user',
    is_active: true
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'auditor': return 'secondary';
      case 'user': return 'outline';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administradora';
      case 'manager': return 'Supervisora';
      case 'auditor': return 'Auditoria';
      case 'user': return 'Operadora';
      default: return 'Usuário';
    }
  };

  const getTurnoLabel = (turno?: string) => {
    switch (turno) {
      case 'manha': return 'Manhã (6h-14h)';
      case 'tarde': return 'Tarde (14h-22h)';
      case 'noite': return 'Noite (22h-6h)';
      case 'integral': return 'Integral';
      default: return 'Não definido';
    }
  };

  const openEditDialog = (user: Profile) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email,
      role: user.role,
      turno: user.turno || '',
      telefone: user.telefone || '',
      observacoes: user.observacoes || '',
      horario_inicio: user.horario_inicio || '',
      horario_fim: user.horario_fim || '',
      is_active: user.is_active
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;

    updateProfile.mutate({
      id: selectedUser.id,
      updates: {
        full_name: formData.full_name,
        turno: formData.turno || null,
        telefone: formData.telefone || null,
        observacoes: formData.observacoes || null,
        horario_inicio: formData.horario_inicio || null,
        horario_fim: formData.horario_fim || null,
        is_active: formData.is_active
      }
    }, {
      onSuccess: () => {
        if (selectedUser.role !== formData.role) {
          updateRole.mutate({
            userId: selectedUser.id,
            role: formData.role
          });
        }
        setIsEditDialogOpen(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gerenciamento de Usuários
        </h2>
        
        <AdminOnly showMessage={false}>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </AdminOnly>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Usuários</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {profiles?.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>
                          {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{user.full_name || user.email}</h3>
                          <Badge variant={getRoleColor(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                          {!user.is_active && (
                            <Badge variant="destructive">Inativo</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {user.turno && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getTurnoLabel(user.turno)}
                            </span>
                          )}
                          {user.telefone && (
                            <span>{user.telefone}</span>
                          )}
                        </div>
                        
                        {user.ultimo_login && (
                          <p className="text-xs text-muted-foreground">
                            Último acesso: {new Date(user.ultimo_login).toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.mfa_habilitado && (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          MFA
                        </Badge>
                      )}
                      
                      {user.bloqueado_ate && new Date(user.bloqueado_ate) > new Date() && (
                        <Badge variant="destructive">Bloqueado</Badge>
                      )}

                      <AdminOnly showMessage={false}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          disabled={user.id === currentUser?.id}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </AdminOnly>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total de Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{profiles?.length || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Administradoras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles?.filter(p => p.role === 'admin').length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Supervisoras</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles?.filter(p => p.role === 'manager').length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Usuários Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {profiles?.filter(p => p.is_active).length || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={formData.email}
                  disabled
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: AppRole) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Operadora</SelectItem>
                    <SelectItem value="manager">Supervisora</SelectItem>
                    <SelectItem value="auditor">Auditoria</SelectItem>
                    <SelectItem value="admin">Administradora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="turno">Turno</Label>
                <Select
                  value={formData.turno}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, turno: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o turno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã (6h-14h)</SelectItem>
                    <SelectItem value="tarde">Tarde (14h-22h)</SelectItem>
                    <SelectItem value="noite">Noite (22h-6h)</SelectItem>
                    <SelectItem value="integral">Integral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horario_inicio">Horário Início</Label>
                <Input
                  id="horario_inicio"
                  type="time"
                  value={formData.horario_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, horario_inicio: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="horario_fim">Horário Fim</Label>
                <Input
                  id="horario_fim"
                  type="time"
                  value={formData.horario_fim}
                  onChange={(e) => setFormData(prev => ({ ...prev, horario_fim: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active">Usuário ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};