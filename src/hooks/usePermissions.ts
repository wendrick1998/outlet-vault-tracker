import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PermissionService } from '@/services/permissionService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { Database } from '@/integrations/supabase/types';

type GranularRole = Database['public']['Enums']['granular_role'];
type Permission = Database['public']['Enums']['permission'];

// Hook to check if user has specific permission
export function useHasPermission(permission: Permission) {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.list({ permission }),
    queryFn: () => PermissionService.hasPermission(permission),
    retry: false,
  });
}

// Hook to get current user permissions
export function useCurrentUserPermissions() {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.lists(),
    queryFn: PermissionService.getCurrentUserPermissions,
  });
}

// Hook to manage user role assignments
export function useUserRoleAssignments(userId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: assignments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.permissions.detail(userId),
    queryFn: () => PermissionService.getUserRoleAssignments(userId),
    enabled: !!userId,
  });

  const assignRoleMutation = useMutation({
    mutationFn: ({
      role,
      expiresAt,
      notes,
    }: {
      role: GranularRole;
      expiresAt?: string;
      notes?: string;
    }) => PermissionService.assignUserRole(userId, role, expiresAt, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.detail(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      toast({
        title: 'Papel atribuído',
        description: 'Papel foi atribuído ao usuário com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atribuir papel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: PermissionService.removeUserRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.detail(userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      toast({
        title: 'Papel removido',
        description: 'Papel foi removido do usuário com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover papel',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    assignments,
    isLoading,
    error,
    assignRole: assignRoleMutation.mutateAsync,
    removeRole: removeRoleMutation.mutateAsync,
    isAssigning: assignRoleMutation.isPending,
    isRemoving: removeRoleMutation.isPending,
  };
}

// Hook to manage role permissions (admin only)
export function useRolePermissions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: rolePermissions = [],
    isLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.permissions.list({ type: 'role-permissions' }),
    queryFn: PermissionService.getRolePermissions,
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({
      role,
      permissions,
    }: {
      role: GranularRole;
      permissions: Permission[];
    }) => PermissionService.updateRolePermissions(role, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.list({ type: 'role-permissions' }) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.permissions.all });
      toast({
        title: 'Permissões atualizadas',
        description: 'Permissões do papel foram atualizadas com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar permissões',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    rolePermissions,
    isLoading,
    updatePermissions: updatePermissionsMutation.mutateAsync,
    isUpdating: updatePermissionsMutation.isPending,
  };
}

// Hook to get permissions for specific role
export function useRolePermission(role: GranularRole) {
  return useQuery({
    queryKey: QUERY_KEYS.permissions.detail(`role-${role}`),
    queryFn: () => PermissionService.getPermissionsForRole(role),
    enabled: !!role,
  });
}

// Utility functions
export const usePermissionUtils = () => {
  return {
    availablePermissions: PermissionService.getAvailablePermissions(),
    availableRoles: PermissionService.getAvailableRoles(),
    getPermissionDescription: PermissionService.getPermissionDescription,
    getRoleDescription: PermissionService.getRoleDescription,
  };
};

// Permission guard component hook
export function usePermissionGuard(
  permission: Permission,
  options: { 
    redirectOnDenied?: boolean;
    showToast?: boolean;
  } = {}
) {
  const { data: hasPermission, isLoading } = useHasPermission(permission);
  const { toast } = useToast();

  if (!isLoading && !hasPermission && options.showToast) {
    toast({
      title: 'Acesso negado',
      description: 'Você não tem permissão para acessar esta funcionalidade.',
      variant: 'destructive',
    });
  }

  return {
    hasPermission: hasPermission || false,
    isLoading,
    canAccess: hasPermission || false,
  };
}