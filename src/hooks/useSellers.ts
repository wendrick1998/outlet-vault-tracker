import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SellerService } from '@/services/sellerService';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Seller = Database['public']['Tables']['sellers']['Row'];
type SellerInsert = Database['public']['Tables']['sellers']['Insert'];
type SellerUpdate = Database['public']['Tables']['sellers']['Update'];

const QUERY_KEYS = {
  all: ['sellers'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  search: (term: string) => [...QUERY_KEYS.all, 'search', term] as const,
};

export function useSellers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: sellers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: SellerService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: SellerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Vendedor criado",
        description: "Vendedor adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar vendedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SellerUpdate }) =>
      SellerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Vendedor atualizado",
        description: "Informações do vendedor atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar vendedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: SellerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Vendedor removido",
        description: "Vendedor removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover vendedor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: SellerService.toggleActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Status alterado",
        description: "Status do vendedor alterado com sucesso.",
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
    sellers,
    isLoading,
    error,

    // Actions
    createSeller: createMutation.mutate,
    updateSeller: updateMutation.mutate,
    deleteSeller: deleteMutation.mutate,
    toggleActive: toggleActiveMutation.mutate,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isToggling: toggleActiveMutation.isPending,
  };
}

export function useSeller(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => SellerService.getById(id),
    enabled: !!id,
  });
}

export function useActiveSellers() {
  return useQuery({
    queryKey: QUERY_KEYS.list('active'),
    queryFn: SellerService.getActive,
    staleTime: 1000 * 60 * 10, // 10 minutes - sellers don't change often
  });
}

export function useSellerSearch(searchTerm: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(searchTerm),
    queryFn: () => SellerService.searchByName(searchTerm),
    enabled: !!searchTerm.trim(),
  });
}