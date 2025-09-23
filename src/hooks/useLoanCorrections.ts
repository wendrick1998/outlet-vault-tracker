import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type LoanStatus = 'active' | 'returned' | 'sold' | 'overdue';

interface CorrectLoanParams {
  loanId: string;
  correctStatus: LoanStatus;
  reason: string;
}

interface CorrectionResult {
  success: boolean;
  item_imei?: string;
  error?: string;
  message?: string;
}

export const useLoanCorrections = () => {
  const queryClient = useQueryClient();

  const correctLoanMutation = useMutation({
    mutationFn: async ({ loanId, correctStatus, reason }: CorrectLoanParams) => {
      const { data, error } = await supabase.rpc('correct_loan_simple', {
        p_loan_id: loanId,
        p_correct_status: correctStatus,
        p_correction_reason: reason
      });

      if (error) throw error;
      return data as unknown as CorrectionResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        queryClient.invalidateQueries({ queryKey: ['loans'] });
        queryClient.invalidateQueries({ queryKey: ['loan-history'] });
        queryClient.invalidateQueries({ queryKey: ['pending-sales'] });
        
        toast({
          title: "Correção realizada",
          description: `Empréstimo corrigido com sucesso para ${data.item_imei}`,
        });
      } else {
        throw new Error(data?.error || 'Erro desconhecido na correção');
      }
    },
    onError: (error) => {
      toast({
        title: "Erro na correção",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    correctLoan: correctLoanMutation.mutate,
    isCorreting: correctLoanMutation.isPending,
  };
};