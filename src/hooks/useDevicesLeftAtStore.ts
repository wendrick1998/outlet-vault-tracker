import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DevicesLeftAtStoreService } from '@/services/devicesLeftAtStoreService';
import { useToast } from '@/hooks/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { Database } from '@/integrations/supabase/types';

type DeviceLeftAtStoreInsert = Database['public']['Tables']['devices_left_at_store']['Insert'];
type DeviceLeftAtStoreUpdate = Database['public']['Tables']['devices_left_at_store']['Update'];

export function useDevicesLeftAtStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: devicesLeftAtStore = [],
    isLoading,
    error
  } = useQuery({
    queryKey: QUERY_KEYS.devicesLeftAtStore.lists(),
    queryFn: DevicesLeftAtStoreService.getAll,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createDeviceLeftAtStore = useMutation({
    mutationFn: (device: DeviceLeftAtStoreInsert) => 
      DevicesLeftAtStoreService.create(device),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore.lists() });
      toast({
        title: "Aparelho registrado",
        description: "O aparelho foi registrado como deixado na loja com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error creating device left at store:', error);
      toast({
        title: "Erro ao registrar aparelho",
        description: "Não foi possível registrar o aparelho como deixado na loja.",
        variant: "destructive",
      });
    },
  });

  const updateDeviceLeftAtStore = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & DeviceLeftAtStoreUpdate) =>
      DevicesLeftAtStoreService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore.lists() });
      toast({
        title: "Aparelho atualizado",
        description: "As informações do aparelho foram atualizadas com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating device left at store:', error);
      toast({
        title: "Erro ao atualizar aparelho",
        description: "Não foi possível atualizar as informações do aparelho.",
        variant: "destructive",
      });
    },
  });

  const markAsCollected = useMutation({
    mutationFn: (id: string) => DevicesLeftAtStoreService.markAsCollected(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore.lists() });
      toast({
        title: "Aparelho coletado",
        description: "O aparelho foi marcado como coletado com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error marking device as collected:', error);
      toast({
        title: "Erro ao marcar como coletado",
        description: "Não foi possível marcar o aparelho como coletado.",
        variant: "destructive",
      });
    },
  });

  return {
    devicesLeftAtStore,
    isLoading,
    error,
    createDeviceLeftAtStore: createDeviceLeftAtStore.mutate,
    updateDeviceLeftAtStore: updateDeviceLeftAtStore.mutate,
    markAsCollected: markAsCollected.mutate,
    isCreating: createDeviceLeftAtStore.isPending,
    isUpdating: updateDeviceLeftAtStore.isPending,
    isMarkingAsCollected: markAsCollected.isPending,
  };
}

export function useDeviceLeftAtStore(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.devicesLeftAtStore.detail(id),
    queryFn: () => DevicesLeftAtStoreService.getById(id),
    enabled: !!id,
  });
}

export function useDevicesLeftAtStoreByLoan(loanId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.devicesLeftAtStore.list({ loanId }),
    queryFn: () => DevicesLeftAtStoreService.getByLoanId(loanId),
    enabled: !!loanId,
    staleTime: 1000 * 60, // 1 minute
  });
}