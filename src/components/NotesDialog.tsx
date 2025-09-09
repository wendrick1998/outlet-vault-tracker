import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Calendar } from "lucide-react";
import { MockInventory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface NotesDialogProps {
  item: MockInventory;
  onClose: () => void;
}

export const NotesDialog = ({ item, onClose }: NotesDialogProps) => {
  const [newNote, setNewNote] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const noteTags = [
    { value: "defeito", label: "Defeito", color: "destructive" },
    { value: "aviso", label: "Aviso", color: "warning" },
    { value: "info", label: "Informação", color: "secondary" }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast({
        title: "Observação obrigatória",
        description: "Digite uma observação antes de salvar",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Mock API call
    setTimeout(() => {
      const note = {
        id: `n${Date.now()}`,
        inventoryId: item.id,
        note: newNote.trim(),
        createdAt: new Date().toISOString(),
        author: 'Operadora',
        tag: selectedTag || undefined
      };

      // Add to mock data (in real app this would be API call)
      item.notes.unshift(note);

      toast({
        title: "Observação adicionada",
        description: "A observação foi salva com sucesso",
      });
      
      setNewNote("");
      setSelectedTag("");
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Observações
          </h2>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
        
        {/* Item info */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold">{item.model}</h3>
          <p className="text-muted-foreground">{item.color} • ...{item.imeiSuffix5}</p>
        </div>

        {/* Add new note */}
        <div className="space-y-4 mb-6 p-4 border border-border rounded-lg">
          <h4 className="font-medium">Adicionar Nova Observação</h4>
          
          {/* Tag selection */}
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Categoria (opcional)</label>
            <div className="flex gap-2">
              <Button
                variant={!selectedTag ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag("")}
              >
                Geral
              </Button>
              {noteTags.map((tag) => (
                <Button
                  key={tag.value}
                  variant={selectedTag === tag.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag.value)}
                >
                  {tag.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Note input */}
          <Textarea
            placeholder="Digite sua observação aqui..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          
          <Button 
            onClick={handleAddNote}
            disabled={isSubmitting || !newNote.trim()}
            className="w-full"
          >
            {isSubmitting ? "Salvando..." : "Adicionar Observação"}
          </Button>
        </div>

        {/* Existing notes */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Histórico de Observações ({item.notes.length})
          </h4>
          
          {item.notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              Nenhuma observação registrada ainda
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {item.notes.map((note) => (
                <div 
                  key={note.id} 
                  className="p-4 border border-border rounded-lg bg-card/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{note.author}</span>
                      {note.tag && (
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                        >
                          {noteTags.find(t => t.value === note.tag)?.label || note.tag}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
