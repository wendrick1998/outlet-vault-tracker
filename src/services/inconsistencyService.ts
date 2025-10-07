import { supabase } from '@/integrations/supabase/client';

export interface LoanInventoryInconsistency {
  loan_id: string;
  loan_status: string;
  inventory_id: string;
  inventory_status: string;
  loan_updated: string;
  inventory_updated: string;
  imei: string;
  issue_description: string;
}

export interface InconsistencyHistory {
  date: string;
  count: number;
}

export class InconsistencyService {
  /**
   * Busca inconsistências ativas da view loan_inventory_inconsistencies
   */
  static async getActiveInconsistencies(): Promise<LoanInventoryInconsistency[]> {
    const { data, error } = await supabase
      .from('loan_inventory_inconsistencies')
      .select('*')
      .order('loan_updated', { ascending: false });

    if (error) {
      console.error('Erro ao buscar inconsistências:', error);
      throw error;
    }

    return data as LoanInventoryInconsistency[];
  }

  /**
   * Busca histórico de inconsistências nos últimos dias
   */
  static async getInconsistencyHistory(days: number = 7): Promise<InconsistencyHistory[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('created_at')
      .eq('action', 'loan_inventory_sync')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }

    // Agrupar por data
    const grouped = (data || []).reduce((acc, log) => {
      const date = new Date(log.created_at).toLocaleDateString('pt-BR');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count
    }));
  }

  /**
   * Tenta corrigir inconsistência específica (admin only)
   */
  static async forceCorrection(loanId: string, newStatus: 'active' | 'returned' | 'sold'): Promise<void> {
    // Chama a função RPC correct_loan_with_audit que já existe
    const { error } = await supabase.rpc('correct_loan_with_audit', {
      p_loan_id: loanId,
      p_new_status: newStatus,
      p_correction_reason: 'Correção automática via dashboard de inconsistências',
      p_pin: null // Admin não precisa de PIN
    });

    if (error) {
      console.error('Erro ao forçar correção:', error);
      throw error;
    }
  }

  /**
   * Verifica se há novas inconsistências comparando com snapshot anterior
   */
  static compareInconsistencies(
    previous: LoanInventoryInconsistency[],
    current: LoanInventoryInconsistency[]
  ): LoanInventoryInconsistency[] {
    const previousIds = new Set(previous.map(i => i.loan_id));
    return current.filter(i => !previousIds.has(i.loan_id));
  }
}
