import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { AuditService } from '@/services/auditService';

const AUDIT_QUERY_KEYS = {
  auditLogs: ['audit-logs'] as const,
  auditStats: () => [...AUDIT_QUERY_KEYS.auditLogs, 'stats'] as const,
  auditLogsByTable: (tableName: string, recordId?: string) => 
    [...AUDIT_QUERY_KEYS.auditLogs, 'by-table', tableName, recordId] as const,
};

export function useAuditLogs(
  userId?: string,
  action?: string,
  enabled: boolean = true
) {
  return useInfiniteQuery({
    queryKey: [...AUDIT_QUERY_KEYS.auditLogs, userId, action],
    queryFn: ({ pageParam = 0 }) => 
      AuditService.getAuditLogs(50, (pageParam as number) * 50, userId, action),
    getNextPageParam: (lastPage, allPages) => 
      (lastPage as any[]).length === 50 ? allPages.length : undefined,
    initialPageParam: 0,
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

export function useAuditLogsByTable(
  tableName: string,
  recordId?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: AUDIT_QUERY_KEYS.auditLogsByTable(tableName, recordId),
    queryFn: () => AuditService.getAuditLogsByTable(tableName, recordId),
    enabled: enabled && !!tableName,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useAuditStats(days: number = 30) {
  return useQuery({
    queryKey: [...AUDIT_QUERY_KEYS.auditStats(), days],
    queryFn: () => AuditService.getAuditStats(days),
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}