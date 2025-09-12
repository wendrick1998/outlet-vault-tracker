import { useState } from 'react';
import { Users, UserPlus, Edit, Trash2, Clock, Shield, Key } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useAllProfiles } from '@/hooks/useProfile';
import { useUserRoleAssignments, useRolePermissions, usePermissionUtils } from '@/hooks/usePermissions';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import { PermissionGuard } from '@/components/PermissionGuard';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];
type Permission = Database['public']['Enums']['permission'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const RoleManagement = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<GranularRole | ''>('');
  const [roleToEdit, setRoleToEdit] = useState<GranularRole | null>(null);
  const [assignmentToRemove, setAssignmentToRemove] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({
    role: '' as GranularRole | '',
    expiresAt: '',
    notes: ''
  });

  const { toast } = useToast();
  const { data: profiles = [], isLoading: profilesLoading } = useAllProfiles();
  const { 
    assignments = [], 
    assignRole, 
    removeRole, 
    isAssigning, 
    isRemoving 
  } = useUserRoleAssignments(selectedUserId);
  
  const { 
    rolePermissions = [], 
    updatePermissions, 
    isUpdating 
  } = useRolePermissions();
  
  const { 
    availableRoles, 
    availablePermissions, 
    getRoleDescription, 
    getPermissionDescription 
  } = usePermissionUtils();

  // Role assignment dialog
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  
  // Permission editing
  const [editingPermissions, setEditingPermissions] = useState<Record<GranularRole, Permission[]>>({
    admin: [],
    manager: [],
    supervisor: [],
    operator: [],
    auditor: [],
    viewer: []
  });

  const handleAssignRole = async () => {
    if (!selectedUserId || !newAssignment.role) {
      toast({
        title: 'Dados obrigatórios',
        description: 'Selecione um usuário e papel.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await assignRole({
        role: newAssignment.role,
        expiresAt: newAssignment.expiresAt || undefined,
        notes: newAssignment.notes || undefined
      });
      
      setNewAssignment({ role: '', expiresAt: '', notes: '' });
      setShowAssignDialog(false);
    } catch (error) {
      console.error('Error assigning role:', error);
    }
  };

  const handleRemoveRole = async () => {
    if (!assignmentToRemove) return;
    
    try {
      await removeRole(assignmentToRemove);
      setAssignmentToRemove(null);
    } catch (error) {
      console.error('Error removing role:', error);
    }
  };

  const getCurrentPermissions = (role: GranularRole): Permission[] => {
    return rolePermissions
      .filter(rp => rp.role === role)
      .map(rp => rp.permission);
  };

  const handlePermissionChange = (role: GranularRole, permission: Permission, checked: boolean) => {
    const current = editingPermissions[role] || getCurrentPermissions(role);
    const updated = checked 
      ? [...current, permission]
      : current.filter(p => p !== permission);
    
    setEditingPermissions(prev => ({ ...prev, [role]: updated }));
  };

  const handleSavePermissions = async (role: GranularRole) => {
    const permissions = editingPermissions[role] || getCurrentPermissions(role);
    
    try {
      await updatePermissions({ role, permissions });
      setRoleToEdit(null);
      setEditingPermissions(prev => ({ ...prev, [role]: [] }));
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const getRoleBadgeVariant = (role: GranularRole) => {
    const variants: Record<GranularRole, "default" | "secondary" | "destructive" | "outline"> = {
      admin: "destructive",
      manager: "default", 
      supervisor: "secondary",
      operator: "outline",
      auditor: "secondary",
      viewer: "outline"
    };
    return variants[role] || "outline";
  };

  return (
    <FeatureFlagWrapper flag={FEATURE_FLAGS.GRANULAR_PERMISSIONS}>
      <PermissionGuard permission="users.manage_roles">
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Gerenciamento de Papéis
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Gerencie papéis e permissões dos usuários
                  </p>
                </div>
              </div>

              <Tabs defaultValue="assignments" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="assignments" className="gap-2">
                    <Users className="h-4 w-4" />
                    Atribuições
                  </TabsTrigger>
                  <TabsTrigger value="permissions" className="gap-2">
                    <Key className="h-4 w-4" />
                    Permissões
                  </TabsTrigger>
                </TabsList>

                {/* User Role Assignments Tab */}
                <TabsContent value="assignments" className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.full_name || profile.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedUserId && (
                      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogTrigger asChild>
                          <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Atribuir Papel
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Atribuir Papel ao Usuário</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Papel</label>
                              <Select 
                                value={newAssignment.role} 
                                onValueChange={(value) => setNewAssignment({ ...newAssignment, role: value as GranularRole })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um papel" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableRoles.map((role) => (
                                    <SelectItem key={role} value={role}>
                                      <div className="flex items-center gap-2">
                                        <Badge variant={getRoleBadgeVariant(role)}>
                                          {role}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                          {getRoleDescription(role)}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Data de expiração (opcional)</label>
                              <Input
                                type="datetime-local"
                                value={newAssignment.expiresAt}
                                onChange={(e) => setNewAssignment({ ...newAssignment, expiresAt: e.target.value })}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium">Observações (opcional)</label>
                              <Textarea
                                value={newAssignment.notes}
                                onChange={(e) => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                                placeholder="Motivo da atribuição..."
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-3 pt-4">
                              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleAssignRole} disabled={isAssigning}>
                                {isAssigning ? 'Atribuindo...' : 'Atribuir'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {selectedUserId && (
                    <Card>
                      <div className="p-4">
                        <h4 className="font-medium mb-4">Papéis Atribuídos</h4>
                        
                        {assignments.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            Nenhum papel atribuído a este usuário.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Papel</TableHead>
                                <TableHead>Atribuído em</TableHead>
                                <TableHead>Expira em</TableHead>
                                <TableHead>Observações</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {assignments.map((assignment) => (
                                <TableRow key={assignment.id}>
                                  <TableCell>
                                    <Badge variant={getRoleBadgeVariant(assignment.role)}>
                                      {assignment.role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                      {format(new Date(assignment.assigned_at), 'dd/MM/yyyy HH:mm')}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {assignment.expires_at ? (
                                      <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        <span className="text-sm">
                                          {format(new Date(assignment.expires_at), 'dd/MM/yyyy HH:mm')}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">Permanente</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-sm">
                                      {assignment.notes || '-'}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setAssignmentToRemove(assignment.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    </Card>
                  )}
                </TabsContent>

                {/* Role Permissions Tab */}
                <TabsContent value="permissions" className="space-y-4">
                  <div className="grid gap-4">
                    {availableRoles.map((role) => {
                      const currentPermissions = getCurrentPermissions(role);
                      const editingThisRole = roleToEdit === role;
                      const permissionsToShow = editingThisRole 
                        ? (editingPermissions[role] || currentPermissions)
                        : currentPermissions;

                      return (
                        <Card key={role}>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <Badge variant={getRoleBadgeVariant(role)} className="text-sm">
                                  {role}
                                </Badge>
                                <div>
                                  <h4 className="font-medium">{role}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {getRoleDescription(role)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                {editingThisRole ? (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => {
                                        setRoleToEdit(null);
                                        setEditingPermissions(prev => ({ ...prev, [role]: [] }));
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button 
                                      size="sm"
                                      onClick={() => handleSavePermissions(role)}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? 'Salvando...' : 'Salvar'}
                                    </Button>
                                  </>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setRoleToEdit(role);
                                      setEditingPermissions(prev => ({ 
                                        ...prev, 
                                        [role]: currentPermissions 
                                      }));
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {availablePermissions.map((permission) => {
                                const isChecked = permissionsToShow.includes(permission);
                                
                                return (
                                  <div key={permission} className="flex items-start space-x-2">
                                    <Checkbox
                                      id={`${role}-${permission}`}
                                      checked={isChecked}
                                      disabled={!editingThisRole}
                                      onCheckedChange={(checked) => 
                                        handlePermissionChange(role, permission, !!checked)
                                      }
                                    />
                                    <div className="grid gap-1.5 leading-none">
                                      <label
                                        htmlFor={`${role}-${permission}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {permission}
                                      </label>
                                      <p className="text-xs text-muted-foreground">
                                        {getPermissionDescription(permission)}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </Card>

          {/* Remove Role Confirmation Dialog */}
          <AlertDialog open={!!assignmentToRemove} onOpenChange={() => setAssignmentToRemove(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remover Papel</AlertDialogTitle>
                <AlertDialogDescription>
                  Você tem certeza que deseja remover este papel do usuário?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRemoveRole}
                  disabled={isRemoving}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isRemoving ? 'Removendo...' : 'Remover'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PermissionGuard>
    </FeatureFlagWrapper>
  );
};