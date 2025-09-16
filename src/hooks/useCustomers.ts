import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerService, type SecureCustomer } from '@/services/customerService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { handleError, handleSuccess } from '@/lib/error-handler';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export function useCustomers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: customers = [],
    isLoading,
    error,
  } = useQuery<SecureCustomer[]>({
    queryKey: QUERY_KEYS.customers.lists(),
    queryFn: CustomerService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: CustomerService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Cliente criado",
        description: "Cliente adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao criar cliente",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerUpdate }) =>
      CustomerService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Cliente atualizado",
        description: "Informações do cliente atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao atualizar cliente",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: CustomerService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Cliente removido",
        description: "Cliente removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao remover cliente",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const registerMutation = useMutation({
    mutationFn: CustomerService.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Cliente registrado",
        description: "Cliente registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao registrar cliente",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: CustomerService.unregister,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Registro removido",
        description: "Registro do cliente removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao remover registro",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const clearTestDataMutation = useMutation({
    mutationFn: CustomerService.clearTestData,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.customers.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      
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
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao limpar dados de teste",
        source: 'customers'
      });
      if (errorConfig) toast(errorConfig);
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
    queryKey: QUERY_KEYS.customers.detail(id),
    queryFn: () => CustomerService.getById(id),
    enabled: !!id,
  });
}

export function useRegisteredCustomers() {
  return useQuery({
    queryKey: QUERY_KEYS.customers.list({ filters: 'registered' }),
    queryFn: CustomerService.getRegistered,
  });
}

export function useCustomerSearch(searchTerm: string, searchType: 'name' | 'email' | 'phone' = 'name') {
  return useQuery({
    queryKey: QUERY_KEYS.customers.search(searchTerm + searchType),
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