import { supabase } from '@/integrations/supabase/client';

export interface SensitiveDataSession {
  id: string;
  user_id: string;
  customer_id: string;
  access_reason: string;
  approved_fields: string[];
  created_at: string;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
}

export interface SensitiveAccessLog {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
}

export interface AccessMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  totalAccesses: number;
  topAccessedFields: { field: string; count: number }[];
  topUsers: { user_id: string; count: number }[];
}

export class SensitiveDataService {
  /**
   * Solicita acesso temporário a dados sensíveis de um cliente
   */
  static async requestAccess(
    customerId: string,
    fields: string[],
    reason: string
  ): Promise<{ success: boolean; session_id?: string; error?: string }> {
    const { data, error } = await supabase.rpc('request_sensitive_data_access', {
      p_customer_id: customerId,
      p_requested_fields: fields,
      p_business_reason: reason
    });

    if (error) {
      console.error('Erro ao solicitar acesso:', error);
      return { success: false, error: error.message };
    }

    return data as { success: boolean; session_id?: string; error?: string };
  }

  /**
   * Verifica se existe sessão ativa para um cliente específico
   */
  static async getActiveSession(customerId: string): Promise<SensitiveDataSession | null> {
    const { data, error } = await supabase
      .from('sensitive_data_access_sessions')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar sessão ativa:', error);
      return null;
    }

    return data as SensitiveDataSession | null;
  }

  /**
   * Busca todas as sessões de acesso com filtros opcionais
   */
  static async getSessions(filters?: {
    userId?: string;
    customerId?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<SensitiveDataSession[]> {
    let query = supabase
      .from('sensitive_data_access_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar sessões:', error);
      throw error;
    }

    return data as SensitiveDataSession[];
  }

  /**
   * Busca histórico de acessos a dados sensíveis do audit_logs
   */
  static async getAccessHistory(filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<SensitiveAccessLog[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .in('action', [
        'sensitive_customer_data_access',
        'customer_data_accessed',
        'limited_customer_data_access'
      ])
      .order('created_at', { ascending: false })
      .limit(filters?.limit || 100);

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }

    return data as SensitiveAccessLog[];
  }

  /**
   * Limpa sessões expiradas (admin only)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_access_sessions');

    if (error) {
      console.error('Erro ao limpar sessões:', error);
      throw error;
    }

    return (data as any)?.deleted_count || 0;
  }

  /**
   * Calcula métricas de uso de acesso a dados sensíveis
   */
  static async getAccessMetrics(days: number = 30): Promise<AccessMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [sessions, logs] = await Promise.all([
      this.getSessions({ startDate: startDate.toISOString() }),
      this.getAccessHistory({ startDate: startDate.toISOString(), limit: 1000 })
    ]);

    const activeSessions = sessions.filter(
      s => s.is_active && new Date(s.expires_at) > new Date()
    );
    const expiredSessions = sessions.filter(
      s => !s.is_active || new Date(s.expires_at) <= new Date()
    );

    // Campos mais acessados
    const fieldCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.approved_fields.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });

    const topAccessedFields = Object.entries(fieldCounts)
      .map(([field, count]) => ({ field, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Usuários mais ativos
    const userCounts: Record<string, number> = {};
    logs.forEach(log => {
      if (log.user_id) {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([user_id, count]) => ({ user_id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      expiredSessions: expiredSessions.length,
      totalAccesses: logs.length,
      topAccessedFields,
      topUsers
    };
  }

  /**
   * Exporta dados para CSV
   */
  static exportToCSV(sessions: SensitiveDataSession[]): string {
    const headers = [
      'ID',
      'Usuário',
      'Cliente',
      'Motivo',
      'Campos',
      'Criado em',
      'Expira em',
      'Status'
    ];

    const rows = sessions.map(s => [
      s.id,
      s.user_id,
      s.customer_id,
      s.access_reason,
      s.approved_fields.join('; '),
      new Date(s.created_at).toLocaleString('pt-BR'),
      new Date(s.expires_at).toLocaleString('pt-BR'),
      s.is_active && new Date(s.expires_at) > new Date() ? 'Ativa' : 'Expirada'
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csv;
  }
}
