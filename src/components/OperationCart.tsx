import { X, Trash2, ArrowRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface OperationCartProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onChooseAction: () => void;
}

export const OperationCart = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onChooseAction
}: OperationCartProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="text-xs">Disponível</Badge>;
      case 'loaned':
        return <Badge variant="secondary" className="text-xs">Emprestado</Badge>;
      case 'sold':
        return <Badge variant="destructive" className="text-xs">Vendido</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Carrinho de Operações</span>
            <Badge variant="secondary">
              {items.length} {items.length === 1 ? 'item' : 'itens'}
            </Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full pt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="text-muted-foreground">
                <div className="text-lg font-medium mb-2">Carrinho vazio</div>
                <p>Adicione itens da busca para realizar operações em lote</p>
              </div>
            </div>
          ) : (
            <>
              {/* Lista de itens */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {item.brand} {item.model}
                          </h4>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.color} • {item.storage} • {item.condition}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          IMEI: ...{item.suffix || item.imei?.slice(-5)}
                        </p>
                        {item.battery_pct && (
                          <p className="text-xs text-muted-foreground">
                            Bateria: {item.battery_pct}%
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              {/* Ações do carrinho */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={onClearCart}
                    className="flex-1"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                  <Button
                    onClick={onChooseAction}
                    className="flex-1"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Escolher Ação
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Selecione uma ação para aplicar a todos os {items.length} item(s)
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};