import { Trash2, Package, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface BatchItemListProps {
  items: InventoryItem[];
  onRemoveItem: (imei: string) => void;
  onClearAll: () => void;
  onProceed: () => void;
}

export const BatchItemList = ({ items, onRemoveItem, onClearAll, onProceed }: BatchItemListProps) => {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Itens Selecionados</h3>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? 'item pronto' : 'itens prontos'} para saída
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Limpar Todos
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.imei}
              className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <div>
                  <h4 className="font-medium">{item.model}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.color} • ...{item.imei.slice(-5)}
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.imei)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            onClick={onProceed}
            className="flex-1 h-12 bg-primary hover:bg-primary-hover"
            disabled={items.length === 0}
          >
            <ArrowRight className="h-5 w-5 mr-2" />
            Prosseguir com {items.length} {items.length === 1 ? 'Item' : 'Itens'}
          </Button>
        </div>
      </div>
    </Card>
  );
};