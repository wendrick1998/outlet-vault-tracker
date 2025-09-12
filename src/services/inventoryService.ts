import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

export class InventoryService {
  static async getAll(includeArchived: boolean = false): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory')
      .select('*');

    if (!includeArchived) {
      query = query.eq('is_archived', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchByCode(code: string, options?: {
    status?: Database['public']['Enums']['inventory_status'] | 'all';
    brand?: string | 'all';
    category?: string | 'all';
    dateFrom?: string;
    dateTo?: string;
    includeArchived?: boolean;
  }): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory')
      .select('*')
      .or(`imei.ilike.%${code}%,suffix.ilike.%${code}%,serial_number.ilike.%${code}%,model.ilike.%${code}%,brand.ilike.%${code}%`);

    if (!options?.includeArchived) {
      query = query.eq('is_archived', false);
    }

    // Apply filters if provided
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status);
    }
    
    if (options?.brand && options.brand !== 'all') {
      query = query.eq('brand', options.brand);
    }
    
    if (options?.dateFrom) {
      query = query.gte('created_at', options.dateFrom);
    }
    
    if (options?.dateTo) {
      query = query.lte('created_at', options.dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Legacy method for backward compatibility
  static async searchByIMEI(imei: string, options?: {
    status?: Database['public']['Enums']['inventory_status'] | 'all';
    brand?: string | 'all';
    category?: string | 'all';
    dateFrom?: string;
    dateTo?: string;
    includeArchived?: boolean;
  }): Promise<InventoryItem[]> {
    return this.searchByCode(imei, options);
  }

  static async getAvailable(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'available')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getLoaned(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('status', 'loaned')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async create(item: InventoryInsert): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, item: InventoryUpdate): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async archive(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update({ is_archived: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async unarchive(id: string): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory')
      .update({ is_archived: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getArchived(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('is_archived', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async updateStatus(id: string, status: Database['public']['Enums']['inventory_status']): Promise<InventoryItem> {
    return this.update(id, { status });
  }

  static async batchUpdateStatus(ids: string[], status: Database['public']['Enums']['inventory_status']): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .update({ status })
      .in('id', ids)
      .select();

    if (error) throw error;
    return data || [];
  }

  static async batchDelete(ids: string[]): Promise<void> {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .in('id', ids);

    if (error) throw error;
  }
}