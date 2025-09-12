import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DeviceModel = Database['public']['Tables']['device_models']['Row'];
type DeviceModelInsert = Database['public']['Tables']['device_models']['Insert'];
type DeviceModelUpdate = Database['public']['Tables']['device_models']['Update'];

const QUERY_KEY = 'admin-device-models';

export const useDeviceModelsAdmin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: models = [], isLoading, error } = useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('device_models')
        .select('*')
        .order('brand', { ascending: true })
        .order('model', { ascending: true });
      
      if (error) throw error;
      return data as DeviceModel[];
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (modelData: DeviceModelInsert) => {
      const { data, error } = await supabase
        .from('device_models')
        .insert(modelData)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Modelo criado",
        description: "Modelo de aparelho adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: DeviceModelUpdate }) => {
      const { data, error } = await supabase
        .from('device_models')
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
        title: "Modelo atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar modelo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Apple models seed functionality
  const seedAppleModelsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('seed-apple-models', {
        body: {}
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast({
        title: "Catálogo Apple processado!",
        description: `${data.details.created} modelos criados, ${data.details.updated} atualizados`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao processar catálogo Apple",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleModelStatus = (modelId: string, currentStatus: boolean) => {
    updateModelMutation.mutate({
      id: modelId,
      updates: { is_active: !currentStatus }
    });
  };

  return {
    models,
    isLoading,
    error,
    createModel: createModelMutation.mutate,
    updateModel: updateModelMutation.mutate,
    seedAppleModels: seedAppleModelsMutation.mutate,
    toggleModelStatus,
    isCreating: createModelMutation.isPending,
    isUpdating: updateModelMutation.isPending,
    isSeeding: seedAppleModelsMutation.isPending,
  };
};