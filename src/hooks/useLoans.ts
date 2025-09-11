import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoanService, type LoanWithDetails } from '@/services/loanService';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type LoanInsert = Database['public']['Tables']['loans']['Insert'];
type LoanUpdate = Database['public']['Tables']['loans']['Update'];

const QUERY_KEYS = {
  all: ['loans'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
};

export function useLoans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: loans = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.lists(),
    queryFn: LoanService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: LoanService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Empréstimo criado",
        description: "Empréstimo registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar empréstimo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoanUpdate }) =>
      LoanService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Empréstimo atualizado",
        description: "Informações do empréstimo atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar empréstimo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      LoanService.returnLoan(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Item devolvido",
        description: "Item devolvido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao devolver item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const extendMutation = useMutation({
    mutationFn: ({ id, newDueDate, notes }: { id: string; newDueDate: Date; notes?: string }) =>
      LoanService.extendLoan(id, newDueDate, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Empréstimo estendido",
        description: "Prazo do empréstimo estendido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao estender empréstimo",
        description: error.message,
        variant: "destructive",
      });
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

    // Status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isReturning: returnMutation.isPending,
    isExtending: extendMutation.isPending,
  };
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => LoanService.getById(id),
    enabled: !!id,
  });
}

export function useActiveLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.list('active'),
    queryFn: LoanService.getActive,
  });
}

export function useOverdueLoans() {
  return useQuery({
    queryKey: QUERY_KEYS.list('overdue'),
    queryFn: LoanService.getOverdue,
  });
}

export function useLoanHistory(limit = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.list(`history-${limit}`),
    queryFn: () => LoanService.getHistory(limit),
  });
}