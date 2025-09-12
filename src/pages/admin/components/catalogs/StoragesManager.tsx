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
import { useStorages, useStorageMutations } from "@/hooks/useCatalogs";
import { CatalogItemDialog } from "./CatalogItemDialog";

export const StoragesManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: storages = [], isLoading } = useStorages(includeArchived);
  const { createStorage, updateStorage, archiveStorage } = useStorageMutations();

  const filteredStorages = storages.filter(storage =>
    storage.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: { size_gb: number; display_name: string }) => {
    await createStorage.mutateAsync(data);
    setIsDialogOpen(false);
  };

  const handleEdit = async (data: { size_gb: number; display_name: string }) => {
    if (editingItem) {
      await updateStorage.mutateAsync({
        id: editingItem.id,
        updates: data,
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    }
  };

  const handleArchive = async (id: string) => {
    await archiveStorage.mutateAsync(id);
  };

  const handleReactivate = async (id: string) => {
    await updateStorage.mutateAsync({
      id,
      updates: { is_archived: false },
    });
  };

  if (isLoading) {
    return <div>Carregando armazenamentos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar armazenamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-[300px]"
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={includeArchived}
              onCheckedChange={setIncludeArchived}
            />
            <label className="text-sm">Mostrar arquivados</label>
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
          Novo Armazenamento
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tamanho (GB)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStorages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Nenhum armazenamento encontrado
              </TableCell>
            </TableRow>
          ) : (
            filteredStorages.map((storage) => (
              <TableRow key={storage.id}>
                <TableCell className="font-medium">{storage.display_name}</TableCell>
                <TableCell>{storage.size_gb} GB</TableCell>
                <TableCell>
                  {storage.is_archived ? (
                    <Badge variant="secondary">Arquivado</Badge>
                  ) : (
                    <Badge variant="default">Ativo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(storage.created_at!).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(storage);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {storage.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReactivate(storage.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(storage.id)}
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

      <CatalogItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingItem ? "Editar Armazenamento" : "Novo Armazenamento"}
        fields={[
          {
            name: "size_gb",
            label: "Tamanho (GB)",
            type: "number",
            placeholder: "ex: 128, 256, 512",
            required: true,
            min: 1,
          },
          {
            name: "display_name",
            label: "Nome de Exibição",
            type: "text",
            placeholder: "ex: 128GB, 1TB",
            required: true,
          },
        ]}
        defaultValues={editingItem ? { 
          size_gb: editingItem.size_gb, 
          display_name: editingItem.display_name 
        } : { 
          size_gb: 64, 
          display_name: "64GB" 
        }}
        onSubmit={editingItem ? handleEdit : handleCreate}
        isLoading={createStorage.isPending || updateStorage.isPending}
      />
    </div>
  );
};