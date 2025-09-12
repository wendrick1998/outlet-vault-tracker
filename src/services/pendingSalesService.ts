import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PendingSale = Database['public']['Tables']['pending_sales']['Row'];
type PendingSaleInsert = Database['public']['Tables']['pending_sales']['Insert'];
type PendingSaleUpdate = Database['public']['Tables']['pending_sales']['Update'];

export interface PendingSaleWithDetails extends PendingSale {
  loans?: any;
}

export class PendingSalesService {
  static async getAll(): Promise<PendingSaleWithDetails[]> {
    const { data, error } = await supabase
      .from('pending_sales')
      .select(`
        *,
        loans(
          id,
          item_id,
          status,
          inventory(imei, brand, model)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getPending(): Promise<PendingSaleWithDetails[]> {
    const { data, error } = await supabase
      .from('pending_sales')
      .select(`
        *,
        loans(
          id,
          item_id,
          status,
          inventory(imei, brand, model)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByUser(userId: string): Promise<PendingSaleWithDetails[]> {
    const { data, error } = await supabase
      .from('pending_sales')
      .select(`
        *,
        loans(
          id,
          item_id,
          status,
          inventory(imei, brand, model)
        )
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async create(pendingSale: PendingSaleInsert): Promise<PendingSale> {
    const { data, error } = await supabase
      .from('pending_sales')
      .insert(pendingSale)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resolve(
    id: string, 
    saleNumber: string, 
    notes?: string
  ): Promise<PendingSale> {
    const { data, error } = await supabase
      .from('pending_sales')
      .update({
        sale_number: saleNumber,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolved_by: (await supabase.auth.getUser()).data.user?.id,
        notes: notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getById(id: string): Promise<PendingSaleWithDetails | null> {
    const { data, error } = await supabase
      .from('pending_sales')
      .select(`
        *,
        loans(
          id,
          item_id,
          status,
          inventory(imei, brand, model)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async getStats() {
    const { data, error } = await supabase
      .from('pending_sales')
      .select('status')
      .eq('status', 'pending');

    if (error) throw error;
    return {
      total_pending: data?.length || 0,
    };
  }
}