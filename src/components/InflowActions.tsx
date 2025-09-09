import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MockInventory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface InflowActionsProps {
  item: MockInventory;
  onComplete: () => void;
  onCancel: () => void;
}

export const InflowActions = ({ item, onComplete, onCancel }: InflowActionsProps) => {
  const [actionType, setActionType] = useState<'return' | 'sold' | null>(null);
  const [saleNumber, setSaleNumber] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleAction = (type: 'return' | 'sold') => {
    setActionType(type);
  };

  const handleSubmit = () => {
    if (!actionType) return;

    setIsSubmitting(true);
    
    // Mock API call
    setTimeout(() => {
      if (actionType === 'return') {
        toast({
          title: "Item devolvido",
          description: `${item.model} foi devolvido ao cofre`,
        });
      } else {
        toast({
          title: "Item marcado como vendido",
          description: `${item.model} foi marcado como vendido`,
        });
      }
      
      setIsSubmitting(false);
      onComplete();
    }, 1000);
  };

  if (!actionType) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">O que fazer com este item?</h2>
          
          {/* Item info */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold">{item.model}</h3>
            <p className="text-muted-foreground">{item.color} • ...{item.imeiSuffix5}</p>
            <div className="mt-2 text-sm">
              <span className="inline-block px-2 py-1 bg-warning/20 text-warning rounded">
                Fora do Cofre
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => handleAction('return')}
              variant="outline"
              className="w-full h-16 text-lg flex flex-col gap-1"
            >
              <span className="font-semibold">Devolver ao Cofre</span>
              <span className="text-sm text-muted-foreground">
                Item volta ao estoque normal
              </span>
            </Button>

            <Button
              onClick={() => handleAction('sold')}
              className="w-full h-16 text-lg flex flex-col gap-1 bg-success hover:bg-success/90"
            >
              <span className="font-semibold">Marcar como Vendido</span>
              <span className="text-sm opacity-90">
                Item foi vendido e sai definitivamente
              </span>
            </Button>
          </div>
        </Card>

        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full h-12"
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">
          {actionType === 'return' ? 'Confirmar Devolução' : 'Confirmar Venda'}
        </h2>
        
        {/* Item info */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold">{item.model}</h3>
          <p className="text-muted-foreground">{item.color} • ...{item.imeiSuffix5}</p>
        </div>

        {actionType === 'sold' && (
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Número da Venda (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: V001234..."
              value={saleNumber}
              onChange={(e) => setSaleNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        )}

        <div className="mt-6 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <p className="text-sm text-warning-foreground">
            {actionType === 'return' ? (
              <>
                <strong>Atenção:</strong> O item voltará ao status "No Cofre" e 
                ficará disponível para novas saídas.
              </>
            ) : (
              <>
                <strong>Atenção:</strong> O item será marcado como "Vendido" e 
                não poderá mais ser usado. Esta ação não pode ser desfeita facilmente.
              </>
            )}
          </p>
        </div>
      </Card>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setActionType(null)}
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button 
          onClick={handleSubmit}
          className={`flex-1 h-12 ${
            actionType === 'return' 
              ? 'bg-primary hover:bg-primary-hover' 
              : 'bg-success hover:bg-success/90'
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processando..." : 
           actionType === 'return' ? "Confirmar Devolução" : "Confirmar Venda"}
        </Button>
      </div>
    </div>
  );
};