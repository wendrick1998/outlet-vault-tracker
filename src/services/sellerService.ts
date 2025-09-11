import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Seller = Database['public']['Tables']['sellers']['Row'];
type SellerInsert = Database['public']['Tables']['sellers']['Insert'];
type SellerUpdate = Database['public']['Tables']['sellers']['Update'];

export class SellerService {
  static async getAll(): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getActive(): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Seller | null> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async searchByName(name: string): Promise<Seller[]> {
    const { data, error } = await supabase
      .from('sellers')
      .select('*')
      .ilike('name', `%${name}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async create(seller: SellerInsert): Promise<Seller> {
    const { data, error } = await supabase
      .from('sellers')
      .insert(seller)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, seller: SellerUpdate): Promise<Seller> {
    const { data, error } = await supabase
      .from('sellers')
      .update(seller)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sellers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleActive(id: string): Promise<Seller> {
    const current = await this.getById(id);
    if (!current) throw new Error('Seller not found');

    return this.update(id, { is_active: !current.is_active });
  }
}