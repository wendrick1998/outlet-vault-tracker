import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NotesService } from '@/services/notesService';
import { useToast } from '@/components/ui/use-toast';
import { QUERY_KEYS } from '@/lib/query-keys';
import type { Database } from '@/integrations/supabase/types';

type ItemNote = Database['public']['Tables']['item_notes']['Row'];
type ItemNoteInsert = Database['public']['Tables']['item_notes']['Insert'];

export function useItemNotes(itemId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: notes = [],
    isLoading,
    error
  } = useQuery({
    queryKey: QUERY_KEYS.itemNotes.list({ itemId }),
    queryFn: () => NotesService.getByItemId(itemId),
    enabled: !!itemId,
  });

  const addNote = useMutation({
    mutationFn: (note: ItemNoteInsert) => NotesService.create(note),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.itemNotes.list({ itemId }) 
      });
      toast({
        title: "Nota adicionada",
        description: "A nota foi adicionada com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error adding note:', error);
      toast({
        title: "Erro ao adicionar nota",
        description: "Não foi possível adicionar a nota.",
        variant: "destructive",
      });
    },
  });

  const updateNote = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      NotesService.create({ id, item_id: itemId, note: content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.itemNotes.list({ itemId }) 
      });
      toast({
        title: "Nota atualizada",
        description: "A nota foi atualizada com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating note:', error);
      toast({
        title: "Erro ao atualizar nota",
        description: "Não foi possível atualizar a nota.",
        variant: "destructive",
      });
    },
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => NotesService.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.itemNotes.list({ itemId }) 
      });
      toast({
        title: "Nota removida",
        description: "A nota foi removida com sucesso.",
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error deleting note:', error);
      toast({
        title: "Erro ao remover nota",
        description: "Não foi possível remover a nota.",
        variant: "destructive",
      });
    },
  });

  return {
    notes,
    isLoading,
    error,
    addNote: addNote.mutate,
    updateNote: updateNote.mutate,
    deleteNote: deleteNote.mutate,
    isAdding: addNote.isPending,
    isUpdating: updateNote.isPending,
    isDeleting: deleteNote.isPending,
  };
}

export function useAllItemNotes() {
  return useQuery({
    queryKey: QUERY_KEYS.itemNotes.lists(),
    queryFn: () => NotesService.getRecentNotes(100), // Use existing method
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRecentItemNotes(limit: number = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.itemNotes.list({ recent: limit }),
    queryFn: () => NotesService.getRecentNotes(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useItemNote(noteId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.itemNotes.detail(noteId),
    queryFn: () => NotesService.getById(noteId),
    enabled: !!noteId,
  });
}