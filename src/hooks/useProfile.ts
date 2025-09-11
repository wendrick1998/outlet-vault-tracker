import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type AppRole = Database['public']['Enums']['app_role'];

const QUERY_KEYS = {
  profile: ['profile'] as const,
  currentProfile: () => [...QUERY_KEYS.profile, 'current'] as const,
  profileById: (id: string) => [...QUERY_KEYS.profile, 'by-id', id] as const,
  allProfiles: () => [...QUERY_KEYS.profile, 'all'] as const,
  userRole: (role: AppRole) => [...QUERY_KEYS.profile, 'role', role] as const,
  isAdmin: () => [...QUERY_KEYS.profile, 'admin'] as const,
};

export function useCurrentProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.currentProfile(),
    queryFn: ProfileService.getCurrentProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useProfile(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.profileById(id),
    queryFn: () => ProfileService.getProfileById(id),
    enabled: !!id,
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.allProfiles(),
    queryFn: ProfileService.getAllProfiles,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProfileUpdate }) =>
      ProfileService.updateProfile(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast({
        title: "Perfil atualizado",
        description: "As informações do perfil foram atualizadas com sucesso."
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateCurrentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Omit<ProfileUpdate, 'id' | 'role'>) =>
      ProfileService.updateCurrentProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentProfile() });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive"
      });
    }
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      ProfileService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast({
        title: "Role atualizada",
        description: "A role do usuário foi alterada com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar a role do usuário.",
        variant: "destructive"
      });
    }
  });
}

export function useCheckRole(role: AppRole) {
  return useQuery({
    queryKey: QUERY_KEYS.userRole(role),
    queryFn: () => ProfileService.checkUserRole(role),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: QUERY_KEYS.isAdmin(),
    queryFn: ProfileService.isAdmin,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}