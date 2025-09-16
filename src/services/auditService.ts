import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

import type { AuditLogEntry } from '@/types/api';

export class AuditService {
  static async logAction(
    action: string,
    details?: Record<string, unknown>,
    tableName?: string,
    recordId?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: action,
        p_details: details ? JSON.stringify(details) : null,
        p_table_name: tableName || null,
        p_record_id: recordId || null
      });
    } catch (error) {
      console.error('Erro ao registrar log de auditoria:', error);
    }
  }

  static async getAuditLogs(
    limit: number = 100,
    offset: number = 0,
    userId?: string,
    action?: string
  ): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (action) {
      query = query.eq('action', action);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getAuditLogsByTable(
    tableName: string,
    recordId?: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    let query = supabase
      .from('audit_logs')
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (recordId) {
      query = query.eq('record_id', recordId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async getAuditStats(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      byAction: {} as Record<string, number>,
      byDay: {} as Record<string, number>
    };

    data?.forEach(log => {
      // Contar por ação
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

      // Contar por dia
      const day = new Date(log.created_at).toLocaleDateString('pt-BR');
      stats.byDay[day] = (stats.byDay[day] || 0) + 1;
    });

    return stats;
  }
}