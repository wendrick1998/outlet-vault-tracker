import { useState } from 'react';
import { CheckSquare, Square, MoreHorizontal, Trash2, Edit, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FeatureFlagWrapper } from '@/components/ui/feature-flag';
import { FEATURE_FLAGS } from '@/lib/features';
import { useToast } from '@/hooks/use-toast';
import { useInventory } from '@/hooks/useInventory';
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];
type InventoryStatus = Database['public']['Enums']['inventory_status'];

interface BatchOperationsProps {
  items: InventoryItem[];
  onRefresh: () => void;
}

export const BatchOperations = ({ items, onRefresh }: BatchOperationsProps) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [batchAction, setBatchAction] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();
  const { updateItem, deleteItem } = useInventory();

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleSelectItem = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleBatchAction = async (action: string) => {
    setBatchAction(action);
    setShowConfirmDialog(true);
  };

  const executeBatchAction = async () => {
    if (selectedItems.size === 0) return;

    try {
      const promises = Array.from(selectedItems).map(async (itemId) => {
        switch (batchAction) {
          case 'delete':
            return deleteItem(itemId);
          case 'available':
          case 'loaned':
          case 'sold':
            return updateItem({ id: itemId, data: { status: batchAction as InventoryStatus } });
          default:
            throw new Error(`Ação desconhecida: ${batchAction}`);
        }
      });

      await Promise.all(promises);

      toast({
        title: 'Operação concluída',
        description: `${selectedItems.size} ${selectedItems.size === 1 ? 'item processado' : 'itens processados'} com sucesso.`,
      });

      setSelectedItems(new Set());
      onRefresh();
    } catch (error) {
      toast({
        title: 'Erro na operação',
        description: 'Alguns itens podem não ter sido processados.',
        variant: 'destructive',
      });
    } finally {
      setShowConfirmDialog(false);
      setBatchAction('');
    }
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'delete':
        return 'excluir permanentemente';
      case 'available':
        return 'marcar como disponível';
      case 'loaned':
        return 'marcar como emprestado';
      case 'sold':
        return 'marcar como vendido';
      default:
        return action;
    }
  };

  return (
    <FeatureFlagWrapper flag={FEATURE_FLAGS.BATCH_OPERATIONS}>
      <Card className="mb-4">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="gap-2"
              >
                {selectedItems.size === items.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedItems.size > 0 ? `${selectedItems.size} selecionados` : 'Selecionar todos'}
              </Button>

              {selectedItems.size > 0 && (
                <Badge variant="secondary">
                  {selectedItems.size} de {items.length} itens
                </Badge>
              )}
            </div>

            {selectedItems.size > 0 && (
              <div className="flex items-center gap-2">
                <Select onValueChange={handleBatchAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Ações em lote" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Marcar como Disponível</SelectItem>
                    <SelectItem value="loaned">Marcar como Emprestado</SelectItem>
                    <SelectItem value="sold">Marcar como Vendido</SelectItem>
                    <SelectItem value="delete" className="text-destructive">
                      Excluir Selecionados
                    </SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleBatchAction('available')}>
                      <Package className="h-4 w-4 mr-2" />
                      Disponibilizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBatchAction('export')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleBatchAction('delete')}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Items with selection checkboxes */}
      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id} className={`p-3 cursor-pointer transition-colors ${
            selectedItems.has(item.id) ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
          }`}>
            <div className="flex items-center gap-3" onClick={() => handleSelectItem(item.id)}>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-5 w-5"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectItem(item.id);
                }}
              >
                {selectedItems.has(item.id) ? (
                  <CheckSquare className="h-4 w-4 text-primary" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono text-sm">...{item.imei.slice(-5)}</span>
                    <span className="ml-3 font-medium">{item.brand} {item.model}</span>
                  </div>
                  <Badge variant={
                    item.status === "available" ? "default" : 
                    item.status === "loaned" ? "secondary" : "destructive"
                  }>
                    {item.status === "available" ? "Disponível" : 
                     item.status === "loaned" ? "Emprestado" : "Vendido"}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Operação em Lote</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a {getActionDescription(batchAction)} {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'itens'}.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeBatchAction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FeatureFlagWrapper>
  );
};