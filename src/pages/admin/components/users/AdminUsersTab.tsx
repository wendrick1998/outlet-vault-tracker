import { useState } from "react";
import { Plus, Search, Filter, UserX, Archive, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersAdmin } from "@/hooks/useUsersAdmin";
import { Loading } from "@/components/ui/loading";
import { AddUserDialog } from "@/components/AddUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useAnonymizeUser } from "@/hooks/useAnonymizeUser";

export const AdminUsersTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [canWithdrawFilter, setCanWithdrawFilter] = useState<string>("all");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'anonymize';
    user: any;
  }>({ isOpen: false, type: 'anonymize', user: null });
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<{ id: string; name: string } | null>(null);

  const { users: profiles = [], isLoading, toggleUserStatus, toggleCanWithdraw, isUpdating } = useUsersAdmin();
  const { anonymizeUser, isAnonymizing } = useAnonymizeUser();

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || profile.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && profile.is_active) ||
                         (statusFilter === "inactive" && !profile.is_active);
    const matchesCanWithdraw = canWithdrawFilter === "all" || 
                              (canWithdrawFilter === "yes" && (profile as any).can_withdraw) ||
                              (canWithdrawFilter === "no" && !(profile as any).can_withdraw);
    
    return matchesSearch && matchesRole && matchesStatus && matchesCanWithdraw;
  });

  const handleConfirmAnonymize = () => {
    if (confirmModal.user) {
      anonymizeUser({ 
        userId: confirmModal.user.id, 
        reason: 'Anonimização via interface administrativa' 
      });
      setConfirmModal({ isOpen: false, type: 'anonymize', user: null });
    }
  };

  const handleResetPassword = (user: { id: string; full_name: string }) => {
    setUserToResetPassword({ id: user.id, name: user.full_name });
    setShowResetPasswordDialog(true);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Usuários Autorizados</h2>
          <AddUserDialog onUserAdded={() => window.location.reload()} />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os papéis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os papéis</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">Operador</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={canWithdrawFilter} onValueChange={setCanWithdrawFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Pode retirar?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Pode retirar</SelectItem>
              <SelectItem value="no">Não pode retirar</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Pode Retirar?</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name || 'Sem nome'}
                    </TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        profile.role === 'admin' ? 'destructive' :
                        profile.role === 'manager' ? 'default' : 'secondary'
                      }>
                        {profile.role === 'admin' ? 'Admin' :
                         profile.role === 'manager' ? 'Manager' : 'Operador'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={profile.can_withdraw || false}
                        onCheckedChange={() => toggleCanWithdraw(profile.id, profile.can_withdraw || false)}
                        disabled={isUpdating}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant={profile.is_active ? 'default' : 'secondary'}>
                        {profile.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {profile.ultimo_login ? 
                        new Date(profile.ultimo_login).toLocaleDateString('pt-BR') : 
                        'Nunca acessou'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResetPassword(profile)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={profile.is_active ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => toggleUserStatus(profile.id, profile.is_active)}
                          disabled={isUpdating}
                        >
                          {profile.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        {profile.is_active && !profile.is_anonymized && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setConfirmModal({ isOpen: true, type: 'anonymize', user: profile })}
                            disabled={isAnonymizing}
                          >
                            <UserX className="h-3 w-3 mr-1" />
                            Anonimizar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: 'anonymize', user: null })}
          onConfirm={handleConfirmAnonymize}
          title="Anonimizar Usuário"
          description={
            `ATENÇÃO: Esta ação é irreversível! Os dados pessoais do usuário "${confirmModal.user?.full_name}" serão substituídos por dados anônimos. O histórico será preservado mas a identificação será perdida.`
          }
          variant="destructive"
          confirmText="Anonimizar Usuário"
        />

        {/* Reset Password Dialog */}
        <ResetPasswordDialog
          open={showResetPasswordDialog}
          onOpenChange={setShowResetPasswordDialog}
          userId={userToResetPassword?.id || ''}
          userName={userToResetPassword?.name || ''}
        />
      </div>
    </Card>
  );
};