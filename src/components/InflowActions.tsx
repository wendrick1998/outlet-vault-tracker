import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import type { LoanWithDetails } from "@/services/loanService";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface InflowActionsProps {
  item: InventoryItem;
  onComplete: () => void;
  onCancel: () => void;
}

// InflowActions component for handling item returns and sales
export function InflowActions({ item, onComplete, onCancel }: InflowActionsProps) {
  const [actionType, setActionType] = useState<'return' | 'sold' | null>(null);
  const [saleNumber, setSaleNumber] = useState('');
  const [canFinishWithoutNumber, setCanFinishWithoutNumber] = useState(false);
  const [activeLoan, setActiveLoan] = useState<LoanWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { returnLoan, isReturning } = useLoans();
  const { createPendingSale, isCreating } = usePendingSales();
  const { user } = useAuth();
  const { toast } = useToast();

  // Find the active loan for this item
  useEffect(() => {
    const findActiveLoan = async () => {
      try {
        const { data, error } = await supabase
          .from('loans')
          .select(`
            *,
            inventory(*),
            customer:customers(*),
            seller:sellers(*),
            reason:reasons(*)
          `)
          .eq('item_id', item.id)
          .eq('status', 'active')
          .maybeSingle();

        if (error) throw error;
        setActiveLoan(data);
      } catch (error) {
        console.error('Error finding active loan:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar empréstimo ativo do item.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    findActiveLoan();
  }, [item.id, toast]);

  const handleAction = (type: 'return' | 'sold') => {
    setActionType(type);
  };

  const handleSubmit = async () => {
    if (!actionType || !activeLoan) return;

    try {
      if (actionType === 'sold' && !saleNumber && !canFinishWithoutNumber) {
        // Mostrar opção de finalizar sem número
        setCanFinishWithoutNumber(true);
        return;
      }

      if (actionType === 'sold' && !saleNumber) {
        // Criar pendência e finalizar empréstimo
        await createPendingSale({
          loan_id: activeLoan.id,
          item_id: item.id,
          created_by: user?.id || '',
          notes: 'Venda finalizada sem número - aguardando regularização'
        });

        // Retornar empréstimo com status de venda pendente
        await returnLoan({ id: activeLoan.id, notes: 'Venda sem número - pendência criada' });

        // Atualizar status no inventário para 'sold'
        await supabase
          .from('inventory')
          .update({ status: 'sold' })
          .eq('id', item.id);

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

        // Retornar empréstimo
        await returnLoan({ id: activeLoan.id, notes });

        // Atualizar status no inventário
        const newStatus = actionType === 'sold' ? 'sold' : 'available';
        await supabase
          .from('inventory')
          .update({ status: newStatus })
          .eq('id', item.id);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Carregando informações do empréstimo...</p>
        </div>
      </div>
    );
  }

  if (!activeLoan) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Empréstimo não encontrado</h3>
        <p className="text-muted-foreground mb-4">
          Não foi encontrado um empréstimo ativo para este item.
        </p>
        <Button onClick={onCancel} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

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
              disabled={isReturning || isCreating}
              className="flex-1"
              variant={canFinishWithoutNumber && !saleNumber ? "destructive" : "default"}
            >
              {isReturning || isCreating ? "Processando..." : 
               canFinishWithoutNumber && !saleNumber ? "Finalizar sem Número" : "Confirmar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}