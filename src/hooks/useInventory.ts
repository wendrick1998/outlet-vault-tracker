import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryService } from '@/services/inventoryService';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

const QUERY_KEYS = {
  all: ['inventory'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  search: (term: string) => [...QUERY_KEYS.all, 'search', term] as const,
};

export function useInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: InventoryService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: InventoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Item criado",
        description: "Item adicionado ao inventário com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryUpdate }) =>
      InventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Item atualizado",
        description: "Informações do item atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: InventoryService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Item removido",
        description: "Item removido do inventário com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Database['public']['Enums']['inventory_status'] }) =>
      InventoryService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const searchMutation = useMutation({
    mutationFn: ({ query, options }: { 
      query: string; 
      options?: {
        status?: Database['public']['Enums']['inventory_status'] | 'all';
        brand?: string | 'all';
        category?: string | 'all';
        dateFrom?: string;
        dateTo?: string;
      } 
    }) => InventoryService.searchByIMEI(query, options),
    onError: (error: Error) => {
      toast({
        title: "Erro na busca",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    items,
    isLoading,
    error,

    // Actions
    createItem: createMutation.mutateAsync,
    updateItem: updateMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    searchInventory: searchMutation.mutateAsync,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isSearching: searchMutation.isPending,
  };
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => InventoryService.getById(id),
    enabled: !!id,
  });
}

export function useAvailableItems() {
  return useQuery({
    queryKey: QUERY_KEYS.list('available'),
    queryFn: InventoryService.getAvailable,
  });
}

export function useLoanedItems() {
  return useQuery({
    queryKey: QUERY_KEYS.list('loaned'),
    queryFn: InventoryService.getLoaned,
  });
}

export function useInventorySearch(searchTerm: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(searchTerm),
    queryFn: () => InventoryService.searchByIMEI(searchTerm),
    enabled: !!searchTerm.trim(),
  });
}