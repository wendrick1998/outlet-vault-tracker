import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReasonService } from '@/services/reasonService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Reason = Database['public']['Tables']['reasons']['Row'];
type ReasonInsert = Database['public']['Tables']['reasons']['Insert'];
type ReasonUpdate = Database['public']['Tables']['reasons']['Update'];

const QUERY_KEYS = {
  all: ['reasons'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

export function useReasons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: reasons = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: ReasonService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: ReasonService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Motivo criado",
        description: "Novo motivo adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar motivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReasonUpdate }) =>
      ReasonService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Motivo atualizado",
        description: "Informações do motivo atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar motivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ReasonService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Motivo removido",
        description: "Motivo removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover motivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ReasonService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Status alterado",
        description: "Status do motivo alterado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    reasons,
    isLoading,
    error,

    // Actions
    createReason: createMutation.mutate,
    updateReason: updateMutation.mutate,
    deleteReason: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
}

export function useReason(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => ReasonService.getById(id),
    enabled: !!id,
  });
}

export function useActiveReasons() {
  return useQuery({
    queryKey: QUERY_KEYS.list('active'),
    queryFn: ReasonService.getActive,
    staleTime: 1000 * 60 * 10, // 10 minutes - reasons don't change often
  });
}