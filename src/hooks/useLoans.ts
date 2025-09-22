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
    mutationFn: async (loanData: LoanInsert) => {
      console.log("🎯 Criando empréstimo:", loanData);
      
      // Guard: verificar se já existe empréstimo ativo para este item
      const activeLoans = await LoanService.getActive();
      const existingLoan = activeLoans.find(loan => 
        loan.item_id === loanData.item_id && 
        ['active', 'overdue'].includes(loan.status)
      );
      
      if (existingLoan) {
        console.error("❌ Empréstimo duplicado:", existingLoan);
        throw new Error('DUPLICATE_LOAN: Este item já possui empréstimo ativo');
      }
      
      console.log("✅ Nenhum empréstimo ativo, criando novo...");
      const result = await LoanService.create(loanData);
      console.log("✅ Empréstimo criado:", result);
      
      return result;
    },
    onSuccess: (data) => {
      console.log("🎉 Empréstimo criado com sucesso:", data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Empréstimo criado",
        description: "Empréstimo registrado com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("❌ Erro ao criar empréstimo:", error);
      
      let message = 'Erro ao criar empréstimo';
      
      if (error.message?.includes('DUPLICATE_LOAN')) {
        message = 'Este item já possui empréstimo ativo. Finalize o empréstimo anterior primeiro.';
      } else if (error.message?.includes('permission')) {
        message = 'Você não tem permissão para criar empréstimos';
      } else if (error.message?.includes('PIN')) {
        message = 'Erro na validação do PIN';
      } else if (error.message?.includes('stock_status') || error.message?.includes('type') && error.message?.includes('does not exist')) {
        message = 'Erro interno do sistema corrigido. Tente novamente em alguns segundos.';
      }
      
      toast({
        title: "Erro ao criar empréstimo", 
        description: message,
        variant: "destructive",
      });
      
      throw error; // Re-throw para permitir captura pelo componente
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
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => {
      console.log("📦 Devolvendo empréstimo:", { id, notes });
      return LoanService.returnLoan(id, notes);
    },
    onSuccess: (data) => {
      console.log("✅ Empréstimo devolvido:", data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Item devolvido",
        description: "Item devolvido com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Erro ao devolver:", error);
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

  const sellMutation = useMutation({
    mutationFn: ({ id, saleNumber, notes }: { id: string; saleNumber?: string; notes?: string }) => {
      console.log("💰 Registrando venda:", { id, saleNumber, notes });
      return LoanService.sellLoan(id, saleNumber, notes);
    },
    onSuccess: (data) => {
      console.log("✅ Venda registrada:", data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      toast({
        title: "Venda registrada",
        description: "O item foi marcado como vendido definitivamente.",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Erro na venda:", error);
      toast({
        title: "Erro ao registrar venda",
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