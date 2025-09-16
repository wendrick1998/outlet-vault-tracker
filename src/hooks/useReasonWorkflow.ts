import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReasonWorkflowService } from '@/services/reasonWorkflowService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { ReasonWorkflowInsert } from '@/types/workflow';
import type { Database } from '@/integrations/supabase/types';

// Hook for managing workflows for a specific reason
export function useReasonWorkflows(reasonId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: workflows = [],
    isLoading
  } = useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.list({ reasonId }),
    queryFn: () => ReasonWorkflowService.getByReasonId(reasonId),
    enabled: !!reasonId,
  });

  const createWorkflow = useMutation({
    mutationFn: (workflow: ReasonWorkflowInsert) =>
      ReasonWorkflowService.create(workflow),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reasonWorkflows.list({ reasonId }) 
      });
      toast({
        title: "Workflow criado",
        description: "O workflow foi criado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating workflow:', error);
      toast({
        title: "Erro ao criar workflow",
        description: "Não foi possível criar o workflow.",
        variant: "destructive",
      });
    },
  });

  const completeStep = useMutation({
    mutationFn: ({ workflowId, stepId, notes }: { 
      workflowId: string; 
      stepId: string; 
      notes?: string 
    }) =>
      ReasonWorkflowService.completeStep(workflowId, stepId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reasonWorkflows.list({ reasonId }) 
      });
      toast({
        title: "Etapa concluída",
        description: "A etapa do workflow foi marcada como concluída.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error completing step:', error);
      toast({
        title: "Erro ao concluir etapa",
        description: "Não foi possível concluir a etapa.",
        variant: "destructive",
      });
    },
  });

  return {
    workflows,
    isLoading,
    createWorkflow: createWorkflow.mutate,
    completeStep: completeStep.mutate,
    isCreating: createWorkflow.isPending,
    isCompleting: completeStep.isPending,
  };
}

// Hook for SLA tracking for loans
export function useSLATracking(loanId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.list({ slaTracking: loanId }),
    queryFn: () => ReasonWorkflowService.getSLATracking(loanId),
    enabled: !!loanId,
    staleTime: 1000 * 60, // 1 minute
  });
}

// Hook for getting pending approvals
export function usePendingApprovals() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: pendingApprovals = [],
    isLoading
  } = useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.list({ pending: true }),
    queryFn: ReasonWorkflowService.getPendingApprovals,
    staleTime: 1000 * 30, // 30 seconds - more frequent for approvals
  });

  const approveWorkflow = useMutation({
    mutationFn: ({ workflowId, notes }: { workflowId: string; notes?: string }) =>
      ReasonWorkflowService.approve(workflowId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reasonWorkflows.list({ pending: true }) 
      });
      toast({
        title: "Workflow aprovado",
        description: "O workflow foi aprovado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error approving workflow:', error);
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o workflow.",
        variant: "destructive",
      });
    },
  });

  const rejectWorkflow = useMutation({
    mutationFn: ({ workflowId, reason }: { workflowId: string; reason: string }) =>
      ReasonWorkflowService.reject(workflowId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reasonWorkflows.list({ pending: true }) 
      });
      toast({
        title: "Workflow rejeitado",
        description: "O workflow foi rejeitado.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error rejecting workflow:', error);
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar o workflow.",
        variant: "destructive",
      });
    },
  });

  return {
    pendingApprovals,
    isLoading,
    approveWorkflow: approveWorkflow.mutate,
    rejectWorkflow: rejectWorkflow.mutate,
    isApproving: approveWorkflow.isPending,
    isRejecting: rejectWorkflow.isPending,
  };
}

// Hook for getting overdue SLAs
export function useOverdueSLAs() {
  return useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.list({ overdue: true }),
    queryFn: ReasonWorkflowService.getOverdueSLAs,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for workflow analytics
export function useWorkflowAnalytics(startDate?: Date, endDate?: Date) {
  return useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.stats(),
    queryFn: () => ReasonWorkflowService.getAnalytics(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook for workflow performance metrics
export function useWorkflowPerformance() {
  return useQuery({
    queryKey: QUERY_KEYS.reasonWorkflows.list({ performance: true }),
    queryFn: ReasonWorkflowService.getPerformanceMetrics,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}