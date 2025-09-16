import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

// Helper function to convert JSONB data to Customer type
function jsonbToCustomer(item: any): Customer {
  return {
    id: item.id,
    name: item.name,
    email: item.email || null,
    phone: item.phone || null,
    cpf: item.cpf || null,
    address: item.address || null,
    notes: item.notes || null,
    is_registered: item.is_registered || false,
    loan_limit: item.loan_limit || 3,
    created_at: item.created_at,
    updated_at: item.updated_at,
    pending_data: item.pending_data || null
  };
}

/**
 * Secure Customer Service with purpose-based access control and comprehensive audit logging
 * Replaces direct database access with secure, role-based functions
 */
export class SecureCustomerService {
  /**
   * Get all customers with purpose-based security
   * - Regular users: limited data (name, registration status)
   * - Admins/Managers: full data with audit logging
   */
  static async getAll(purpose: 'general_view' | 'administrative' = 'general_view'): Promise<Customer[]> {
    const { data, error } = await supabase.rpc('get_customers_secure', {
      access_purpose: purpose
    });

    if (error) throw error;
    
    return (data || []).map(jsonbToCustomer);
  }

  /**
   * Get registered customers with secure access
   */
  static async getRegistered(): Promise<Customer[]> {
    const { data, error } = await supabase.rpc('get_registered_customers_secure');

    if (error) throw error;
    
    return (data || []).map(jsonbToCustomer);
  }

  /**
   * Get single customer by ID with purpose-based access control
   * - general_view: Basic info for regular operations
   * - loan_processing: Contact info for loan operations (logged)
   * - administrative: Full access for admin tasks (heavily logged)
   */
  static async getById(
    id: string, 
    purpose: 'general_view' | 'loan_processing' | 'administrative' = 'general_view'
  ): Promise<Customer | null> {
    const { data, error } = await supabase.rpc('get_customer_secure', {
      customer_id: id,
      access_purpose: purpose
    });

    if (error) throw error;
    if (!data) return null;
    
    return jsonbToCustomer(data);
  }

  /**
   * Secure search by name - only returns accessible data based on user role
   */
  static async searchByName(name: string): Promise<Customer[]> {
    const { data, error } = await supabase.rpc('search_customers_secure', {
      search_term: name,
      search_type: 'name'
    });

    if (error) throw error;
    
    return (data || []).map(jsonbToCustomer);
  }

  /**
   * Secure search by email - restricted to admin/manager roles
   */
  static async searchByEmail(email: string): Promise<Customer[]> {
    const { data, error } = await supabase.rpc('search_customers_secure', {
      search_term: email,
      search_type: 'email'
    });

    if (error) throw error;
    
    return (data || []).map(jsonbToCustomer);
  }

  /**
   * Secure search by phone - restricted to admin/manager roles
   */
  static async searchByPhone(phone: string): Promise<Customer[]> {
    const { data, error } = await supabase.rpc('search_customers_secure', {
      search_term: phone,
      search_type: 'phone'
    });

    if (error) throw error;
    
    return (data || []).map(jsonbToCustomer);
  }

  /**
   * Get customer specifically for loan processing
   * Provides necessary contact info with audit logging
   */
  static async getForLoan(id: string): Promise<Customer | null> {
    return this.getById(id, 'loan_processing');
  }

  /**
   * Get customer for administrative purposes
   * Full access with comprehensive audit logging
   */
  static async getForAdmin(id: string): Promise<Customer | null> {
    return this.getById(id, 'administrative');
  }
}