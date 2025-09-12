import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryInsert = Database['public']['Tables']['inventory']['Insert'];
type InventoryUpdate = Database['public']['Tables']['inventory']['Update'];

const QUERY_KEY = 'admin-devices';

export const useDevicesAdmin = (includeArchived: boolean = false) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEY, includeArchived],
    queryFn: async () => {
      let query = supabase
        .from('inventory')
        .select('*');
      
      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
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

  const archiveDeviceMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { data, error } = await supabase
        .from('inventory')
        .update({ is_archived: archived })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Aparelho excluído com sucesso!",
        description: "O aparelho foi removido permanentemente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir aparelho",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create the createDevice object with proper structure
  const createDevice = {
    mutateAsync: createDeviceMutation.mutateAsync,
    isPending: createDeviceMutation.isPending,
  };

  return {
    devices,
    isLoading,
    error,
    createDevice,
    updateDevice: updateDeviceMutation.mutate,
    archiveDevice: archiveDeviceMutation.mutate,
    deleteDevice: deleteDeviceMutation.mutate,
    isCreating: createDeviceMutation.isPending,
    isUpdating: updateDeviceMutation.isPending,
    isDeleting: deleteDeviceMutation.isPending,
  };
};