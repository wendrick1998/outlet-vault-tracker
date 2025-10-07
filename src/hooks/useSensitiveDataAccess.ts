import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SensitiveDataService } from '@/services/sensitiveDataService';
import { toast } from '@/hooks/use-toast';

const QUERY_KEYS = {
  sessions: ['sensitive-data-sessions'] as const,
  sessionById: (id: string) => [...QUERY_KEYS.sessions, id] as const,
  activeSession: (customerId: string) => [...QUERY_KEYS.sessions, 'active', customerId] as const,
  accessHistory: ['sensitive-access-history'] as const,
  metrics: (days: number) => ['sensitive-access-metrics', days] as const,
};

/**
 * Hook para buscar todas as sessões de acesso a dados sensíveis
 */
export function useSensitiveDataSessions(filters?: {
  userId?: string;
  customerId?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.sessions, filters],
    queryFn: () => SensitiveDataService.getSessions(filters),
    staleTime: 1000 * 30, // 30 segundos
    refetchInterval: 1000 * 60, // Atualizar a cada minuto
  });
}

/**
 * Hook para verificar sessão ativa de um cliente
 */
export function useActiveSession(customerId?: string) {
  return useQuery({
    queryKey: customerId ? QUERY_KEYS.activeSession(customerId) : [],
    queryFn: () => customerId ? SensitiveDataService.getActiveSession(customerId) : null,
    enabled: !!customerId,
    staleTime: 1000 * 20, // 20 segundos
  });
}

/**
 * Hook para buscar histórico de acessos
 */
export function useSensitiveAccessHistory(filters?: {
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...QUERY_KEYS.accessHistory, filters],
    queryFn: () => SensitiveDataService.getAccessHistory(filters),
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para buscar métricas de acesso
 */
export function useSensitiveAccessMetrics(days: number = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.metrics(days),
    queryFn: () => SensitiveDataService.getAccessMetrics(days),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Mutation para solicitar acesso a dados sensíveis
 */
export function useRequestSensitiveAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      customerId,
      fields,
      reason
    }: {
      customerId: string;
      fields: string[];
      reason: string;
    }) => SensitiveDataService.requestAccess(customerId, fields, reason),
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: 'Acesso Autorizado',
          description: 'Sessão de acesso criada com sucesso (15 minutos)',
        });

        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.activeSession(variables.customerId) 
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.accessHistory });
      } else {
        toast({
          title: 'Erro na Autorização',
          description: data.error || 'Não foi possível criar sessão de acesso',
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      console.error('Erro ao solicitar acesso:', error);
      toast({
        title: 'Erro na Solicitação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Mutation para limpar sessões expiradas (admin only)
 */
export function useCleanupExpiredSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: SensitiveDataService.cleanupExpiredSessions,
    onSuccess: (deletedCount) => {
      toast({
        title: 'Limpeza Concluída',
        description: `${deletedCount} sessão(ões) expirada(s) removida(s)`,
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics(30) });
    },
    onError: (error: Error) => {
      console.error('Erro ao limpar sessões:', error);
      toast({
        title: 'Erro na Limpeza',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
