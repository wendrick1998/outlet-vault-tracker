import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type LoanStatus = 'active' | 'returned' | 'sold' | 'overdue';

interface CorrectLoanParams {
  loanId: string;
  correctStatus: LoanStatus;
  reason: string;
  pin?: string;
}

interface CorrectionResult {
  success: boolean;
  correction_id?: string;
  previous_status?: string;
  new_status?: string;
  is_critical?: boolean;
  item_imei?: string;
  error?: string;
  message?: string;
  blocked?: boolean;
  limit_exceeded?: boolean;
  reset_time?: string;
}

interface CorrectionLimit {
  correction_count: number;
  last_correction_at: string;
  window_start: string;
}

export const useLoanCorrections = () => {
  const queryClient = useQueryClient();

  // Query para buscar limite de correções do usuário
  const { data: correctionLimit } = useQuery({
    queryKey: ['correction-limit'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('correction_limits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CorrectionLimit | null;
    },
    staleTime: 1000 * 60, // 1 minuto
  });

  const correctLoanMutation = useMutation({
    mutationFn: async ({ loanId, correctStatus, reason, pin }: CorrectLoanParams) => {
      const { data, error } = await supabase.rpc('correct_loan_with_audit', {
        p_loan_id: loanId,
        p_new_status: correctStatus,
        p_correction_reason: reason,
        p_pin: pin || null
      });

      if (error) throw error;
      return data as unknown as CorrectionResult;
    },
    onSuccess: (data) => {
      if (data?.success) {
        // Invalidar queries relevantes
        queryClient.invalidateQueries({ queryKey: ['loans'] });
        queryClient.invalidateQueries({ queryKey: ['loan-history'] });
        queryClient.invalidateQueries({ queryKey: ['pending-sales'] });
        queryClient.invalidateQueries({ queryKey: ['correction-limit'] });
        queryClient.invalidateQueries({ queryKey: ['loan-corrections'] });
        
        toast({
          title: data.is_critical ? "⚠️ Correção Crítica Realizada" : "Correção realizada",
          description: `${data.item_imei}: ${data.previous_status} → ${data.new_status}`,
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

  const remainingCorrections = correctionLimit 
    ? Math.max(0, 5 - correctionLimit.correction_count)
    : 5;

  return {
    correctLoan: correctLoanMutation.mutate,
    isCorreting: correctLoanMutation.isPending,
    correctionLimit,
    remainingCorrections,
  };
};