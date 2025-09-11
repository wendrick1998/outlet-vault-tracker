import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Package, Users, FileText } from "lucide-react";
import { useActiveReasons } from "@/hooks/useReasons";
import { useActiveSellers } from "@/hooks/useSellers";
import { useCustomers } from "@/hooks/useCustomers";
import { useLoans } from "@/hooks/useLoans";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type InventoryItem = Database['public']['Tables']['inventory']['Row'];

interface BatchOutflowFormProps {
  items: InventoryItem[];
  onComplete: () => void;
  onCancel: () => void;
}

export const BatchOutflowForm = ({ items, onComplete, onCancel }: BatchOutflowFormProps) => {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [selectedSeller, setSelectedSeller] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [quickNote, setQuickNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { data: reasons = [] } = useActiveReasons();
  const { data: sellers = [] } = useActiveSellers();
  const { data: customers = [] } = useCustomers();
  const { createLoan } = useLoans();
  
  const selectedReasonData = reasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requires_customer || false;

  const isFormValid = () => {
    if (!selectedReason || !selectedSeller) return false;
    if (requiresCustomer && !selectedCustomer) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create loans for all items
      await Promise.all(items.map(item => 
        createLoan({
          item_id: item.id,
          reason_id: selectedReason,
          seller_id: selectedSeller,
          customer_id: selectedCustomer || undefined,
          notes: quickNote || undefined,
        })
      ));

      toast({
        title: "Saída em lote registrada",
        description: `${items.length} ${items.length === 1 ? 'item saiu' : 'itens saíram'} do cofre com sucesso`,
      });
      
      onComplete();
    } catch (error) {
      toast({
        title: "Erro ao registrar saída",
        description: "Não foi possível registrar a saída em lote",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Items Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Resumo dos Itens</h3>
            <p className="text-muted-foreground">
              {items.length} {items.length === 1 ? 'item será registrado' : 'itens serão registrados'} com os mesmos dados
            </p>
          </div>
        </div>
        
        <div className="grid gap-2 max-h-48 overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.imei}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
            >
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
          ))}
        </div>
      </Card>

      {/* Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Dados da Saída</h3>
            <p className="text-muted-foreground">Estes dados serão aplicados a todos os itens</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Reason selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Motivo da Saída *</label>
            <div className="flex flex-wrap gap-2">
              {reasons.map((reason) => (
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
            </div>
          )}

          {/* Quick note */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Observação Geral (opcional)</label>
            <Textarea
              placeholder="Adicione uma observação que será aplicada a todos os itens..."
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          Voltar à Seleção
        </Button>
        <Button 
          onClick={handleSubmit}
          className="flex-1 h-12 bg-primary hover:bg-primary-hover"
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? "Registrando..." : `Confirmar Saída de ${items.length} ${items.length === 1 ? 'Item' : 'Itens'}`}
        </Button>
      </div>
    </div>
  );
};