import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { SecureCustomerService } from './secureCustomerService';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

export class CustomerService {
  // Secure methods - use SecureCustomerService for data access with proper security controls
  static async getAll(): Promise<Customer[]> {
    return SecureCustomerService.getAll('general_view');
  }

  static async getRegistered(): Promise<Customer[]> {
    return SecureCustomerService.getRegistered();
  }

  static async getById(id: string): Promise<Customer | null> {
    return SecureCustomerService.getById(id, 'general_view');
  }

  static async searchByName(name: string): Promise<Customer[]> {
    return SecureCustomerService.searchByName(name);
  }

  static async searchByEmail(email: string): Promise<Customer[]> {
    return SecureCustomerService.searchByEmail(email);
  }

  static async searchByPhone(phone: string): Promise<Customer[]> {
    return SecureCustomerService.searchByPhone(phone);
  }

  // Method to get customer data specifically for loan processing
  static async getForLoanProcessing(id: string): Promise<Customer | null> {
    return SecureCustomerService.getForLoan(id);
  }

  // Method to get customer data for administrative purposes (full access, heavily audited)
  static async getForAdministration(id: string): Promise<Customer | null> {
    return SecureCustomerService.getForAdmin(id);
  }

  // Administrative operations - these require admin/manager permissions and are audited
  static async create(customer: CustomerInsert): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    
    // Log customer creation
    await supabase.rpc('log_audit_event', {
      p_action: 'customer_created',
      p_details: {
        customer_id: data.id,
        has_sensitive_data: !!(customer.email || customer.phone || customer.cpf)
      },
      p_table_name: 'customers',
      p_record_id: data.id
    });
    
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
    
    // Log customer update
    await supabase.rpc('log_audit_event', {
      p_action: 'customer_updated',
      p_details: {
        customer_id: id,
        updated_fields: Object.keys(customer),
        has_sensitive_updates: !!(customer.email || customer.phone || customer.cpf || customer.address)
      },
      p_table_name: 'customers',
      p_record_id: id
    });
    
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Log customer deletion
    await supabase.rpc('log_audit_event', {
      p_action: 'customer_deleted',
      p_details: {
        customer_id: id
      },
      p_table_name: 'customers',
      p_record_id: id
    });
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