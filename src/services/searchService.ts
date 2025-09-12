import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

export interface SearchResult {
  items: InventoryItem[];
  exactMatch?: InventoryItem;
  hasMultiple: boolean;
}

export interface AISearchResult {
  correctedTerm?: string;
  suggestions: string[];
  searchType: string;
  confidence: number;
  reasoning: string;
  results: InventoryItem[];
  originalTerm: string;
}

export class SearchService {
  // Enhanced AI-powered search
  static async aiSearchByIMEI(searchTerm: string): Promise<AISearchResult> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-search-assistant', {
        body: {
          searchTerm,
          type: 'imei'
        }
      });

      if (error) {
        console.error('AI search error:', error);
        // Fallback to regular search
        const fallbackResult = await this.searchByIMEI(searchTerm);
        return {
          correctedTerm: null,
          suggestions: [],
          searchType: 'imei',
          confidence: 0.5,
          reasoning: 'Busca regular (IA indisponível)',
          results: fallbackResult.items,
          originalTerm: searchTerm
        };
      }

      return data;
    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to regular search
      const fallbackResult = await this.searchByIMEI(searchTerm);
      return {
        correctedTerm: null,
        suggestions: [],
        searchType: 'imei',
        confidence: 0.5,
        reasoning: 'Busca regular (erro na IA)',
        results: fallbackResult.items,
        originalTerm: searchTerm
      };
    }
  }

  static async searchByIMEI(searchTerm: string): Promise<SearchResult> {
    if (!searchTerm.trim()) {
      return { items: [], hasMultiple: false };
    }

    const cleanTerm = searchTerm.trim();
    
    // First try exact match on IMEI
    const { data: exactIMEI, error: exactError } = await supabase
      .from('inventory')
      .select('*')
      .eq('imei', cleanTerm)
      .maybeSingle();

    if (exactError && exactError.code !== 'PGRST116') {
      throw exactError;
    }

    if (exactIMEI) {
      return {
        items: [exactIMEI],
        exactMatch: exactIMEI,
        hasMultiple: false
      };
    }

    // Then try exact match on suffix
    const { data: exactSuffix, error: suffixError } = await supabase
      .from('inventory')
      .select('*')
      .eq('suffix', cleanTerm)
      .maybeSingle();

    if (suffixError && suffixError.code !== 'PGRST116') {
      throw suffixError;
    }

    if (exactSuffix) {
      return {
        items: [exactSuffix],
        exactMatch: exactSuffix,
        hasMultiple: false
      };
    }

    // Finally, do partial search
    const { data: partialResults, error: partialError } = await supabase
      .from('inventory')
      .select('*')
      .or(`imei.ilike.%${cleanTerm}%,suffix.ilike.%${cleanTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (partialError) throw partialError;

    const items = partialResults || [];
    
    return {
      items,
      hasMultiple: items.length > 1,
      exactMatch: items.length === 1 ? items[0] : undefined
    };
  }

  static async searchByBrand(brand: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .ilike('brand', `%${brand}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async searchByModel(model: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .ilike('model', `%${model}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async advancedSearch(filters: {
    brand?: string;
    model?: string;
    color?: string;
    status?: Database['public']['Enums']['inventory_status'];
    storage?: string;
  }): Promise<InventoryItem[]> {
    let query = supabase.from('inventory').select('*');

    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }
    
    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }
    
    if (filters.color) {
      query = query.ilike('color', `%${filters.color}%`);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.storage) {
      query = query.ilike('storage', `%${filters.storage}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}