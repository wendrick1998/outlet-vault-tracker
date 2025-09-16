import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotesService } from '@/services/notesService';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type ItemNote = Database['public']['Tables']['item_notes']['Row'];
type ItemNoteInsert = Database['public']['Tables']['item_notes']['Insert'];

const QUERY_KEYS = {
  all: ['item-notes'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  list: (filters: string) => [...QUERY_KEYS.lists(), filters] as const,
  details: () => [...QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...QUERY_KEYS.details(), id] as const,
  byItem: (itemId: string) => [...QUERY_KEYS.all, 'by-item', itemId] as const,
  recent: (limit: number) => [...QUERY_KEYS.all, 'recent', limit] as const,
};

export function useItemNotes(itemId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.byItem(itemId),
    queryFn: () => NotesService.getByItemId(itemId),
    enabled: !!itemId,
  });

  const createMutation = useMutation({
    mutationFn: NotesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byItem(itemId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Nota adicionada",
        description: "Nota adicionada ao item com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: NotesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byItem(itemId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Nota removida",
        description: "Nota removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addNote = (note: string) => {
    createMutation.mutate({
      item_id: itemId,
      note: note.trim(),
    });
  };

  return {
    // Data
    notes,
    isLoading,
    error,

    // Actions
    addNote,
    deleteNote: deleteMutation.mutate,

    // Status
    isAdding: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useItemNote(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: () => NotesService.getById(id),
    enabled: !!id,
  });
}

export function useRecentNotes(limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.recent(limit),
    queryFn: () => NotesService.getRecentNotes(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook for adding notes to any item without needing to query existing notes
export function useAddItemNote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, note }: { itemId: string; note: string }) =>
      NotesService.addNote(itemId, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.byItem(variables.itemId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      toast({
        title: "Nota adicionada",
        description: "Nota adicionada ao item com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}