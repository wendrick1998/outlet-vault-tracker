import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ImportedItem, ImportSummary } from '@/lib/inventory-import-utils';

interface ImportProgress {
  step: 'uploading' | 'processing' | 'complete';
  progress: number;
  message: string;
}

export function useInventoryImport() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: async (file: File): Promise<{
      items: ImportedItem[];
      summary: ImportSummary;
      batch_id: string;
    }> => {
      setProgress({
        step: 'uploading',
        progress: 0,
        message: 'Enviando arquivo...'
      });

      const formData = new FormData();
      formData.append('file', file);

      setProgress({
        step: 'processing',
        progress: 50,
        message: 'Processando dados...'
      });

      const { data, error } = await supabase.functions.invoke('inventory-import/preview', {
        body: formData
      });

      if (error) throw error;

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Preview gerado com sucesso'
      });

      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Preview gerado",
        description: `${data.summary.preview_count} itens analisados`
      });
      setTimeout(() => setProgress(null), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no preview",
        description: error.message,
        variant: "destructive"
      });
      setProgress(null);
    }
  });

  const importMutation = useMutation({
    mutationFn: async ({ 
      items, 
      batch_id 
    }: { 
      items: ImportedItem[]; 
      batch_id: string; 
    }): Promise<ImportSummary> => {
      setProgress({
        step: 'processing',
        progress: 0,
        message: 'Iniciando importação...'
      });

      // Simular progresso
      const updateProgress = (step: number, message: string) => {
        setProgress({
          step: 'processing',
          progress: step,
          message
        });
      };

      updateProgress(25, 'Validando dados...');
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress(50, 'Verificando duplicatas...');
      await new Promise(resolve => setTimeout(resolve, 500));

      updateProgress(75, 'Inserindo no banco de dados...');

      const { data, error } = await supabase.functions.invoke('inventory-import/commit', {
        body: { items, batch_id }
      });

      if (error) throw error;

      updateProgress(100, 'Importação concluída');

      return data.summary;
    },
    onSuccess: (summary) => {
      // Invalidar cache para atualizar listas
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });

      toast({
        title: "Importação concluída",
        description: `${summary.created || 0} itens criados, ${summary.errors || 0} erros`,
        variant: (summary.errors || 0) > 0 ? "destructive" : "default"
      });

      setProgress({
        step: 'complete',
        progress: 100,
        message: 'Importação finalizada com sucesso'
      });

      setTimeout(() => setProgress(null), 3000);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive"
      });
      setProgress(null);
    }
  });

  return {
    // Preview
    generatePreview: previewMutation.mutateAsync,
    isGeneratingPreview: previewMutation.isPending,
    
    // Import
    importItems: importMutation.mutateAsync,
    isImporting: importMutation.isPending,
    
    // Progress
    progress,
    resetProgress: () => setProgress(null),
    
    // State
    isProcessing: previewMutation.isPending || importMutation.isPending
  };
}