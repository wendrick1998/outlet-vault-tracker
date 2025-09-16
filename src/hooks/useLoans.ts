import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoanService, type LoanWithDetails } from '@/services/loanService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import { handleError, handleSuccess } from '@/lib/error-handler';
import type { Database } from '@/integrations/supabase/types';

type LoanInsert = Database['public']['Tables']['loans']['Insert'];
type LoanUpdate = Database['public']['Tables']['loans']['Update'];

export function useLoans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: loans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.loans.lists(),
    queryFn: LoanService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: LoanService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Empréstimo criado",
        description: "Empréstimo registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao criar empréstimo",
        source: 'loans'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoanUpdate }) =>
      LoanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Empréstimo atualizado",
        description: "Informações do empréstimo atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao atualizar empréstimo",
        source: 'loans'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      LoanService.returnLoan(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Item devolvido",
        description: "Item devolvido com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao devolver item",
        source: 'loans'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, newDueDate, notes }: { id: string; newDueDate: Date; notes?: string }) =>
      LoanService.extendLoan(id, newDueDate, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans.all });
      toast({
        title: "Empréstimo estendido",
        description: "Prazo do empréstimo estendido com sucesso.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao estender empréstimo",
        source: 'loans'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  const sellMutation = useMutation({
    mutationFn: ({ id, saleNumber, notes }: { id: string; saleNumber?: string; notes?: string }) =>
      LoanService.sellLoan(id, saleNumber, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loans.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.inventory.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats.all });
      toast({
        title: "Venda registrada",
        description: "O item foi marcado como vendido definitivamente.",
      });
    },
    onError: (error: Error) => {
      const errorConfig = handleError(error, {
        toastTitle: "Erro ao registrar venda",
        source: 'loans'
      });
      if (errorConfig) toast(errorConfig);
    },
  });

  return {
    // Data
    loans,
    isLoading,
    error,

    // Actions
    createLoan: createMutation.mutateAsync,
    updateLoan: updateMutation.mutateAsync,
    returnLoan: returnMutation.mutateAsync,
    extendLoan: extendMutation.mutateAsync,
    sellLoan: sellMutation.mutateAsync,

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isReturning: returnMutation.isPending,
    isExtending: extendMutation.isPending,
    isSelling: sellMutation.isPending,
  };
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.loans.detail(id),
    queryFn: () => LoanService.getById(id),
    enabled: !!id,
  });
}

export function useActiveLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.loans.list({ filters: 'active' }),
    queryFn: LoanService.getActive,
  });
}

export function useOverdueLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.loans.list({ filters: 'overdue' }),
    queryFn: LoanService.getOverdue,
  });
}

export function useLoanHistory(limit = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.loans.list({ filters: `history-${limit}` }),
    queryFn: () => LoanService.getHistory(limit),
  });
}