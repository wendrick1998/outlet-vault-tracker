import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryAuditService } from '@/services/inventoryAuditService';
import { toast } from 'sonner';

const AUDIT_KEYS = {
  all: ['inventory-audits'] as const,
  audit: (id: string) => [...AUDIT_KEYS.all, 'audit', id] as const,
  scans: (auditId: string) => [...AUDIT_KEYS.all, 'scans', auditId] as const,
  missing: (auditId: string) => [...AUDIT_KEYS.all, 'missing', auditId] as const,
  tasks: (auditId: string) => [...AUDIT_KEYS.all, 'tasks', auditId] as const,
  active: () => [...AUDIT_KEYS.all, 'active'] as const,
  report: (auditId: string) => [...AUDIT_KEYS.all, 'report', auditId] as const
};

export function useInventoryAudit(auditId?: string) {
  const queryClient = useQueryClient();

  // Get single audit
  const auditQuery = useQuery({
    queryKey: AUDIT_KEYS.audit(auditId!),
    queryFn: () => InventoryAuditService.getAudit(auditId!),
    enabled: !!auditId,
    refetchInterval: 5000 // Refresh every 5 seconds during active audit
  });

  // Get audit scans
  const scansQuery = useQuery({
    queryKey: AUDIT_KEYS.scans(auditId!),
    queryFn: () => InventoryAuditService.getAuditScans(auditId!),
    enabled: !!auditId,
    refetchInterval: 2000 // More frequent for real-time scanning
  });

  // Get missing items
  const missingQuery = useQuery({
    queryKey: AUDIT_KEYS.missing(auditId!),
    queryFn: () => InventoryAuditService.getAuditMissingItems(auditId!),
    enabled: !!auditId
  });

  // Get tasks
  const tasksQuery = useQuery({
    queryKey: AUDIT_KEYS.tasks(auditId!),
    queryFn: () => InventoryAuditService.getAuditTasks(auditId!),
    enabled: !!auditId
  });

  // Create audit mutation
  const createAuditMutation = useMutation({
    mutationFn: InventoryAuditService.createAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.all });
      toast.success('Conferência iniciada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao iniciar conferência');
    }
  });

  // Update audit mutation
  const updateAuditMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      InventoryAuditService.updateAudit(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.all });
    }
  });

  // Finish audit mutation
  const finishAuditMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      InventoryAuditService.finishAudit(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.all });
      toast.success('Conferência finalizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao finalizar conferência');
    }
  });

  // Add scan mutation
  const addScanMutation = useMutation({
    mutationFn: InventoryAuditService.addScan,
    onSuccess: () => {
      if (auditId) {
        queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.scans(auditId) });
        queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.audit(auditId) });
      }
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: InventoryAuditService.createTask,
    onSuccess: () => {
      if (auditId) {
        queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.tasks(auditId) });
      }
      toast.success('Tarefa criada com sucesso');
    }
  });

  // Resolve task mutation
  const resolveTaskMutation = useMutation({
    mutationFn: ({ taskId, notes }: { taskId: string; notes: string }) =>
      InventoryAuditService.resolveTask(taskId, notes),
    onSuccess: () => {
      if (auditId) {
        queryClient.invalidateQueries({ queryKey: AUDIT_KEYS.tasks(auditId) });
      }
      toast.success('Tarefa resolvida com sucesso');
    }
  });

  return {
    // Queries
    audit: auditQuery.data,
    scans: scansQuery.data || [],
    missing: missingQuery.data || [],
    tasks: tasksQuery.data || [],
    
    // Loading states
    isLoading: auditQuery.isLoading,
    isScansLoading: scansQuery.isLoading,
    
    // Mutations
    createAudit: createAuditMutation.mutate,
    updateAudit: updateAuditMutation.mutate,
    finishAudit: finishAuditMutation.mutate,
    addScan: addScanMutation.mutate,
    createTask: createTaskMutation.mutate,
    resolveTask: resolveTaskMutation.mutate,
    
    // Mutation states
    isCreating: createAuditMutation.isPending,
    isFinishing: finishAuditMutation.isPending,
    isScanning: addScanMutation.isPending
  };
}

export function useActiveAudits() {
  return useQuery({
    queryKey: AUDIT_KEYS.active(),
    queryFn: InventoryAuditService.getActiveAudits,
    refetchInterval: 10000 // Check for active audits every 10 seconds
  });
}

export function useAuditReport(auditId: string) {
  return useQuery({
    queryKey: AUDIT_KEYS.report(auditId),
    queryFn: () => InventoryAuditService.generateReportData(auditId),
    enabled: !!auditId
  });
}