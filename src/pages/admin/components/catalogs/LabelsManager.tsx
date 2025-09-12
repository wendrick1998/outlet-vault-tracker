import { useState } from "react";
import { Plus, Edit, Archive, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useLabels, useLabelMutations } from "@/hooks/useCatalogs";

interface Label {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
}

export const LabelsManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editingItem, setEditingItem] = useState<Label | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: labels = [], isLoading } = useLabels(includeArchived);
  const { createLabel, updateLabel, archiveLabel } = useLabelMutations();

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: { name: string; color: string }) => {
    await createLabel.mutateAsync(data);
    setIsDialogOpen(false);
  };

  const handleEdit = async (data: { name: string; color: string }) => {
    if (editingItem) {
      await updateLabel.mutateAsync({
        id: editingItem.id,
        updates: data,
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    }
  };

  const handleArchive = async (id: string) => {
    await archiveLabel.mutateAsync(id);
  };

  const handleReactivate = async (id: string) => {
    await updateLabel.mutateAsync({
      id,
      updates: { is_archived: false },
    });
  };

  if (isLoading) {
    return <div>Carregando etiquetas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={includeArchived}
              onCheckedChange={setIncludeArchived}
            />
            <label className="text-sm">Mostrar arquivadas</label>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Etiqueta
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLabels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Nenhuma etiqueta encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredLabels.map((label) => (
              <TableRow key={label.id}>
                <TableCell className="font-medium">
                  <Badge 
                    style={{ backgroundColor: label.color }}
                    className="text-white"
                  >
                    {label.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: label.color }}
                    />
                    <code className="text-xs">{label.color}</code>
                  </div>
                </TableCell>
                <TableCell>
                  {label.is_archived ? (
                    <Badge variant="secondary">Arquivada</Badge>
                  ) : (
                    <Badge variant="default">Ativa</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(label.created_at!).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(label);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {label.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReactivate(label.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(label.id)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Simple form dialog for labels */}
      {isDialogOpen && (
        <LabelDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title={editingItem ? "Editar Etiqueta" : "Nova Etiqueta"}
          defaultValues={editingItem ? { 
            name: editingItem.name, 
            color: editingItem.color 
          } : { 
            name: "", 
            color: "#6B7280" 
          }}
          onSubmit={editingItem ? handleEdit : handleCreate}
          isLoading={createLabel.isPending || updateLabel.isPending}
        />
      )}
    </div>
  );
};

// Simple label dialog component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const labelSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  color: z.string().min(1, "Cor é obrigatória"),
});

interface LabelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  defaultValues: { name: string; color: string };
  onSubmit: (data: { name: string; color: string }) => Promise<void>;
  isLoading: boolean;
}

const LabelDialog = ({ open, onOpenChange, title, defaultValues, onSubmit, isLoading }: LabelDialogProps) => {
  const form = useForm({
    resolver: zodResolver(labelSchema),
    defaultValues,
  });

  const handleSubmit = async (data: { name: string; color: string }) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Etiqueta</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: EMPRÉSTIMO, USO LOJA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        placeholder="#6B7280"
                        {...field}
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};