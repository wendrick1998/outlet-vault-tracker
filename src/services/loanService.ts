import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Loan = Database['public']['Tables']['loans']['Row'];
type LoanInsert = Database['public']['Tables']['loans']['Insert'];
type LoanUpdate = Database['public']['Tables']['loans']['Update'];

export interface LoanWithDetails extends Loan {
  inventory?: Database['public']['Tables']['inventory']['Row'];
  customer?: Database['public']['Tables']['customers']['Row'];
  seller?: Database['public']['Tables']['sellers']['Row'];
  reason?: Database['public']['Tables']['reasons']['Row'];
}

export class LoanService {
  static async getAll(): Promise<LoanWithDetails[]> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        inventory(*),
        customer:customers(*),
        seller:sellers(*),
        reason:reasons(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getActive(): Promise<LoanWithDetails[]> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        inventory(*),
        customer:customers(*),
        seller:sellers(*),
        reason:reasons(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getOverdue(): Promise<LoanWithDetails[]> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        inventory(*),
        customer:customers(*),
        seller:sellers(*),
        reason:reasons(*)
      `)
      .eq('status', 'active')
      .lt('due_at', new Date().toISOString())
      .order('due_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<LoanWithDetails | null> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        inventory(*),
        customer:customers(*),
        seller:sellers(*),
        reason:reasons(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(loan: LoanInsert): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .insert(loan)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, loan: LoanUpdate): Promise<Loan> {
    const { data, error } = await supabase
      .from('loans')
      .update(loan)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async returnLoan(id: string, notes?: string): Promise<Loan> {
    const updates: LoanUpdate = {
      status: 'returned',
      returned_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    return this.update(id, updates);
  }

  static async extendLoan(id: string, newDueDate: Date, notes?: string): Promise<Loan> {
    const updates: LoanUpdate = {
      due_at: newDueDate.toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    return this.update(id, updates);
  }

  static async sellLoan(id: string, saleNumber?: string, notes?: string): Promise<Loan> {
    // Validate loan exists and is active
    const loan = await this.getById(id);
    if (!loan) {
      throw new Error('Empréstimo não encontrado');
    }
    if (loan.status !== 'active') {
      throw new Error('Apenas empréstimos ativos podem ser vendidos');
    }

    const updates: LoanUpdate = {
      status: 'sold',
      returned_at: new Date().toISOString(),
    };

    if (notes) {
      updates.notes = notes;
    }

    // Add sale number to notes if provided
    if (saleNumber) {
      updates.notes = updates.notes 
        ? `${updates.notes} - Número da venda: ${saleNumber}`
        : `Número da venda: ${saleNumber}`;
    }

    // The trigger will automatically update inventory status to 'sold'
    return this.update(id, updates);
  }

  static async getHistory(limit = 50): Promise<LoanWithDetails[]> {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        inventory(*),
        customer:customers(*),
        seller:sellers(*),
        reason:reasons(*)
      `)
      .in('status', ['returned', 'sold'])
      .order('returned_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async correctTransaction(loanId: string, correctStatus: 'active' | 'returned' | 'sold' | 'overdue', reason: string) {
    const { data, error } = await supabase.rpc('correct_loan_simple', {
      p_loan_id: loanId,
      p_correct_status: correctStatus,
      p_correction_reason: reason
    });

    if (error) throw error;
    return data;
  }
}