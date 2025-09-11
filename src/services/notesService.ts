import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ItemNote = Database['public']['Tables']['item_notes']['Row'];
type ItemNoteInsert = Database['public']['Tables']['item_notes']['Insert'];

export class NotesService {
  static async getByItemId(itemId: string): Promise<ItemNote[]> {
    const { data, error } = await supabase
      .from('item_notes')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<ItemNote | null> {
    const { data, error } = await supabase
      .from('item_notes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async create(note: ItemNoteInsert): Promise<ItemNote> {
    const { data, error } = await supabase
      .from('item_notes')
      .insert(note)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('item_notes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async addNote(itemId: string, note: string): Promise<ItemNote> {
    return this.create({
      item_id: itemId,
      note: note.trim()
    });
  }

  static async getRecentNotes(limit = 10): Promise<(ItemNote & { inventory?: Database['public']['Tables']['inventory']['Row'] })[]> {
    const { data, error } = await supabase
      .from('item_notes')
      .select(`
        *,
        inventory(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}