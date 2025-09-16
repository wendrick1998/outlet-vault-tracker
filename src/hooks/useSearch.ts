import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { SearchService, type SearchResult } from '@/services/searchService';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

const QUERY_KEYS = {
  all: ['search'] as const,
  imei: (term: string) => [...QUERY_KEYS.all, 'imei', term] as const,
  brand: (term: string) => [...QUERY_KEYS.all, 'brand', term] as const,
  model: (term: string) => [...QUERY_KEYS.all, 'model', term] as const,
  advanced: (filters: object) => [...QUERY_KEYS.all, 'advanced', filters] as const,
};

export function useIMEISearch(searchTerm: string) {
  return useQuery({
    queryKey: QUERY_KEYS.imei(searchTerm),
    queryFn: () => SearchService.searchByIMEI(searchTerm),
    enabled: !!searchTerm.trim(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBrandSearch(brand: string) {
  return useQuery({
    queryKey: QUERY_KEYS.brand(brand),
    queryFn: () => SearchService.searchByBrand(brand),
    enabled: !!brand.trim(),
  });
}

export function useModelSearch(model: string) {
  return useQuery({
    queryKey: QUERY_KEYS.model(model),
    queryFn: () => SearchService.searchByModel(model),
    enabled: !!model.trim(),
  });
}

export function useAdvancedSearch(filters: {
  brand?: string;
  model?: string;
  color?: string;
  status?: Database['public']['Enums']['inventory_status'];
  storage?: string;
}) {
  const hasFilters = useMemo(() => 
    Object.values(filters).some(value => value && String(value).trim()), 
    [filters]
  );
  
  return useQuery({
    queryKey: QUERY_KEYS.advanced(filters),
    queryFn: () => SearchService.advancedSearch(filters),
    enabled: hasFilters,
  });
}

// Export search functions directly - no need for wrapper hook
export {
  useIMEISearch as useSearchByIMEI,
  useBrandSearch as useSearchByBrand, 
  useModelSearch as useSearchByModel
};