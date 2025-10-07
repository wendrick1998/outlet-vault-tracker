import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ParsedDevice } from '@/lib/batch-import-parser';

interface CreateBatchParams {
  supplier_name: string;
  purchase_date?: string;
  warranty_months?: number;
  notes?: string;
  items: Array<ParsedDevice>;
}

export const useSupplierBatch = () => {
  const queryClient = useQueryClient();
  
  const createBatch = useMutation({
    mutationFn: async (params: CreateBatchParams) => {
      // 1. Criar batch
      const { data: batch, error: batchError } = await supabase
        .from('supplier_batches')
        .insert({
          supplier_name: params.supplier_name,
          purchase_date: params.purchase_date || new Date().toISOString().split('T')[0],
          warranty_months: params.warranty_months || 0,
          total_items: params.items.length,
          total_cost: params.items.reduce((sum, item) => sum + (item.cost || 0), 0),
          notes: params.notes,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
      
      if (batchError) throw batchError;
      
      // 2. Criar cada item vinculado
      const results = await Promise.allSettled(
        params.items.map(item => 
          supabase.rpc('create_linked_item', {
            p_imei: item.imei,
            p_model: item.model,
            p_brand: 'Apple',
            p_color: item.color || null,
            p_storage: item.storage || null,
            p_condition: item.condition,
            p_battery_pct: item.battery_pct,
            p_cost: item.cost || null,
            p_location: 'estoque',
            p_notes: null,
            p_batch_id: batch.id,
            p_supplier_name: params.supplier_name
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { batch, successful, failed, results };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['stock'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['supplier-batches'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['unified-inventory'] });
      
      toast({
        title: "✅ Lote importado!",
        description: `${data.successful} aparelhos adicionados. ${data.failed > 0 ? `${data.failed} falharam.` : ''}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar lote",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Query batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ['supplier-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('supplier_batches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
  
  return {
    createBatch,
    batches,
    isLoading,
    isCreating: createBatch.isPending
  };
};
