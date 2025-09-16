import { useQuery } from '@tanstack/react-query';
import { StatsService, type SystemStats } from '@/services/statsService';

const QUERY_KEYS = {
  all: ['stats'] as const,
  system: () => [...QUERY_KEYS.all, 'system'] as const,
  inventory: () => [...QUERY_KEYS.all, 'inventory'] as const,
  loans: () => [...QUERY_KEYS.all, 'loans'] as const,
  customers: () => [...QUERY_KEYS.all, 'customers'] as const,
  sellers: () => [...QUERY_KEYS.all, 'sellers'] as const,
};

export function useSystemStats() {
  return useQuery({
    queryKey: QUERY_KEYS.system(),
    queryFn: StatsService.getSystemStats,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

export function useInventoryStats() {
  return useQuery({
    queryKey: QUERY_KEYS.inventory(),
    queryFn: StatsService.getInventoryStats,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useLoanStats() {
  return useQuery({
    queryKey: QUERY_KEYS.loans(),
    queryFn: StatsService.getLoanStats,
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: QUERY_KEYS.customers(),
    queryFn: StatsService.getCustomerStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSellerStats() {
  return useQuery({
    queryKey: QUERY_KEYS.sellers(),
    queryFn: StatsService.getSellerStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}