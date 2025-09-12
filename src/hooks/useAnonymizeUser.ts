import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useAnonymizeUser = () => {
  const queryClient = useQueryClient();

  const anonymizeUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { error } = await supabase.rpc('anonymize_user', {
        p_user_id: userId,
        p_reason: reason || 'Solicitação administrativa'
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Usuário anonimizado",
        description: "O usuário foi anonimizado com sucesso. Dados pessoais foram removidos preservando o histórico.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao anonimizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    anonymizeUser: anonymizeUserMutation.mutate,
    isAnonymizing: anonymizeUserMutation.isPending,
  };
};