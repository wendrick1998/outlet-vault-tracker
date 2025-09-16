import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockService } from '@/services/stockService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockItemInsert = Database['public']['Tables']['stock_items']['Insert'];
type StockItemUpdate = Database['public']['Tables']['stock_items']['Update'];

const QUERY_KEYS = {
  all: ['stock'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  search: (term: string) => [...QUERY_KEYS.all, 'search', term] as const,
  stats: () => [...QUERY_KEYS.all, 'stats'] as const,
  conferences: () => [...QUERY_KEYS.all, 'conferences'] as const,
};

export function useStock(options?: {
  status?: string;
  location?: string;
  includeArchived?: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.list(JSON.stringify(options || {})),
    queryFn: () => StockService.getAll(options),
  });

  const createMutation = useMutation({
    mutationFn: StockService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Item adicionado",
        description: "Item adicionado ao estoque com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StockItemUpdate }) =>
      StockService.update(id, data),
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
    mutationFn: StockService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Item removido",
        description: "Item removido do estoque com sucesso.",
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
    mutationFn: ({ id, status }: { id: string; status: Database['public']['Enums']['stock_status'] }) =>
      StockService.updateStatus(id, status),
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

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, location }: { id: string; location: Database['public']['Enums']['stock_location'] }) =>
      StockService.updateLocation(id, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar localização",
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
    updateLocation: updateLocationMutation.mutateAsync,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingLocation: updateLocationMutation.isPending,
  };
}

export function useStockItem(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => StockService.getById(id),
    enabled: !!id,
  });
}

export function useStockSearch(searchTerm: string) {
  return useQuery({
    queryKey: QUERY_KEYS.search(searchTerm),
    queryFn: () => StockService.searchByIMEI(searchTerm),
    enabled: !!searchTerm.trim(),
  });
}

export function useStockStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats(),
    queryFn: StockService.getStats,
  });
}

export function useStockLabels() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addLabelMutation = useMutation({
    mutationFn: ({ stockItemId, labelId }: { stockItemId: string; labelId: string }) =>
      StockService.addLabel(stockItemId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Etiqueta aplicada",
        description: "Etiqueta aplicada ao item com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aplicar etiqueta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeLabelMutation = useMutation({
    mutationFn: ({ stockItemId, labelId }: { stockItemId: string; labelId: string }) =>
      StockService.removeLabel(stockItemId, labelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Etiqueta removida",
        description: "Etiqueta removida do item com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover etiqueta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    addLabel: addLabelMutation.mutateAsync,
    removeLabel: removeLabelMutation.mutateAsync,
    isAddingLabel: addLabelMutation.isPending,
    isRemovingLabel: removeLabelMutation.isPending,
  };
}

export function useStockConferences() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conferences = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.conferences(),
    queryFn: StockService.getConferences,
  });

  const createConferenceMutation = useMutation({
    mutationFn: StockService.createConference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conferences() });
      toast({
        title: "Conferência criada",
        description: "Conferência de estoque criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conferência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    conferences,
    isLoading,
    createConference: createConferenceMutation.mutateAsync,
    isCreating: createConferenceMutation.isPending,
  };
}