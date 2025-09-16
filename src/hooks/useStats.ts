import { useQuery } from '@tanstack/react-query';
import { StatsService, type SystemStats } from '@/services/statsService';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useSystemStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats.list({ type: 'system' }),
    queryFn: StatsService.getSystemStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats.list({ type: 'inventory' }),
    queryFn: StatsService.getInventoryStats,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useLoanStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats.list({ type: 'loans' }),
    queryFn: StatsService.getLoanStats,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats.list({ type: 'customers' }),
    queryFn: StatsService.getCustomerStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSellerStats() {
  return useQuery({
    queryKey: QUERY_KEYS.stats.list({ type: 'sellers' }),
    queryFn: StatsService.getSellerStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}