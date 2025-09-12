import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const QUERY_KEY = 'admin-users';

export const useUsersAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Profile[];
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: ProfileUpdate }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Usuário atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleUserStatus = (userId: string, currentStatus: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { is_active: !currentStatus }
    });
  };

  const toggleCanWithdraw = (userId: string, currentCanWithdraw: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { can_withdraw: !currentCanWithdraw }
    });
  };

  return {
    users,
    isLoading,
    error,
    updateUser: updateUserMutation.mutate,
    toggleUserStatus,
    toggleCanWithdraw,
    isUpdating: updateUserMutation.isPending,
  };
};