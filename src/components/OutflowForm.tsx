import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useReasons } from "@/hooks/useReasons";
import { useSellers } from "@/hooks/useSellers";
import { useCustomers } from "@/hooks/useCustomers";
import { useLoans } from "@/hooks/useLoans";
import { useToast } from "@/hooks/use-toast";
import { SmartFormHelper } from "@/components/SmartFormHelper";
import type { Database } from '@/integrations/supabase/types';

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface OutflowFormProps {
  item: InventoryItem;
  onComplete: () => void;
  onCancel: () => void;
}

export const OutflowForm = ({ item, onComplete, onCancel }: OutflowFormProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [guestCustomer, setGuestCustomer] = useState<string>("");
  const [useGuestCustomer, setUseGuestCustomer] = useState(false);
  const [quickNote, setQuickNote] = useState<string>("");
  
  const { toast } = useToast();
  const { reasons = [] } = useReasons();
  const { sellers = [] } = useSellers();
  const { customers = [] } = useCustomers();
  const { createLoan, isCreating } = useLoans();
  
  const selectedReasonData = reasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requires_customer || false;

  const isFormValid = () => {
    if (!selectedReason || !selectedSeller) return false;
    if (requiresCustomer && !useGuestCustomer && !selectedCustomer) return false;
    if (requiresCustomer && useGuestCustomer && !guestCustomer.trim()) return false;
    return true;
  };

  const handleSuggestionApply = (field: string, value: any) => {
    switch (field) {
      case 'customer_id':
        if (!useGuestCustomer) {
          setSelectedCustomer(value);
        }
        break;
      case 'seller_id':
        setSelectedSeller(value);
        break;
      case 'reason_id':
        setSelectedReason(value);
        break;
      case 'notes':
        setQuickNote(value);
        break;
      case 'guest_customer':
        if (useGuestCustomer) {
          setGuestCustomer(value);
        }
        break;
      default:
        console.log('Unknown field:', field, value);
    }
  };

  const getFormData = () => ({
    reason_id: selectedReason,
    seller_id: selectedSeller,
    customer_id: useGuestCustomer ? null : selectedCustomer,
    guest_customer: useGuestCustomer ? guestCustomer : null,
    notes: quickNote,
    requires_customer: requiresCustomer,
    use_guest_customer: useGuestCustomer
  });

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const loanData = {
      item_id: item.id,
      reason_id: selectedReason,
      seller_id: selectedSeller,
      customer_id: useGuestCustomer ? null : (selectedCustomer || null),
      notes: quickNote.trim() || null,
    };

    createLoan(loanData, {
      onSuccess: () => {
        toast({
          title: "Saída registrada",
          description: `${item.model} saiu do cofre com sucesso`,
        });
        onComplete();
      },
      onError: () => {
        toast({
          title: "Erro ao registrar saída",
          description: "Ocorreu um erro. Tente novamente.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Registrar Saída</h2>
        
        {/* Item info */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold">{item.model}</h3>
          <p className="text-muted-foreground">{item.color} • ...{item.suffix || item.imei.slice(-5)}</p>
        </div>

        {/* Reason selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Motivo da Saída *</label>
          <div className="flex flex-wrap gap-2">
            {reasons.filter(r => r.is_active).map((reason) => (
              <Badge
                key={reason.id}
                variant={selectedReason === reason.id ? "default" : "outline"}
                className={`
                  cursor-pointer px-3 py-2 text-base hover:bg-primary hover:text-primary-foreground
                  ${selectedReason === reason.id ? 'bg-primary text-primary-foreground' : ''}
                `}
                onClick={() => setSelectedReason(reason.id)}
              >
                {reason.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seller selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Vendedor Responsável *</label>
          <div className="grid grid-cols-2 gap-2">
            {sellers.filter(s => s.is_active).map((seller) => (
              <Button
                key={seller.id}
                variant={selectedSeller === seller.id ? "default" : "outline"}
                onClick={() => setSelectedSeller(seller.id)}
                className="justify-start h-12"
              >
                {seller.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Customer selection (if required) */}
        {requiresCustomer && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Cliente *</label>
            
            <div className="flex gap-2 mb-3">
              <Button
                variant={!useGuestCustomer ? "default" : "outline"}
                onClick={() => setUseGuestCustomer(false)}
                size="sm"
              >
                Lista de Clientes
              </Button>
              <Button
                variant={useGuestCustomer ? "default" : "outline"}
                onClick={() => setUseGuestCustomer(true)}
                size="sm"
              >
                Cliente Avulso
              </Button>
            </div>

            {!useGuestCustomer ? (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <Button
                    key={customer.id}
                    variant={selectedCustomer === customer.id ? "default" : "outline"}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className="justify-between h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="Nome do cliente avulso..."
                value={guestCustomer}
                onChange={(e) => setGuestCustomer(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-input focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            )}
          </div>
        )}

        {/* Quick note */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Observação Rápida (opcional)</label>
          <Textarea
            placeholder="Adicione uma observação sobre esta saída..."
            value={quickNote}
            onChange={(e) => setQuickNote(e.target.value)}
            rows={3}
          />
        </div>
        </Card>

        {/* Smart Form Helper - IA Integration */}
        <SmartFormHelper
          item={item}
          formData={getFormData()}
          onSuggestionApply={handleSuggestionApply}
          context="outflow_form"
        />

        {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-12"
          disabled={isCreating}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          className="flex-1 h-12 bg-primary hover:bg-primary-hover"
          disabled={!isFormValid() || isCreating}
        >
          {isCreating ? "Registrando..." : "Confirmar Saída"}
        </Button>
      </div>
    </div>
  );
};