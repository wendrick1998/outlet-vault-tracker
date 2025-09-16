import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'];
type StockItemInsert = Database['public']['Tables']['stock_items']['Insert'];
type StockItemUpdate = Database['public']['Tables']['stock_items']['Update'];
type StockMovement = Database['public']['Tables']['stock_movements']['Row'];
type StockConference = Database['public']['Tables']['stock_conferences']['Row'];

export class StockService {
  static async getAll(options?: {
    status?: string;
    location?: string;
    includeArchived?: boolean;
  }): Promise<StockItem[]> {
    let query = supabase
      .from('stock_items')
      .select(`
        *,
        stock_item_labels (
          id,
          label:labels (
            id,
            name,
            color
          )
        ),
        inventory:inventory_id (
          id,
          status,
          brand,
          model,
          color,
          storage,
          condition,
          battery_pct,
          notes,
          is_archived,
          created_at,
          updated_at
        )
      `);

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status as Database['public']['Enums']['stock_status']);
    }

    if (options?.location && options.location !== 'all') {
      query = query.eq('location', options.location as Database['public']['Enums']['stock_location']);
    }

    // Se não incluir arquivados, filtrar pelo inventory também
    if (!options?.includeArchived) {
      query = query.eq('inventory.is_archived', false);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<StockItem | null> {
    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        *,
        stock_item_labels (
          id,
          label:labels (
            id,
            name,
            color
          )
        ),
        stock_movements (
          id,
          movement_type,
          from_status,
          to_status,
          from_location,
          to_location,
          reason,
          performed_at,
          performed_by
        ),
        inventory:inventory_id (
          id,
          status,
          brand,
          model,
          color,
          storage,
          condition,
          battery_pct,
          notes,
          is_archived,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchByIMEI(imei: string, options?: {
    status?: string;
    location?: string;
  }): Promise<StockItem[]> {
    let query = supabase
      .from('stock_items')
      .select(`
        *,
        stock_item_labels (
          id,
          label:labels (
            id,
            name,
            color
          )
        )
      `)
      .or(`imei.ilike.%${imei}%,model.ilike.%${imei}%,brand.ilike.%${imei}%,serial_number.ilike.%${imei}%`);

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status as Database['public']['Enums']['stock_status']);
    }

    if (options?.location && options.location !== 'all') {
      query = query.eq('location', options.location as Database['public']['Enums']['stock_location']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async create(item: StockItemInsert): Promise<StockItem> {
    const { data, error } = await supabase
      .from('stock_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, item: StockItemUpdate): Promise<StockItem> {
    const { data, error } = await supabase
      .from('stock_items')
      .update(item)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async updateStatus(id: string, status: Database['public']['Enums']['stock_status']): Promise<StockItem> {
    return this.update(id, { status });
  }

  static async updateLocation(id: string, location: Database['public']['Enums']['stock_location']): Promise<StockItem> {
    return this.update(id, { location });
  }

  static async incrementViewCount(id: string): Promise<void> {
    // Manual increment since RPC function doesn't exist yet
    const { data: current } = await supabase
      .from('stock_items')
      .select('view_count')
      .eq('id', id)
      .single();

    if (current) {
      await supabase
        .from('stock_items')
        .update({ 
          view_count: (current.view_count || 0) + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('id', id);
    }
  }

  // Labels management
  static async addLabel(stockItemId: string, labelId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_item_labels')
      .insert({
        stock_item_id: stockItemId,
        label_id: labelId
      });

    if (error) throw error;
  }

  static async removeLabel(stockItemId: string, labelId: string): Promise<void> {
    const { error } = await supabase
      .from('stock_item_labels')
      .delete()
      .eq('stock_item_id', stockItemId)
      .eq('label_id', labelId);

    if (error) throw error;
  }

  static async getByStatus(status: Database['public']['Enums']['stock_status']): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByLocation(location: Database['public']['Enums']['stock_location']): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('location', location)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getFeatured(): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'disponivel')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Movement tracking
  static async getMovements(stockItemId: string): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('stock_item_id', stockItemId)
      .order('performed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Stock statistics
  static async getStats(): Promise<{
    total: number;
    available: number;
    reserved: number;
    sold: number;
    vitrine: number;
    estoque: number;
    demonstration: number;
    synced_with_inventory: number;
  }> {
    const { data, error } = await supabase
      .from('stock_items')
      .select(`
        status, 
        location,
        inventory_id,
        stock_item_labels (
          label:labels (
            name
          )
        )
      `);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      available: 0,
      reserved: 0,
      sold: 0,
      vitrine: 0,
      estoque: 0,
      demonstration: 0,
      synced_with_inventory: 0
    };

    data?.forEach(item => {
      // Count by status
      if (item.status === 'disponivel') stats.available++;
      if (item.status === 'reservado') stats.reserved++;
      if (item.status === 'vendido') stats.sold++;

      // Count by location
      if (item.location === 'vitrine') stats.vitrine++;
      if (item.location === 'estoque') stats.estoque++;

      // Count demonstration items
      const hasDemo = item.stock_item_labels?.some(
        (sil: any) => sil.label?.name === 'Demonstração'
      );
      if (hasDemo) stats.demonstration++;

      // Count synced with inventory
      if (item.inventory_id) stats.synced_with_inventory++;
    });

    return stats;
  }

  // Conferences
  static async createConference(conference: {
    title: string;
    description?: string;
    location?: Database['public']['Enums']['stock_location'];
  }): Promise<StockConference> {
    const { data, error } = await supabase
      .from('stock_conferences')
      .insert(conference)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getConferences(): Promise<StockConference[]> {
    const { data, error } = await supabase
      .from('stock_conferences')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}