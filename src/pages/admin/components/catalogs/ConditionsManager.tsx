import { useState } from "react";
import { Plus, Edit } from "lucide-react";
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
import { useConditions, useConditionMutations } from "@/hooks/useCatalogs";
import { CatalogItemDialog } from "./CatalogItemDialog";

export const ConditionsManager = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: conditions = [], isLoading } = useConditions();
  const { createCondition, updateCondition } = useConditionMutations();

  const filteredConditions = conditions.filter(condition =>
    condition.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    condition.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async (data: { code: string; label: string }) => {
    await createCondition.mutateAsync(data);
    setIsDialogOpen(false);
  };

  const handleEdit = async (data: { code: string; label: string }) => {
    if (editingItem) {
      await updateCondition.mutateAsync({
        id: editingItem.id,
        updates: data,
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div>Carregando condições...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Buscar condições..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-[300px]"
        />
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Condição
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nome</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredConditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                Nenhuma condição encontrada
              </TableCell>
            </TableRow>
          ) : (
            filteredConditions.map((condition) => (
              <TableRow key={condition.id}>
                <TableCell className="font-mono">{condition.code}</TableCell>
                <TableCell className="font-medium">{condition.label}</TableCell>
                <TableCell>
                  <Badge variant="default">Ativa</Badge>
                </TableCell>
                <TableCell>
                  {new Date(condition.created_at!).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingItem(condition);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CatalogItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingItem ? "Editar Condição" : "Nova Condição"}
        fields={[
          {
            name: "code",
            label: "Código",
            type: "text",
            placeholder: "ex: novo, seminovo, usado",
            required: true,
          },
          {
            name: "label",
            label: "Nome de Exibição",
            type: "text",
            placeholder: "ex: Novo, Seminovo, Usado",
            required: true,
          },
        ]}
        defaultValues={editingItem ? { 
          code: editingItem.code, 
          label: editingItem.label 
        } : { 
          code: "", 
          label: "" 
        }}
        onSubmit={editingItem ? handleEdit : handleCreate}
        isLoading={createCondition.isPending || updateCondition.isPending}
      />
    </div>
  );
};