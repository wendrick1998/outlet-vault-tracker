import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type Customer = Database['public']['Tables']['customers']['Row'];
type CustomerInsert = Database['public']['Tables']['customers']['Insert'];
type CustomerUpdate = Database['public']['Tables']['customers']['Update'];

// Secure customer type with masked sensitive data
export type SecureCustomer = Omit<Customer, 'email' | 'phone' | 'cpf' | 'address'> & {
  email?: string | null;
  phone?: string | null; 
  cpf?: string | null;
  address?: string | null;
};

export class CustomerService {
  // Get current user role for data masking
  private static async getCurrentUserRole(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      return profile?.role || null;
    } catch (error) {
      logger.error('Failed to get user role:', error);
      return null;
    }
  }

  // Mask sensitive customer data based on user role
  private static maskCustomerData(customer: Customer, userRole: string | null): SecureCustomer {
    // Admins and managers get full access
    if (userRole === 'admin' || userRole === 'manager') {
      return customer;
    }

    // Regular users get limited access - only name and registration status
    return {
      ...customer,
      email: null,
      phone: null,
      cpf: null,
      address: null,
      notes: null, // Also mask notes for regular users
    };
  }

  // Log sensitive data access for audit trail
  private static async logDataAccess(operation: string, customerId?: string, sensitiveFields?: string[]) {
    try {
      await supabase.rpc('log_audit_event', {
        p_action: 'customer_data_access',
        p_details: {
          operation,
          customer_id: customerId,
          sensitive_fields: sensitiveFields,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to log data access:', error);
    }
  }

  static async getAll(): Promise<SecureCustomer[]> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Log the data access
      await this.logDataAccess('getAll', undefined, userRole === 'admin' || userRole === 'manager' ? ['email', 'phone', 'cpf', 'address'] : ['name']);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      
      // Apply data masking based on user role
      return (data || []).map(customer => this.maskCustomerData(customer, userRole));
    } catch (error) {
      logger.error('Error in getAll customers:', error);
      throw error;
    }
  }

  static async getRegistered(): Promise<SecureCustomer[]> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      await this.logDataAccess('getRegistered', undefined, userRole === 'admin' || userRole === 'manager' ? ['email', 'phone', 'cpf', 'address'] : ['name']);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('is_registered', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(customer => this.maskCustomerData(customer, userRole));
    } catch (error) {
      logger.error('Error in getRegistered customers:', error);
      throw error;
    }
  }

  static async getById(id: string): Promise<SecureCustomer | null> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Use secure database function if available, fallback to direct query with masking
      if (userRole === 'admin' || userRole === 'manager') {
        await this.logDataAccess('getById', id, ['email', 'phone', 'cpf', 'address']);
      } else {
        await this.logDataAccess('getById', id, ['name']);
      }

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? this.maskCustomerData(data, userRole) : null;
    } catch (error) {
      logger.error('Error in getById customer:', error);
      throw error;
    }
  }

  // Enhanced search with role-based restrictions
  static async searchByName(name: string): Promise<SecureCustomer[]> {
    try {
      const userRole = await this.getCurrentUserRole();
      await this.logDataAccess('searchByName', undefined, ['name']);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('name', `%${name}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(customer => this.maskCustomerData(customer, userRole));
    } catch (error) {
      logger.error('Error in searchByName:', error);
      throw error;
    }
  }

  // Restrict sensitive searches to admin/manager only
  static async searchByEmail(email: string): Promise<SecureCustomer[]> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Only allow admin/manager to search by email
      if (userRole !== 'admin' && userRole !== 'manager') {
        logger.warn('Unauthorized email search attempt');
        throw new Error('Acesso negado: apenas administradores podem buscar por email');
      }

      await this.logDataAccess('searchByEmail', undefined, ['email']);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', `%${email}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(customer => this.maskCustomerData(customer, userRole));
    } catch (error) {
      logger.error('Error in searchByEmail:', error);
      throw error;
    }
  }

  static async searchByPhone(phone: string): Promise<SecureCustomer[]> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Only allow admin/manager to search by phone
      if (userRole !== 'admin' && userRole !== 'manager') {
        logger.warn('Unauthorized phone search attempt');
        throw new Error('Acesso negado: apenas administradores podem buscar por telefone');
      }

      await this.logDataAccess('searchByPhone', undefined, ['phone']);

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('phone', `%${phone}%`)
        .order('name', { ascending: true });

      if (error) throw error;
      return (data || []).map(customer => this.maskCustomerData(customer, userRole));
    } catch (error) {
      logger.error('Error in searchByPhone:', error);
      throw error;
    }
  }

  static async create(customer: CustomerInsert): Promise<SecureCustomer> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Only admin/manager can create customers with full data
      if (userRole !== 'admin' && userRole !== 'manager') {
        throw new Error('Acesso negado: apenas administradores podem criar clientes');
      }

      await this.logDataAccess('create', undefined, ['all_fields']);

      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return this.maskCustomerData(data, userRole);
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw error;
    }
  }

  static async update(id: string, customer: CustomerUpdate): Promise<SecureCustomer> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Only admin/manager can update customers
      if (userRole !== 'admin' && userRole !== 'manager') {
        throw new Error('Acesso negado: apenas administradores podem atualizar clientes');
      }

      await this.logDataAccess('update', id, Object.keys(customer));

      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.maskCustomerData(data, userRole);
    } catch (error) {
      logger.error('Error updating customer:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const userRole = await this.getCurrentUserRole();
      
      // Only admin can delete customers
      if (userRole !== 'admin') {
        throw new Error('Acesso negado: apenas administradores podem deletar clientes');
      }

      await this.logDataAccess('delete', id, ['all_fields']);

      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting customer:', error);
      throw error;
    }
  }

  static async register(id: string): Promise<SecureCustomer> {
    return this.update(id, { is_registered: true });
  }

  static async unregister(id: string): Promise<SecureCustomer> {
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