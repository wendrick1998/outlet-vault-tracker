import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Brand = Database['public']['Tables']['brands']['Row'];
type BrandInsert = Database['public']['Tables']['brands']['Insert'];
type BrandUpdate = Database['public']['Tables']['brands']['Update'];

type CatalogColor = Database['public']['Tables']['catalog_colors']['Row'];
type CatalogColorInsert = Database['public']['Tables']['catalog_colors']['Insert'];
type CatalogColorUpdate = Database['public']['Tables']['catalog_colors']['Update'];

type CatalogStorage = Database['public']['Tables']['catalog_storages']['Row'];
type CatalogStorageInsert = Database['public']['Tables']['catalog_storages']['Insert'];
type CatalogStorageUpdate = Database['public']['Tables']['catalog_storages']['Update'];

type CatalogCondition = Database['public']['Tables']['catalog_conditions']['Row'];
type CatalogConditionInsert = Database['public']['Tables']['catalog_conditions']['Insert'];
type CatalogConditionUpdate = Database['public']['Tables']['catalog_conditions']['Update'];

type Label = Database['public']['Tables']['labels']['Row'];
type LabelInsert = Database['public']['Tables']['labels']['Insert'];
type LabelUpdate = Database['public']['Tables']['labels']['Update'];

// Brands
export const useBrands = (includeArchived = false) => {
  return useQuery({
    queryKey: ['brands', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('brands')
        .select('*')
        .order('name');

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useBrandMutations = () => {
  const queryClient = useQueryClient();

  const createBrand = useMutation({
    mutationFn: async (brand: BrandInsert) => {
      const { data, error } = await supabase
        .from('brands')
        .insert(brand)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Marca criada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar marca',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BrandUpdate }) => {
      const { data, error } = await supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Marca atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar marca',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveBrand = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('brands')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({ title: 'Marca arquivada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao arquivar marca',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createBrand, updateBrand, archiveBrand };
};

// Colors
export const useColors = (includeArchived = false) => {
  return useQuery({
    queryKey: ['catalog_colors', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('catalog_colors')
        .select('*')
        .order('name');

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useColorMutations = () => {
  const queryClient = useQueryClient();

  const createColor = useMutation({
    mutationFn: async (color: CatalogColorInsert) => {
      const { data, error } = await supabase
        .from('catalog_colors')
        .insert(color)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_colors'] });
      toast({ title: 'Cor criada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar cor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateColor = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CatalogColorUpdate }) => {
      const { data, error } = await supabase
        .from('catalog_colors')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_colors'] });
      toast({ title: 'Cor atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar cor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveColor = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('catalog_colors')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_colors'] });
      toast({ title: 'Cor arquivada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao arquivar cor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createColor, updateColor, archiveColor };
};

// Storages
export const useStorages = (includeArchived = false) => {
  return useQuery({
    queryKey: ['catalog_storages', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('catalog_storages')
        .select('*')
        .order('size_gb');

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useStorageMutations = () => {
  const queryClient = useQueryClient();

  const createStorage = useMutation({
    mutationFn: async (storage: CatalogStorageInsert) => {
      const { data, error } = await supabase
        .from('catalog_storages')
        .insert(storage)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_storages'] });
      toast({ title: 'Armazenamento criado com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar armazenamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStorage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CatalogStorageUpdate }) => {
      const { data, error } = await supabase
        .from('catalog_storages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_storages'] });
      toast({ title: 'Armazenamento atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar armazenamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveStorage = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('catalog_storages')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_storages'] });
      toast({ title: 'Armazenamento arquivado com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao arquivar armazenamento',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createStorage, updateStorage, archiveStorage };
};

// Conditions
export const useConditions = () => {
  return useQuery({
    queryKey: ['catalog_conditions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_conditions')
        .select('*')
        .eq('is_active', true)
        .order('label');
      if (error) throw error;
      return data;
    },
  });
};

export const useConditionMutations = () => {
  const queryClient = useQueryClient();

  const createCondition = useMutation({
    mutationFn: async (condition: CatalogConditionInsert) => {
      const { data, error } = await supabase
        .from('catalog_conditions')
        .insert(condition)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_conditions'] });
      toast({ title: 'Condição criada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar condição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCondition = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: CatalogConditionUpdate }) => {
      const { data, error } = await supabase
        .from('catalog_conditions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog_conditions'] });
      toast({ title: 'Condição atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar condição',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createCondition, updateCondition };
};

// Labels
export const useLabels = (includeArchived = false) => {
  return useQuery({
    queryKey: ['labels', includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('labels')
        .select('*')
        .order('name');

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useLabelMutations = () => {
  const queryClient = useQueryClient();

  const createLabel = useMutation({
    mutationFn: async (label: LabelInsert) => {
      const { data, error } = await supabase
        .from('labels')
        .insert(label)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast({ title: 'Etiqueta criada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar etiqueta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateLabel = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LabelUpdate }) => {
      const { data, error } = await supabase
        .from('labels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast({ title: 'Etiqueta atualizada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar etiqueta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const archiveLabel = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('labels')
        .update({ is_archived: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast({ title: 'Etiqueta arquivada com sucesso!' });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao arquivar etiqueta',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return { createLabel, updateLabel, archiveLabel };
};