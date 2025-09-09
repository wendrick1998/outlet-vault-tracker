import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { mockReasons, mockSellers, mockCustomers, MockInventory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface OutflowFormProps {
  item: MockInventory;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  
  const selectedReasonData = mockReasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requiresCustomer || false;

  const isFormValid = () => {
    if (!selectedReason || !selectedSeller) return false;
    if (requiresCustomer && !useGuestCustomer && !selectedCustomer) return false;
    if (requiresCustomer && useGuestCustomer && !guestCustomer.trim()) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    // Mock API call
    setTimeout(() => {
      toast({
        title: "Saída registrada",
        description: `${item.model} saiu do cofre com sucesso`,
      });
      
      setIsSubmitting(false);
      onComplete();
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Registrar Saída</h2>
        
        {/* Item info */}
        <div className="mb-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold">{item.model}</h3>
          <p className="text-muted-foreground">{item.color} • ...{item.imeiSuffix5}</p>
        </div>

        {/* Reason selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Motivo da Saída *</label>
          <div className="flex flex-wrap gap-2">
            {mockReasons.map((reason) => (
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
                {reason.slaHours && (
                  <span className="ml-1 text-xs">({reason.slaHours}h)</span>
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seller selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Vendedor Responsável *</label>
          <div className="grid grid-cols-2 gap-2">
            {mockSellers.filter(s => s.active).map((seller) => (
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
                {mockCustomers.map((customer) => (
                  <Button
                    key={customer.id}
                    variant={selectedCustomer === customer.id ? "default" : "outline"}
                    onClick={() => setSelectedCustomer(customer.id)}
                    className="justify-between h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.whatsapp}</div>
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

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          className="flex-1 h-12 bg-primary hover:bg-primary-hover"
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? "Registrando..." : "Confirmar Saída"}
        </Button>
      </div>
    </div>
  );
};