import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Reason = Database['public']['Tables']['reasons']['Row'];
type ReasonInsert = Database['public']['Tables']['reasons']['Insert'];
type ReasonUpdate = Database['public']['Tables']['reasons']['Update'];

export class ReasonService {
  static async getAll(): Promise<Reason[]> {
    const { data, error } = await supabase
      .from('reasons')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getActive(): Promise<Reason[]> {
    const { data, error } = await supabase
      .from('reasons')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Reason | null> {
    const { data, error } = await supabase
      .from('reasons')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(reason: ReasonInsert): Promise<Reason> {
    const { data, error } = await supabase
      .from('reasons')
      .insert(reason)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, reason: ReasonUpdate): Promise<Reason> {
    const { data, error } = await supabase
      .from('reasons')
      .update(reason)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('reasons')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async toggleActive(id: string): Promise<Reason> {
    const current = await this.getById(id);
    if (!current) throw new Error('Reason not found');

    return this.update(id, { is_active: !current.is_active });
  }
}