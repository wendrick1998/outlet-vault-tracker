import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DeviceLeftAtStore = Database['public']['Tables']['devices_left_at_store']['Row'];
type DeviceLeftAtStoreInsert = Database['public']['Tables']['devices_left_at_store']['Insert'];
type DeviceLeftAtStoreUpdate = Database['public']['Tables']['devices_left_at_store']['Update'];

export interface DeviceLeftAtStoreWithDetails extends DeviceLeftAtStore {
  loan?: Database['public']['Tables']['loans']['Row'] & {
    inventory?: Database['public']['Tables']['inventory']['Row'];
    customer?: Database['public']['Tables']['customers']['Row'];
    seller?: Database['public']['Tables']['sellers']['Row'];
  };
}

export class DevicesLeftAtStoreService {
  static async getAll(): Promise<DeviceLeftAtStoreWithDetails[]> {
    const { data, error } = await supabase
      .from('devices_left_at_store')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          customer:customers(*),
          seller:sellers(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getByLoanId(loanId: string): Promise<DeviceLeftAtStoreWithDetails[]> {
    const { data, error } = await supabase
      .from('devices_left_at_store')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          customer:customers(*),
          seller:sellers(*)
        )
      `)
      .eq('loan_id', loanId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<DeviceLeftAtStoreWithDetails | null> {
    const { data, error } = await supabase
      .from('devices_left_at_store')
      .select(`
        *,
        loan:loans (
          *,
          inventory(*),
          customer:customers(*),
          seller:sellers(*)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(deviceLeft: DeviceLeftAtStoreInsert): Promise<DeviceLeftAtStore> {
    const { data, error } = await supabase
      .from('devices_left_at_store')
      .insert(deviceLeft)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, deviceLeft: DeviceLeftAtStoreUpdate): Promise<DeviceLeftAtStore> {
    const { data, error } = await supabase
      .from('devices_left_at_store')
      .update(deviceLeft)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('devices_left_at_store')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}