import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateCurrentProfile } from '@/hooks/useProfile';
import { usePinProtection } from '@/hooks/usePinProtection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Mail, Calendar, Shield, Lock, Settings } from 'lucide-react';
import { PinConfigurationDialog } from '@/components/PinConfigurationDialog';

interface ProfileProps {
  onBack: () => void;
}

export const Profile = ({ onBack }: ProfileProps) => {
  const { profile, profileLoading } = useAuth();
  const updateProfile = useUpdateCurrentProfile();
  const { hasPinConfigured, checkPinConfiguration } = usePinProtection();
  
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [showPinDialog, setShowPinDialog] = useState(false);

  // Verificar se PIN está configurado ao carregar o componente
  useEffect(() => {
    checkPinConfiguration();
  }, [checkPinConfiguration]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Não foi possível carregar o perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button onClick={onBack} variant="ghost" className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Summary */}
        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-20 h-20 mx-auto mb-4">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'Avatar'} />
              <AvatarFallback className="text-lg">
                {profile.full_name?.split(' ').map(n => n[0]).join('') || profile.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{profile.full_name || 'Nome não definido'}</CardTitle>
            <Badge variant={getRoleColor(profile.role)} className="w-fit mx-auto">
              <Shield className="mr-1 h-3 w-3" />
              {getRoleLabel(profile.role)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              {profile.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              Status: <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                {profile.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <Separator />

            {/* Seção de Segurança - PIN Operacional */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="h-4 w-4" />
                PIN Operacional
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    {hasPinConfigured ? 'PIN configurado' : 'PIN não configurado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Necessário para confirmar operações
                  </p>
                </div>
                <Badge variant={hasPinConfigured ? 'default' : 'destructive'}>
                  {hasPinConfigured ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <Button
                onClick={() => setShowPinDialog(true)}
                variant={hasPinConfigured ? 'outline' : 'default'}
                size="sm"
                className="w-full"
              >
                <Settings className="mr-2 h-3 w-3" />
                {hasPinConfigured ? 'Alterar PIN' : 'Configurar PIN'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form */}
        <Card className="md:col-span-2">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Editar Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Digite seu nome completo"
                />
              </div>
              
              <div>
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                  placeholder="https://exemplo.com/avatar.jpg"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input value={profile.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">
                  O email não pode ser alterado aqui. Entre em contato com o suporte se necessário.
                </p>
              </div>

              <div>
                <Label>Nível de Acesso</Label>
                <Input value={getRoleLabel(profile.role)} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas administradores podem alterar níveis de acesso.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                disabled={updateProfile.isPending}
                className="w-full"
              >
                {updateProfile.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* PIN Configuration Dialog */}
      <PinConfigurationDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={() => {
          checkPinConfiguration();
        }}
      />
    </div>
  );
};