import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PendingSalesService, type PendingSaleWithDetails } from '@/services/pendingSalesService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type PendingSaleInsert = Database['public']['Tables']['pending_sales']['Insert'];

const QUERY_KEYS = {
  pendingSales: ['pending-sales'] as const,
  pendingSale: (id: string) => ['pending-sales', id] as const,
  pendingStats: ['pending-sales', 'stats'] as const,
  userPendingSales: (userId: string) => ['pending-sales', 'user', userId] as const,
};

export function usePendingSales() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all pending sales
  const {
    data: pendingSales = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.pendingSales,
    queryFn: PendingSalesService.getAll,
  });

  // Create pending sale mutation
  const createPendingSale = useMutation({
    mutationFn: (pendingSale: PendingSaleInsert) =>
      PendingSalesService.create(pendingSale),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingSales });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingStats });
      toast({
        title: "Pendência criada",
        description: "A venda foi marcada como pendente de regularização.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating pending sale:', error);
      toast({
        title: "Erro ao criar pendência",
        description: "Não foi possível criar a pendência de venda.",
        variant: "destructive",
      });
    },
  });

  // Resolve pending sale mutation
  const resolvePendingSale = useMutation({
    mutationFn: ({
      id,
      saleNumber,
      notes,
    }: {
      id: string;
      saleNumber: string;
      notes?: string;
    }) => PendingSalesService.resolve(id, saleNumber, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingSales });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingStats });
      toast({
        title: "Pendência resolvida",
        description: "A venda foi regularizada com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error resolving pending sale:', error);
      toast({
        title: "Erro ao resolver pendência",
        description: "Não foi possível regularizar a pendência.",
        variant: "destructive",
      });
    },
  });

  return {
    pendingSales,
    isLoading,
    error,
    createPendingSale: createPendingSale.mutate,
    resolvePendingSale: resolvePendingSale.mutate,
    isCreating: createPendingSale.isPending,
    isResolving: resolvePendingSale.isPending,
  };
}

export function usePendingSale(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.pendingSale(id),
    queryFn: () => PendingSalesService.getById(id),
    enabled: !!id,
  });
}

export function usePendingSalesOnly() {
  return useQuery({
    queryKey: ['pending-sales', 'pending-only'],
    queryFn: PendingSalesService.getPending,
  });
}

export function usePendingSalesStats() {
  return useQuery({
    queryKey: QUERY_KEYS.pendingStats,
    queryFn: PendingSalesService.getStats,
  });
}

export function useUserPendingSales(userId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.userPendingSales(userId),
    queryFn: () => PendingSalesService.getByUser(userId),
    enabled: !!userId,
  });
}