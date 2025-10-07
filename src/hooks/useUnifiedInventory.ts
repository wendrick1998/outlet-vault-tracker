import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateLinkedItemParams {
  imei: string;
  model: string;
  brand: string;
  color?: string;
  storage?: string;
  condition?: string;
  battery_pct?: number;
  price?: number;
  cost?: number;
  location?: 'vitrine' | 'estoque' | 'assistencia' | 'deposito' | 'loja_online' | 'conserto';
  notes?: string;
}

export const useUnifiedInventory = () => {
  const queryClient = useQueryClient();

  // Create linked item (cria em ambos os sistemas)
  const createLinkedItem = useMutation({
    mutationFn: async (params: CreateLinkedItemParams) => {
      const { data, error } = await supabase.rpc('create_linked_item', {
        p_imei: params.imei,
        p_model: params.model,
        p_brand: params.brand,
        p_color: params.color || null,
        p_storage: params.storage || null,
        p_condition: params.condition || 'novo',
        p_battery_pct: params.battery_pct || 100,
        p_price: params.price || null,
        p_cost: params.cost || null,
        p_location: params.location || 'estoque',
        p_notes: params.notes || null,
      });

      if (error) throw error;
      
      const result = data as any;
      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao criar item vinculado');
      }
      
      return result;
    },
    onSuccess: (data) => {
      // Invalidar queries com exact: false para pegar nested keys
      queryClient.invalidateQueries({ 
        queryKey: ['inventory'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['stock'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['integration-stats'],
        exact: false
      });
      // Forçar reload da unified_inventory
      queryClient.refetchQueries({ 
        queryKey: ['unified-inventory'] 
      });
      
      toast({
        title: "✅ Aparelho cadastrado com sucesso!",
        description: "O item foi adicionado ao inventário e ao estoque.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Query unified inventory
  const { data: unifiedItems, isLoading } = useQuery({
    queryKey: ['unified-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('unified_inventory')
        .select('*')
        .order('inventory_created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return {
    createLinkedItem,
    unifiedItems,
    isLoading,
    isCreating: createLinkedItem.isPending,
  };
};
