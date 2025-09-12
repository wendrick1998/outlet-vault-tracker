import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DevicesLeftAtStoreService } from '@/services/devicesLeftAtStoreService';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DeviceLeftAtStoreInsert = Database['public']['Tables']['devices_left_at_store']['Insert'];
type DeviceLeftAtStoreUpdate = Database['public']['Tables']['devices_left_at_store']['Update'];

const QUERY_KEYS = {
  devicesLeftAtStore: ['devices-left-at-store'] as const,
  deviceLeftAtStore: (id: string) => [...QUERY_KEYS.devicesLeftAtStore, id] as const,
  devicesByLoan: (loanId: string) => [...QUERY_KEYS.devicesLeftAtStore, 'loan', loanId] as const,
};

export function useDevicesLeftAtStore() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: devicesLeftAtStore = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.devicesLeftAtStore,
    queryFn: DevicesLeftAtStoreService.getAll,
  });

  const createDeviceLeftMutation = useMutation({
    mutationFn: DevicesLeftAtStoreService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore });
      toast({
        title: 'Aparelho registrado',
        description: 'Aparelho deixado na loja foi registrado com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao registrar aparelho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDeviceLeftMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviceLeftAtStoreUpdate }) =>
      DevicesLeftAtStoreService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore });
      toast({
        title: 'Aparelho atualizado',
        description: 'Informações do aparelho foram atualizadas.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao atualizar aparelho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDeviceLeftMutation = useMutation({
    mutationFn: DevicesLeftAtStoreService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.devicesLeftAtStore });
      toast({
        title: 'Aparelho removido',
        description: 'Registro do aparelho foi removido.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao remover aparelho',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    devicesLeftAtStore,
    isLoading,
    error,
    createDeviceLeft: createDeviceLeftMutation.mutateAsync,
    updateDeviceLeft: updateDeviceLeftMutation.mutateAsync,
    deleteDeviceLeft: deleteDeviceLeftMutation.mutateAsync,
    isCreating: createDeviceLeftMutation.isPending,
    isUpdating: updateDeviceLeftMutation.isPending,
    isDeleting: deleteDeviceLeftMutation.isPending,
  };
}

export function useDeviceLeftAtStore(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.deviceLeftAtStore(id),
    queryFn: () => DevicesLeftAtStoreService.getById(id),
    enabled: !!id,
  });
}

export function useDevicesLeftByLoan(loanId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.devicesByLoan(loanId),
    queryFn: () => DevicesLeftAtStoreService.getByLoanId(loanId),
    enabled: !!loanId,
  });
}