import { supabase } from '@/integrations/supabase/client';

export interface SystemStats {
  inventory: {
    total: number;
    available: number;
    loaned: number;
    utilizationRate: number;
  };
  loans: {
    active: number;
    overdue: number;
    overdueRate: number;
    avgDurationDays: number;
  };
  customers: {
    total: number;
    registered: number;
    registrationRate: number;
  };
  sellers: {
    total: number;
    active: number;
  };
}

export class StatsService {
  static async getSystemStats(): Promise<SystemStats> {
    const { data, error } = await supabase.rpc('get_system_stats');

    if (error) throw error;
    if (!data) throw new Error('No data returned from get_system_stats');
    
    // Transform flat RPC response to expected nested structure
    const flatData = data as any;
    
    return {
      inventory: {
        total: flatData.total_items || 0,
        available: 0, // Not provided by RPC, would need separate query
        loaned: flatData.active_loans || 0,
        utilizationRate: 0,
      },
      loans: {
        active: flatData.active_loans || 0,
        overdue: 0, // Not provided by RPC, would need separate query
        overdueRate: 0,
        avgDurationDays: 0,
      },
      customers: {
        total: flatData.total_customers || 0,
        registered: 0,
        registrationRate: 0,
      },
      sellers: {
        total: flatData.total_sellers || 0,
        active: 0,
      },
    };
  }

  static async getInventoryStats() {
    const { data, error } = await supabase
      .from('inventory')
      .select('status')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const available = data?.filter(item => item.status === 'available').length || 0;
    const loaned = data?.filter(item => item.status === 'loaned').length || 0;
    const utilizationRate = total > 0 ? Math.round((loaned / total) * 100 * 10) / 10 : 0;

    return {
      total,
      available,
      loaned,
      utilizationRate
    };
  }

  static async getLoanStats() {
    const { data, error } = await supabase
      .from('loans')
      .select('status, due_at, issued_at, returned_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const active = data?.filter(loan => loan.status === 'active').length || 0;
    const overdue = data?.filter(loan => 
      loan.status === 'active' && 
      loan.due_at && 
      new Date(loan.due_at) < new Date()
    ).length || 0;
    const overdueRate = active > 0 ? Math.round((overdue / active) * 100 * 10) / 10 : 0;

    // Calculate average duration
    const completedLoans = data?.filter(loan => loan.returned_at) || [];
    let avgDurationDays = 0;
    
    if (completedLoans.length > 0) {
      const totalDays = completedLoans.reduce((sum, loan) => {
        const issued = new Date(loan.issued_at);
        const returned = new Date(loan.returned_at!);
        const durationMs = returned.getTime() - issued.getTime();
        return sum + (durationMs / (1000 * 60 * 60 * 24));
      }, 0);
      avgDurationDays = Math.round(totalDays / completedLoans.length);
    }

    return {
      active,
      overdue,
      overdueRate,
      avgDurationDays
    };
  }

  static async getCustomerStats() {
    const { data, error } = await supabase
      .from('customers')
      .select('is_registered');

    if (error) throw error;

    const total = data?.length || 0;
    const registered = data?.filter(customer => customer.is_registered).length || 0;
    const registrationRate = total > 0 ? Math.round((registered / total) * 100 * 10) / 10 : 0;

    return {
      total,
      registered,
      registrationRate
    };
  }

  static async getSellerStats() {
    const { data, error } = await supabase
      .from('sellers')
      .select('is_active');

    if (error) throw error;

    const total = data?.length || 0;
    const active = data?.filter(seller => seller.is_active).length || 0;

    return {
      total,
      active
    };
  }
}