import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { InventoryService } from '@/services/inventoryService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

export function useInventory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.inventory.lists(),
    queryFn: () => InventoryService.getAll(false), // Only show non-archived by default
  });

  const showToast = useCallback((title: string, description: string, variant?: 'default' | 'destructive') => {
    toast({ title, description, variant });
  }, [toast]);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: InventoryService.create,
    onSuccess: () => {
      invalidateQueries();
      showToast("Item criado", "Item adicionado ao inventário com sucesso.");
    },
    onError: (error: Error) => {
      showToast("Erro ao criar item", error.message, "destructive");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InventoryUpdate }) =>
      InventoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
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
        includeArchived?: boolean;
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

  return useMemo(() => ({
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
  }), [
    items, isLoading, error,
    createMutation.mutateAsync, createMutation.isPending,
    updateMutation.mutateAsync, updateMutation.isPending,
    deleteMutation.mutateAsync, deleteMutation.isPending,
    updateStatusMutation.mutateAsync, updateStatusMutation.isPending,
    searchMutation.mutateAsync, searchMutation.isPending
  ]);
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.detail(id),
    queryFn: () => InventoryService.getById(id),
    enabled: !!id,
  });
}

export function useAvailableItems() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.list({ filters: 'available' }),
    queryFn: InventoryService.getAvailable,
  });
}

export function useLoanedItems() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.list({ filters: 'loaned' }),
    queryFn: InventoryService.getLoaned,
  });
}

export function useInventorySearch(searchTerm: string) {
  return useQuery({
    queryKey: QUERY_KEYS.inventory.search(searchTerm),
    queryFn: () => InventoryService.searchByIMEI(searchTerm, { includeArchived: false }),
    enabled: !!searchTerm.trim(),
  });
}