import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReasonWorkflowService } from '@/services/reasonWorkflowService';
import { useToast } from '@/hooks/use-toast';
import type { ReasonWorkflowInsert } from '@/types/workflow';
import type { Database } from '@/integrations/supabase/types';

const QUERY_KEYS = {
  workflows: ['reason-workflows'] as const,
  reasonWorkflows: (reasonId: string) => [...QUERY_KEYS.workflows, 'reason', reasonId] as const,
  slaTracking: (loanId: string) => [...QUERY_KEYS.workflows, 'sla', loanId] as const,
  pendingApprovals: () => [...QUERY_KEYS.workflows, 'approvals', 'pending'] as const,
  overdueSLAs: () => [...QUERY_KEYS.workflows, 'sla', 'overdue'] as const,
};

// Hook for managing workflows for a specific reason
export function useReasonWorkflows(reasonId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: workflows = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows(reasonId),
    queryFn: () => ReasonWorkflowService.getWorkflowsForReason(reasonId),
    enabled: !!reasonId,
  });

  const createStepMutation = useMutation({
    mutationFn: ReasonWorkflowService.createWorkflowStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasonWorkflows(reasonId) });
      toast({
        title: 'Passo criado',
        description: 'Passo do workflow foi criado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar passo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ReasonWorkflowInsert> }) =>
      ReasonWorkflowService.updateWorkflowStep(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasonWorkflows(reasonId) });
      toast({
        title: 'Passo atualizado',
        description: 'Passo do workflow foi atualizado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar passo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: ReasonWorkflowService.deleteWorkflowStep,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reasonWorkflows(reasonId) });
      toast({
        title: 'Passo removido',
        description: 'Passo do workflow foi removido com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover passo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    workflows,
    isLoading,
    error,
    createStep: createStepMutation.mutateAsync,
    updateStep: updateStepMutation.mutateAsync,
    deleteStep: deleteStepMutation.mutateAsync,
    isCreating: createStepMutation.isPending,
    isUpdating: updateStepMutation.isPending,
    isDeleting: deleteStepMutation.isPending,
  };
}

// Hook for SLA tracking
export function useSLATracking(loanId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.slaTracking(loanId),
    queryFn: () => ReasonWorkflowService.getSLATracking(loanId),
    enabled: !!loanId,
  });
}

// Hook for pending approvals
export function usePendingApprovals(userId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: approvals = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.pendingApprovals(),
    queryFn: () => ReasonWorkflowService.getPendingApprovals(userId),
  });

  const approveMutation = useMutation({
    mutationFn: ({ approvalId, notes }: { approvalId: string; notes?: string }) =>
      ReasonWorkflowService.approveMovement(approvalId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingApprovals() });
      toast({
        title: 'Movimento aprovado',
        description: 'O movimento foi aprovado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao aprovar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ approvalId, reason }: { approvalId: string; reason: string }) =>
      ReasonWorkflowService.rejectMovement(approvalId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingApprovals() });
      toast({
        title: 'Movimento rejeitado',
        description: 'O movimento foi rejeitado.',
        variant: 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao rejeitar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    approvals,
    isLoading,
    error,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}

// Hook for overdue SLAs
export function useOverdueSLAs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: overdueSLAs = [],
    isLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.overdueSLAs(),
    queryFn: ReasonWorkflowService.getOverdueSLAs,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const checkSLAMutation = useMutation({
    mutationFn: ReasonWorkflowService.checkSLAOverdue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.overdueSLAs() });
    },
  });

  return {
    overdueSLAs,
    isLoading,
    checkSLA: checkSLAMutation.mutateAsync,
    isChecking: checkSLAMutation.isPending,
  };
}

// Hook for workflow execution
export function useWorkflowExecution() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const executeMutation = useMutation({
    mutationFn: ({ loanId, reasonId }: { loanId: string; reasonId: string }) =>
      ReasonWorkflowService.executeWorkflow(loanId, reasonId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingApprovals() });
      toast({
        title: 'Workflow executado',
        description: `${(result as any).steps_executed || 0} passos executados. ${Array.isArray((result as any).approvals_required) ? (result as any).approvals_required.length : 0} aprovações necessárias.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro no workflow',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    execute: executeMutation.mutateAsync,
    isExecuting: executeMutation.isPending,
  };
}

// Utility hooks
export const useWorkflowUtils = () => {
  return {
    stepTypes: ReasonWorkflowService.getStepTypes(),
    workflowRoles: ReasonWorkflowService.getWorkflowRoles(),
  };
};