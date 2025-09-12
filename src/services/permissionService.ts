import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];
type Permission = Database['public']['Enums']['permission'];
type UserRoleAssignment = Database['public']['Tables']['user_role_assignments']['Row'];
type RolePermission = Database['public']['Tables']['role_permissions']['Row'];

export class PermissionService {
  // Check if current user has specific permission
  static async hasPermission(permission: Permission): Promise<boolean> {
    const { data, error } = await supabase.rpc('current_user_has_permission', {
      required_permission: permission
    });

    if (error) {
      console.error('Permission check error:', error);
      return false;
    }
    
    return data || false;
  }

  // Get all permissions for current user
  static async getCurrentUserPermissions(): Promise<Permission[]> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) return [];

    const { data, error } = await supabase.rpc('get_user_permissions', {
      user_id: user.data.user.id
    });

    if (error) {
      console.error('Get permissions error:', error);
      return [];
    }

    return data || [];
  }

  // Get user role assignments
  static async getUserRoleAssignments(userId: string): Promise<UserRoleAssignment[]> {
    const { data, error } = await supabase
      .from('user_role_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Assign role to user
  static async assignUserRole(
    userId: string, 
    role: GranularRole, 
    expiresAt?: string,
    notes?: string
  ): Promise<UserRoleAssignment> {
    const currentUser = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('user_role_assignments')
      .insert({
        user_id: userId,
        role,
        assigned_by: currentUser.data.user?.id,
        expires_at: expiresAt || null,
        notes: notes || null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Remove user role
  static async removeUserRole(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('user_role_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId);

    if (error) throw error;
  }

  // Get all role permissions
  static async getRolePermissions(): Promise<RolePermission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('*')
      .order('role', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Get permissions for specific role
  static async getPermissionsForRole(role: GranularRole): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission')
      .eq('role', role);

    if (error) throw error;
    return data?.map(item => item.permission) || [];
  }

  // Update role permissions (admin only)
  static async updateRolePermissions(
    role: GranularRole, 
    permissions: Permission[]
  ): Promise<void> {
    // Remove existing permissions
    await supabase
      .from('role_permissions')
      .delete()
      .eq('role', role);

    // Add new permissions
    const rolePermissions = permissions.map(permission => ({
      role,
      permission
    }));

    const { error } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);

    if (error) throw error;
  }

  // Get all available permissions
  static getAvailablePermissions(): Permission[] {
    return [
      'inventory.view',
      'inventory.create', 
      'inventory.update',
      'inventory.delete',
      'inventory.bulk_operations',
      'movements.view',
      'movements.create',
      'movements.approve',
      'movements.cancel',
      'users.view',
      'users.create',
      'users.update',
      'users.delete',
      'users.manage_roles',
      'audit.view',
      'audit.export',
      'system.config',
      'system.backup',
      'system.features'
    ];
  }

  // Get all available roles
  static getAvailableRoles(): GranularRole[] {
    return ['admin', 'manager', 'supervisor', 'operator', 'auditor', 'viewer'];
  }

  // Permission descriptions
  static getPermissionDescription(permission: Permission): string {
    const descriptions: Record<Permission, string> = {
      'inventory.view': 'Visualizar inventário',
      'inventory.create': 'Criar itens no inventário',
      'inventory.update': 'Editar itens do inventário',
      'inventory.delete': 'Excluir itens do inventário',
      'inventory.bulk_operations': 'Operações em lote no inventário',
      'movements.view': 'Visualizar movimentações',
      'movements.create': 'Criar movimentações',
      'movements.approve': 'Aprovar movimentações',
      'movements.cancel': 'Cancelar movimentações',
      'users.view': 'Visualizar usuários',
      'users.create': 'Criar usuários',
      'users.update': 'Editar usuários',
      'users.delete': 'Excluir usuários',
      'users.manage_roles': 'Gerenciar papéis de usuários',
      'audit.view': 'Visualizar logs de auditoria',
      'audit.export': 'Exportar dados de auditoria',
      'system.config': 'Configurar sistema',
      'system.backup': 'Fazer backup do sistema',
      'system.features': 'Gerenciar funcionalidades'
    };
    return descriptions[permission] || permission;
  }

  // Role descriptions
  static getRoleDescription(role: GranularRole): string {
    const descriptions: Record<GranularRole, string> = {
      'admin': 'Administrador - Acesso completo ao sistema',
      'manager': 'Gerente - Gestão departamental e regional',
      'supervisor': 'Supervisor - Supervisão de equipes',
      'operator': 'Operador - Operações padrão do sistema',
      'auditor': 'Auditor - Acesso somente leitura para auditoria',
      'viewer': 'Visualizador - Acesso mínimo somente leitura'
    };
    return descriptions[role] || role;
  }
}