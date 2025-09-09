import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Package, Users, FileText } from "lucide-react";
import { mockReasons, mockSellers, mockCustomers, MockInventory } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

interface BatchOutflowFormProps {
  items: MockInventory[];
  onComplete: () => void;
  onCancel: () => void;
}

export const BatchOutflowForm = ({ items, onComplete, onCancel }: BatchOutflowFormProps) => {
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
    
    // Mock API call for batch operation
    setTimeout(() => {
      toast({
        title: "Saída em lote registrada",
        description: `${items.length} ${items.length === 1 ? 'item saiu' : 'itens saíram'} do cofre com sucesso`,
      });
      
      setIsSubmitting(false);
      onComplete();
    }, 1500);
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
                  {item.color} • ...{item.imeiSuffix5}
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