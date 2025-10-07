import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { InconsistencyService, LoanInventoryInconsistency } from '@/services/inconsistencyService';
import { toast } from '@/hooks/use-toast';

const QUERY_KEYS = {
  inconsistencies: ['loan-inventory-inconsistencies'] as const,
  history: (days: number) => [...QUERY_KEYS.inconsistencies, 'history', days] as const,
};

/**
 * Hook para monitorar inconsistências entre loans e inventory
 * - Polling a cada 30 segundos quando ativo
 * - Notificação toast quando novas inconsistências aparecem
 * - Cache e comparação para detectar mudanças
 */
export function useInconsistencyMonitor(enabled: boolean = true) {
  const previousDataRef = useRef<LoanInventoryInconsistency[]>([]);

  const {
    data: inconsistencies = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: QUERY_KEYS.inconsistencies,
    queryFn: InconsistencyService.getActiveInconsistencies,
    enabled,
    refetchInterval: enabled ? 30000 : false, // Poll a cada 30 segundos quando ativo
    staleTime: 20000, // Considera dados frescos por 20 segundos
  });

  // Detectar novas inconsistências e notificar
  useEffect(() => {
    if (!inconsistencies || inconsistencies.length === 0) {
      previousDataRef.current = [];
      return;
    }

    // Só verifica se já temos dados anteriores
    if (previousDataRef.current.length > 0) {
      const newInconsistencies = InconsistencyService.compareInconsistencies(
        previousDataRef.current,
        inconsistencies
      );

      if (newInconsistencies.length > 0) {
        toast({
          title: '⚠️ Novas Inconsistências Detectadas',
          description: `${newInconsistencies.length} nova(s) inconsistência(s) entre loans e inventory`,
          variant: 'destructive',
        });
      }
    }

    previousDataRef.current = inconsistencies;
  }, [inconsistencies]);

  // Calcular severidade baseado no número de inconsistências
  const severity: 'ok' | 'warning' | 'critical' = 
    inconsistencies.length === 0 ? 'ok' :
    inconsistencies.length <= 2 ? 'warning' :
    'critical';

  return {
    inconsistencies,
    count: inconsistencies.length,
    severity,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook para buscar histórico de inconsistências
 */
export function useInconsistencyHistory(days: number = 7) {
  return useQuery({
    queryKey: QUERY_KEYS.history(days),
    queryFn: () => InconsistencyService.getInconsistencyHistory(days),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
