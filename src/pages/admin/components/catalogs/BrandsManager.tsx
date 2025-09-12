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
import { useBrands, useBrandMutations } from "@/hooks/useCatalogs";
import { CatalogItemDialog } from "./CatalogItemDialog";

export const BrandsManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: brands = [], isLoading } = useBrands(includeArchived);
  const { createBrand, updateBrand, archiveBrand } = useBrandMutations();

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: { name: string }) => {
    await createBrand.mutateAsync(data);
    setIsDialogOpen(false);
  };

  const handleEdit = async (data: { name: string }) => {
    if (editingItem) {
      await updateBrand.mutateAsync({
        id: editingItem.id,
        updates: data,
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    }
  };

  const handleArchive = async (id: string) => {
    await archiveBrand.mutateAsync(id);
  };

  const handleReactivate = async (id: string) => {
    await updateBrand.mutateAsync({
      id,
      updates: { is_archived: false },
    });
  };

  if (isLoading) {
    return <div>Carregando marcas...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Buscar marcas..."
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
          Nova Marca
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBrands.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Nenhuma marca encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>
                  {brand.is_archived ? (
                    <Badge variant="secondary">Arquivada</Badge>
                  ) : (
                    <Badge variant="default">Ativa</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(brand.created_at!).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(brand);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {brand.is_archived ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReactivate(brand.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(brand.id)}
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
        title={editingItem ? "Editar Marca" : "Nova Marca"}
        fields={[
          {
            name: "name",
            label: "Nome da Marca",
            type: "text",
            placeholder: "ex: Apple, Samsung",
            required: true,
          },
        ]}
        defaultValues={editingItem ? { name: editingItem.name } : { name: "" }}
        onSubmit={editingItem ? handleEdit : handleCreate}
        isLoading={createBrand.isPending || updateBrand.isPending}
      />
    </div>
  );
};