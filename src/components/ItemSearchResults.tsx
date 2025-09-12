import { Plus, Archive, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BatteryPercentage } from "@/components/BatteryPercentage";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface ItemSearchResultsProps {
  items: InventoryItem[];
  selectedItems: InventoryItem[];
  onAddToCart: (item: InventoryItem) => void;
  showArchived: boolean;
  isLoading: boolean;
}

export const ItemSearchResults = ({
  items,
  selectedItems,
  onAddToCart,
  showArchived,
  isLoading
}: ItemSearchResultsProps) => {
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const { deleteItem } = useInventory();
  const { toast } = useToast();

  const getStatusBadge = (status: string, isArchived: boolean) => {
    if (isArchived) {
      return <Badge variant="secondary">Arquivado</Badge>;
    }
    
    switch (status) {
      case 'available':
        return <Badge variant="default">Disponível</Badge>;
      case 'loaned':
        return <Badge variant="secondary">Emprestado</Badge>;
      case 'sold':
        return <Badge variant="destructive">Vendido</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isItemSelected = (item: InventoryItem) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const canAddToCart = (item: InventoryItem) => {
    return !item.is_archived && !isItemSelected(item);
  };

  const handleDeletePermanently = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(itemToDelete.id);
      toast({
        title: "Item excluído",
        description: `${itemToDelete.model} foi excluído permanentemente`,
      });
      setItemToDelete(null);
    } catch (error) {
      toast({
        title: "Erro na exclusão",
        description: "Não foi possível excluir o item. Verifique se não há vínculos ativos.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg font-medium mb-2">Nenhum resultado encontrado</div>
          <p>Tente ajustar os termos de busca ou filtros</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className={`p-4 hover:shadow-md transition-shadow ${
            isItemSelected(item) ? 'ring-2 ring-primary' : ''
          }`}>
            <div className="space-y-3">
              {/* Header com status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {item.brand} {item.model}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.color} • {item.storage} • {item.condition}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    IMEI: ...{item.suffix || item.imei?.slice(-5)}
                  </p>
                </div>
                {getStatusBadge(item.status, item.is_archived || false)}
              </div>

              {/* Bateria */}
              <BatteryPercentage
                itemId={item.id}
                currentPercentage={item.battery_pct}
                disabled={item.is_archived}
              />

              {/* Notas */}
              {item.notes && (
                <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                  {item.notes}
                </div>
              )}

              {/* Ações */}
              <div className="flex gap-2">
                {!item.is_archived ? (
                  <Button
                    onClick={() => onAddToCart(item)}
                    disabled={!canAddToCart(item)}
                    className="flex-1"
                    variant={isItemSelected(item) ? "secondary" : "default"}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isItemSelected(item) ? "Selecionado" : "Adicionar"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1"
                      disabled
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivado
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setItemToDelete(item)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de confirmação para exclusão permanente */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeletePermanently}
        title="Excluir Permanentemente"
        description={`Tem certeza que deseja excluir permanentemente "${itemToDelete?.model}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir Permanentemente"
        variant="destructive"
      />
    </>
  );
};