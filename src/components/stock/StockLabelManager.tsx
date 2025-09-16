import { useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockLabels } from "@/hooks/useStock";
import type { Database } from '@/integrations/supabase/types';

type StockItem = Database['public']['Tables']['stock_items']['Row'] & {
  stock_item_labels?: Array<{
    id: string;
    label: {
      id: string;
      name: string;
      color: string;
    };
  }>;
};

type Label = Database['public']['Tables']['labels']['Row'];

interface StockLabelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockItem;
  availableLabels: Label[];
}

export const StockLabelManager = ({ 
  open, 
  onOpenChange, 
  stockItem, 
  availableLabels 
}: StockLabelManagerProps) => {
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const { addLabel, removeLabel, isAddingLabel, isRemovingLabel } = useStockLabels();

  const currentLabels = stockItem.stock_item_labels?.map(sl => sl.label) || [];
  const currentLabelIds = currentLabels.map(l => l.id);
  
  const unusedLabels = availableLabels.filter(
    label => !currentLabelIds.includes(label.id)
  );

  const handleAddLabels = async () => {
    try {
      await Promise.all(
        selectedLabelIds.map(labelId => 
          addLabel({
            stockItemId: stockItem.id,
            labelId
          })
        )
      );
      setSelectedLabelIds([]);
    } catch (error) {
      console.error("Error adding labels:", error);
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await removeLabel({
        stockItemId: stockItem.id,
        labelId
      });
    } catch (error) {
      console.error("Error removing label:", error);
    }
  };

  const toggleLabelSelection = (labelId: string) => {
    setSelectedLabelIds(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Gerenciar Etiquetas - {stockItem.brand} {stockItem.model}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Labels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Etiquetas Aplicadas</CardTitle>
            </CardHeader>
            <CardContent>
              {currentLabels.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma etiqueta aplicada a este item
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentLabels.map(label => (
                    <div key={label.id} className="flex items-center gap-1">
                      <Badge 
                        style={{ backgroundColor: label.color }}
                        className="text-white pr-1"
                      >
                        {label.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-white/20"
                          onClick={() => handleRemoveLabel(label.id)}
                          disabled={isRemovingLabel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Labels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Etiquetas Disponíveis</CardTitle>
            </CardHeader>
            <CardContent>
              {unusedLabels.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Todas as etiquetas já foram aplicadas a este item
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {unusedLabels.map(label => {
                      const isSelected = selectedLabelIds.includes(label.id);
                      
                      return (
                        <Badge
                          key={label.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground' 
                              : 'hover:bg-muted'
                          }`}
                          style={{
                            borderColor: label.color,
                            ...(isSelected && { backgroundColor: label.color })
                          }}
                          onClick={() => toggleLabelSelection(label.id)}
                        >
                          {label.name}
                        </Badge>
                      );
                    })}
                  </div>

                  {selectedLabelIds.length > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        {selectedLabelIds.length} etiqueta{selectedLabelIds.length !== 1 ? 's' : ''} selecionada{selectedLabelIds.length !== 1 ? 's' : ''}
                      </span>
                      <Button
                        size="sm"
                        onClick={handleAddLabels}
                        disabled={isAddingLabel}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        {isAddingLabel ? "Aplicando..." : "Aplicar Etiquetas"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {currentLabels.length} etiqueta{currentLabels.length !== 1 ? 's' : ''} aplicada{currentLabels.length !== 1 ? 's' : ''}
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};