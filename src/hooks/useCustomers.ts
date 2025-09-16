import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService } from '@/services/customerService';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

const QUERY_KEYS = {
  all: ['customers'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  search: (term: string, type: string) => [...QUERY_KEYS.all, 'search', type, term] as const,
};

export function useCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: CustomerService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: CustomerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      CustomerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Cliente atualizado",
        description: "Informações do cliente atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: CustomerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: CustomerService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Cliente registrado",
        description: "Cliente registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: CustomerService.unregister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Registro removido",
        description: "Registro do cliente removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearTestDataMutation = useMutation({
    mutationFn: CustomerService.clearTestData,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      
      let message = `${result.deleted} clientes removidos`;
      if (result.skipped > 0) {
        message += `, ${result.skipped} mantidos (com empréstimos ativos)`;
      }
      
      toast({
        title: "Limpeza concluída",
        description: message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar dados de teste",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Data
    customers,
    isLoading,
    error,

    // Actions
    createCustomer: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutateAsync,
    registerCustomer: registerMutation.mutateAsync,
    unregisterCustomer: unregisterMutation.mutateAsync,
    clearTestData: clearTestDataMutation.mutateAsync,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRegistering: registerMutation.isPending,
    isUnregistering: unregisterMutation.isPending,
    isClearingTestData: clearTestDataMutation.isPending,
  };
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => CustomerService.getById(id),
    enabled: !!id,
  });
}

export function useRegisteredCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.list('registered'),
    queryFn: CustomerService.getRegistered,
  });
}

export function useCustomerSearch(searchTerm: string, searchType: 'name' | 'email' | 'phone' = 'name') {
  return useQuery({
    queryKey: QUERY_KEYS.search(searchTerm, searchType),
    queryFn: () => {
      switch (searchType) {
        case 'email':
          return CustomerService.searchByEmail(searchTerm);
        case 'phone':
          return CustomerService.searchByPhone(searchTerm);
        default:
          return CustomerService.searchByName(searchTerm);
      }
    },
    enabled: !!searchTerm.trim(),
  });
}