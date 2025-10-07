import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook para sincronização em tempo real de conferências de inventário
 * Usa Supabase Realtime para invalidar queries quando novos scans são adicionados
 */
export function useRealtimeAudit(auditId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!auditId) return;

    console.log('[Realtime] Subscribing to audit scans:', auditId);

    // Subscribe to new scans
    const channel = supabase
      .channel(`audit-scans-${auditId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inventory_audit_scans',
          filter: `audit_id=eq.${auditId}`
        },
        (payload) => {
          console.log('[Realtime] New scan detected:', payload);
          
          // Invalidate queries to refetch fresh data
          queryClient.invalidateQueries({ 
            queryKey: ['inventory-audits', 'scans', auditId] 
          });
          queryClient.invalidateQueries({ 
            queryKey: ['inventory-audits', 'audit', auditId] 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'inventory_audits',
          filter: `id=eq.${auditId}`
        },
        (payload) => {
          console.log('[Realtime] Audit updated:', payload);
          
          queryClient.invalidateQueries({ 
            queryKey: ['inventory-audits', 'audit', auditId] 
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
      });

    return () => {
      console.log('[Realtime] Unsubscribing from audit scans:', auditId);
      supabase.removeChannel(channel);
    };
  }, [auditId, queryClient]);
}
