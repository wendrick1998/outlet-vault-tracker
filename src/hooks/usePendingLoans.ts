import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PendingLoansService } from '@/services/pendingLoansService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import type { PendingLoanUpdate } from '@/types/api';

type PendingLoanInsert = Database['public']['Tables']['pending_loans']['Insert'];

// Query keys
export const PENDING_LOANS_KEYS = {
  all: ['pending-loans'] as const,
  lists: () => [...PENDING_LOANS_KEYS.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...PENDING_LOANS_KEYS.lists(), { filters }] as const,
  details: () => [...PENDING_LOANS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PENDING_LOANS_KEYS.details(), id] as const,
  stats: () => [...PENDING_LOANS_KEYS.all, 'stats'] as const,
};

export const usePendingLoans = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all pending loans
  const {
    data: pendingLoans,
    isLoading,
    error,
  } = useQuery({
    queryKey: PENDING_LOANS_KEYS.list({}),
    queryFn: () => PendingLoansService.getAll(),
  });

  // Create pending loan mutation
  const createPendingLoanMutation = useMutation({
    mutationFn: (data: PendingLoanInsert) => PendingLoansService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_LOANS_KEYS.all });
      toast({
        title: "Pendência criada",
        description: "Empréstimo registrado com dados pendentes",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a pendência",
        variant: "destructive"
      });
    },
  });

  // Resolve pending loan mutation
  const resolvePendingLoanMutation = useMutation({
    mutationFn: ({ 
      id, 
      customerData, 
      notes 
    }: PendingLoanUpdate) => PendingLoansService.resolve(id, customerData, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PENDING_LOANS_KEYS.all });
      toast({
        title: "Pendência resolvida",
        description: "Dados do cliente foram atualizados com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível resolver a pendência",
        variant: "destructive"
      });
    },
  });

  return {
    pendingLoans,
    isLoading,
    error,
    createPendingLoan: createPendingLoanMutation.mutate,
    resolvePendingLoan: resolvePendingLoanMutation.mutate,
    isCreating: createPendingLoanMutation.isPending,
    isResolving: resolvePendingLoanMutation.isPending,
  };
};

export const usePendingLoan = (id: string) => {
  const {
    data: pendingLoan,
    isLoading,
    error,
  } = useQuery({
    queryKey: PENDING_LOANS_KEYS.detail(id),
    queryFn: () => PendingLoansService.getById(id),
    enabled: !!id,
  });

  return { pendingLoan, isLoading, error };
};

export const usePendingLoansOnly = () => {
  const {
    data: pendingLoans,
    isLoading,
    error,
  } = useQuery({
    queryKey: PENDING_LOANS_KEYS.list({ status: 'pending' }),
    queryFn: () => PendingLoansService.getPending(),
  });

  return { pendingLoans, isLoading, error };
};

export const usePendingLoansStats = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery({
    queryKey: PENDING_LOANS_KEYS.stats(),
    queryFn: () => PendingLoansService.getStats(),
  });

  return { stats, isLoading, error };
};