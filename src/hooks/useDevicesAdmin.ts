import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

const QUERY_KEY = 'admin-devices';

export const useDevicesAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as InventoryItem[];
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (deviceData: InventoryInsert) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert(deviceData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Aparelho criado",
        description: "Aparelho adicionado ao inventário com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: InventoryUpdate }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Aparelho atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      // Check if device has loans to determine if we should soft delete
      const { data: loans } = await supabase
        .from('loans')
        .select('id')
        .eq('item_id', deviceId)
        .limit(1);

      if (loans && loans.length > 0) {
        // Soft delete (archive) if has history
        const { data, error } = await supabase
          .from('inventory')
          .update({ is_archived: true })
          .eq('id', deviceId)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // Hard delete if no history
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', deviceId);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Aparelho removido",
        description: "Aparelho removido do inventário com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    devices,
    isLoading,
    error,
    createDevice: createDeviceMutation.mutate,
    updateDevice: updateDeviceMutation.mutate,
    deleteDevice: deleteDeviceMutation.mutate,
    isCreating: createDeviceMutation.isPending,
    isUpdating: updateDeviceMutation.isPending,
    isDeleting: deleteDeviceMutation.isPending,
  };
};