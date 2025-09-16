import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/services/profileService';
import { toast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type AppRole = Database['public']['Enums']['app_role'];

export function useCurrentProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.list({ current: true }),
    queryFn: ProfileService.getCurrentProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes - profile doesn't change often
  });
}

export function useProfile(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.detail(userId),
    queryFn: () => ProfileService.getProfileByUserId(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAllProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.lists(),
    queryFn: ProfileService.getAllProfiles,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useProfilesByRole(role: AppRole) {
  return useQuery({
    queryKey: QUERY_KEYS.profiles.list({ role }),
    queryFn: () => ProfileService.getProfilesByRole(role),
    enabled: !!role,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useUpdateCurrentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: ProfileUpdate) => ProfileService.updateCurrentProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profiles.list({ current: true }) 
      });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: ProfileUpdate }) =>
      ProfileService.updateProfile(userId, updates),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profiles.detail(userId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profiles.lists() 
      });
      toast({
        title: "Perfil atualizado",
        description: "O perfil foi atualizado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast({
        title: "Erro ao atualizar perfil",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>) =>
      ProfileService.createProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profiles.lists() 
      });
      toast({
        title: "Perfil criado",
        description: "O perfil foi criado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating profile:', error);
      toast({
        title: "Erro ao criar perfil",
        description: "Não foi possível criar o perfil.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => ProfileService.deleteProfile(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.profiles.lists() 
      });
      toast({
        title: "Perfil removido",
        description: "O perfil foi removido com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error deleting profile:', error);
      toast({
        title: "Erro ao remover perfil",
        description: "Não foi possível remover o perfil.",
        variant: "destructive",
      });
    },
  });
}