import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PendingLoan = Database['public']['Tables']['pending_loans']['Row'];
type PendingLoanInsert = Database['public']['Tables']['pending_loans']['Insert'];
type PendingLoanUpdate = Database['public']['Tables']['pending_loans']['Update'];

export interface PendingLoanWithDetails extends PendingLoan {
  loan?: Database['public']['Tables']['loans']['Row'] & {
    inventory?: Database['public']['Tables']['inventory']['Row'];
    reason?: Database['public']['Tables']['reasons']['Row'];
    seller?: Database['public']['Tables']['sellers']['Row'];
  };
}

export class PendingLoansService {
  static async getAll(): Promise<PendingLoanWithDetails[]> {
    const { data, error } = await supabase
      .from('pending_loans')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          reason:reasons(*),
          seller:sellers(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPending(): Promise<PendingLoanWithDetails[]> {
    const { data, error } = await supabase
      .from('pending_loans')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          reason:reasons(*),
          seller:sellers(*)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<PendingLoanWithDetails | null> {
    const { data, error } = await supabase
      .from('pending_loans')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          reason:reasons(*),
          seller:sellers(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(pendingLoan: PendingLoanInsert): Promise<PendingLoan> {
    const { data, error } = await supabase
      .from('pending_loans')
      .insert({
        ...pendingLoan,
        created_by: pendingLoan.created_by || supabase.auth.getUser().then(u => u.data.user?.id) as any
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, pendingLoan: PendingLoanUpdate): Promise<PendingLoan> {
    const { data, error } = await supabase
      .from('pending_loans')
      .update(pendingLoan)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolve(
    id: string, 
    customerData: {
      name?: string;
      cpf?: string;
      phone?: string;
      email?: string;
    },
    notes?: string
  ): Promise<PendingLoan> {
    // First update the pending loan
    const updates: PendingLoanUpdate = {
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      notes: notes || null,
    };

    const { data: pendingLoan, error: pendingError } = await supabase
      .from('pending_loans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (pendingError) throw pendingError;

    // If customer data provided, create or update customer
    if (customerData.name || customerData.cpf || customerData.phone) {
      // Try to find existing customer by CPF or phone
      let existingCustomer = null;
      
      if (customerData.cpf) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('cpf', customerData.cpf)
          .maybeSingle();
        existingCustomer = data;
      }

      if (!existingCustomer && customerData.phone) {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', customerData.phone)
          .maybeSingle();
        existingCustomer = data;
      }

      let customerId: string;

      if (existingCustomer) {
        // Update existing customer
        const { data: updatedCustomer, error: customerError } = await supabase
          .from('customers')
          .update({
            ...customerData,
            is_registered: true,
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = updatedCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            ...customerData,
            name: customerData.name || 'Cliente Pendente',
            is_registered: true,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Update the loan with the customer ID
      await supabase
        .from('loans')
        .update({ customer_id: customerId })
        .eq('id', pendingLoan.loan_id);
    }

    return pendingLoan;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pending_loans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async createCustomerContactPendency(
    loanId: string,
    customerId: string,
    missingFields: { cpf?: boolean; phone?: boolean }
  ): Promise<PendingLoan> {
    const pendingData: PendingLoanInsert = {
      loan_id: loanId,
      item_id: '', // Will be populated by trigger or can be fetched from loan
      pending_type: 'incomplete_customer_contact',
      customer_name: null,
      customer_cpf: missingFields.cpf ? null : undefined,
      customer_phone: missingFields.phone ? null : undefined,
      notes: `Dados de contato incompletos: ${Object.keys(missingFields).join(', ')}`,
      created_by: (await supabase.auth.getUser()).data.user?.id as string
    };

    return this.create(pendingData);
  }

  static async createDeviceLeftPendency(
    loanId: string,
    missingFields: { model?: boolean; imei?: boolean; reason?: boolean }
  ): Promise<PendingLoan> {
    const pendingData: PendingLoanInsert = {
      loan_id: loanId,
      item_id: '', // Will be populated by trigger or can be fetched from loan
      pending_type: 'missing_device_left_info',
      notes: `Informações do aparelho deixado incompletas: ${Object.keys(missingFields).join(', ')}`,
      created_by: (await supabase.auth.getUser()).data.user?.id as string
    };

    return this.create(pendingData);
  }

  static async getStats() {
    const { data, error } = await supabase
      .from('pending_loans')
      .select('status, created_at')
      .eq('status', 'pending');

    if (error) throw error;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      total: data.length,
      critical: data.filter(item => new Date(item.created_at) < oneDayAgo).length,
      urgent: data.filter(item => 
        new Date(item.created_at) < oneHourAgo && 
        new Date(item.created_at) >= oneDayAgo
      ).length,
    };
  }
}