import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export class CustomerService {
  static async getAll(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getRegistered(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('is_registered', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchByName(name: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async searchByEmail(email: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('email', `%${email}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async searchByPhone(phone: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('phone', `%${phone}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async create(customer: CustomerInsert): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, customer: CustomerUpdate): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async register(id: string): Promise<Customer> {
    return this.update(id, { is_registered: true });
  }

  static async unregister(id: string): Promise<Customer> {
    return this.update(id, { is_registered: false });
  }

  static async clearTestData(): Promise<{
    deleted: number;
    skipped: number;
    errors: string[];
  }> {
    const result = {
      deleted: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // Verificar quais clientes têm empréstimos ativos
      const { data: activeLoans, error: loansError } = await supabase
        .from('loans')
        .select('customer_id')
        .eq('status', 'active');

      if (loansError) {
        result.errors.push(`Erro ao verificar empréstimos: ${loansError.message}`);
        return result;
      }

      const customerIdsWithActiveLoans = new Set(
        activeLoans?.map(loan => loan.customer_id).filter(Boolean) || []
      );

      // Buscar todos os clientes criados antes de hoje (dados de teste)
      const { data: testCustomers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .lt('created_at', new Date().toISOString().split('T')[0] + 'T23:59:59.999Z');

      if (customersError) {
        result.errors.push(`Erro ao buscar clientes: ${customersError.message}`);
        return result;
      }

      if (!testCustomers || testCustomers.length === 0) {
        return result;
      }

      // Separar clientes que podem ser deletados dos que não podem
      const customersToDelete = testCustomers.filter(
        customer => !customerIdsWithActiveLoans.has(customer.id)
      );
      
      result.skipped = testCustomers.length - customersToDelete.length;

      // Deletar clientes que não têm empréstimos ativos
      if (customersToDelete.length > 0) {
        const customerIds = customersToDelete.map(c => c.id);
        
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .in('id', customerIds);

        if (deleteError) {
          result.errors.push(`Erro ao deletar clientes: ${deleteError.message}`);
        } else {
          result.deleted = customersToDelete.length;
        }
      }

      return result;
    } catch (error) {
      result.errors.push(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return result;
    }
  }
}