import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, CreditCard, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLoans } from "@/hooks/useLoans";
import { usePendingSales } from "@/hooks/usePendingSales";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InflowActionsProps {
  item: InventoryItem;
  onComplete: () => void;
  onCancel: () => void;
}

export function InflowActions({ item, onComplete, onCancel }: InflowActionsProps) {
  const [actionType, setActionType] = useState<'return' | 'sold' | null>(null);
  const [saleNumber, setSaleNumber] = useState('');
  const [canFinishWithoutNumber, setCanFinishWithoutNumber] = useState(false);
  const { updateLoan, isUpdating } = useLoans();
  const { createPendingSale, isCreating } = usePendingSales();
  const { user } = useAuth();
  const { toast } = useToast();

  // Find the active loan for this item - for now we'll simulate it
  // In a real scenario, we'd pass the loan ID or fetch it
  const loanId = "placeholder-loan-id"; // This should come from props or be fetched

  const handleAction = (type: 'return' | 'sold') => {
    setActionType(type);
  };

  const handleSubmit = async () => {
    if (!actionType) return;

    try {
      if (actionType === 'sold' && !saleNumber && !canFinishWithoutNumber) {
        // Mostrar opção de finalizar sem número
        setCanFinishWithoutNumber(true);
        return;
      }

      if (actionType === 'sold' && !saleNumber) {
        // Criar pendência e finalizar
        await createPendingSale({
          loan_id: loanId,
          item_id: item.id,
          created_by: user?.id || '',
          notes: 'Venda finalizada sem número - aguardando regularização'
        });

        // TODO: Replace with actual loan update call when loan ID is available
        console.log('Would update loan with pending sale data');

        toast({
          title: "Item marcado como vendido",
          description: "Venda criou uma pendência para regularização do número.",
          variant: "default",
        });
      } else {
        // Fluxo normal
        const notes = actionType === 'sold' 
          ? `Vendido - Venda: ${saleNumber}`
          : 'Devolvido ao cofre';

        // TODO: Replace with actual loan update call when loan ID is available  
        console.log('Would update loan with notes:', notes);

        toast({
          title: actionType === 'sold' ? "Item marcado como vendido" : "Item devolvido",
          description: `${item.imei} foi ${actionType === 'sold' ? 'marcado como vendido' : 'devolvido ao cofre'}.`,
        });
      }

      onComplete();
    } catch (error) {
      console.error('Error updating loan:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar a ação.",
        variant: "destructive",
      });
    }
  };

  if (!actionType) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              O que fazer com este item?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Item Details */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{item.brand} {item.model}</h3>
                <Badge variant="outline" className="text-warning border-warning/50">
                  Emprestado
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                IMEI: ...{item.imei.slice(-8)} • {item.color}
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={() => handleAction('return')}
                variant="outline"
                className="h-16 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="font-semibold">Devolver ao Cofre</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Item volta ao estoque disponível
                </span>
              </Button>

              <Button
                onClick={() => handleAction('sold')}
                className="h-16 flex flex-col gap-1"
                variant="default"
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="font-semibold">Marcar como Vendido</span>
                </div>
                <span className="text-xs opacity-90">
                  Item foi vendido e sai definitivamente
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {actionType === 'return' ? 'Confirmar Devolução' : 'Confirmar Venda'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Details */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold">{item.brand} {item.model}</h3>
            <p className="text-sm text-muted-foreground">
              IMEI: ...{item.imei.slice(-8)} • {item.color}
            </p>
          </div>

          {actionType === 'sold' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Número da Venda
              </label>
              <Input
                type="text"
                placeholder="Ex: V001234"
                value={saleNumber}
                onChange={(e) => {
                  setSaleNumber(e.target.value);
                  setCanFinishWithoutNumber(false);
                }}
                className="mt-2"
              />
              
              {!saleNumber && canFinishWithoutNumber && (
                <div className="mt-3 p-3 bg-muted rounded-lg border-l-4 border-warning">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-warning">Atenção: Número de venda não informado</p>
                      <p className="text-muted-foreground mt-1">
                        Ao continuar sem o número, será criada uma pendência que aparecerá no dashboard 
                        para regularização posterior.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm">
              <strong>Atenção:</strong> {actionType === 'return' 
                ? 'O item voltará ao status "Disponível" e ficará disponível para novas saídas.'
                : 'O item será marcado como "Vendido" e não poderá mais ser usado.'
              }
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setActionType(null);
                setCanFinishWithoutNumber(false);
                setSaleNumber('');
              }}
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUpdating || isCreating}
              className="flex-1"
              variant={canFinishWithoutNumber && !saleNumber ? "destructive" : "default"}
            >
              {isUpdating || isCreating ? "Processando..." : 
               canFinishWithoutNumber && !saleNumber ? "Finalizar sem Número" : "Confirmar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}