import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useLoans } from '@/hooks/useLoans';
import { usePendingLoans } from '@/hooks/usePendingLoans';
import { useCustomers } from '@/hooks/useCustomers';
import { useActiveReasons } from '@/hooks/useReasons';
import { useActiveSellers } from '@/hooks/useSellers';
import { usePinProtection } from '@/hooks/usePinProtection';
import { useIsMobile } from '@/hooks/use-mobile';
import { PinConfirmationModal } from '@/components/PinConfirmationModal';
import { CustomerSearchInput } from '@/components/CustomerSearchInput';
import { QuickCustomerForm } from '@/components/QuickCustomerForm';
import { 
  CheckCircle, 
  ArrowLeft, 
  Package, 
  User, 
  Phone, 
  AlertTriangle, 
  Shield,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

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
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { createLoan } = useLoans();
  const { createPendingLoan } = usePendingLoans();
  const { customers } = useCustomers();
  const { data: reasons = [] } = useActiveReasons();
  const { data: sellers = [] } = useActiveSellers();
  const { hasPinConfigured, checkPinConfiguration } = usePinProtection();
  
  // Verificar configuração do PIN ao montar componente
  useEffect(() => {
    checkPinConfiguration();
  }, [checkPinConfiguration]);

  const selectedReasonData = reasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requires_customer || false;

  const isFormValid = () => {
    // Reason and seller are always mandatory
    if (!selectedReason || !selectedSeller) return false;
    // Customer is only mandatory when the reason requires it
    if (requiresCustomer && !selectedCustomer) return false;
    return true;
  };

  const handleCustomerCreated = (customerId: string) => {
    setSelectedCustomer(customerId);
    setShowQuickForm(false);
  };

  const handleSkipCustomer = () => {
    setShowQuickForm(false);
    if (requiresCustomer) {
      toast({
        title: "Cliente obrigatório",
        description: "O motivo selecionado requer um cliente",
        variant: "destructive"
      });
    }
  };

  const handleNewCustomer = () => {
    setShowQuickForm(true);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!hasPinConfigured) {
      toast({
        title: "PIN não configurado",
        description: "Configure seu PIN operacional nas configurações do perfil antes de prosseguir.",
        variant: "destructive",
      });
      return;
    }

    setShowPinModal(true);
  };

  const executeOutflow = async () => {
    if (!isFormValid()) {
      const missingFields = [];
      if (!selectedReason) missingFields.push("motivo");
      if (!selectedSeller) missingFields.push("vendedor");
      if (requiresCustomer && !selectedCustomer) missingFields.push("cliente");
      
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create loans for all items
      const loanPromises = items.map(async (item) => {
        const loan = await createLoan({
          item_id: item.id,
          reason_id: selectedReason,
          seller_id: selectedSeller,
          customer_id: requiresCustomer ? selectedCustomer : null,
          notes: quickNote || undefined,
        });

        // Check if customer has pending data and create pending loan if needed
        if (requiresCustomer && selectedCustomer) {
          const customer = customers.find(c => c.id === selectedCustomer);
          if (customer?.pending_data) {
            // Create pending loan for incomplete customer data
            await createPendingLoan({
              loan_id: loan.id,
              item_id: item.id,
              pending_type: 'incomplete_customer_data' as any,
              customer_name: customer.name,
              customer_cpf: customer.cpf || undefined,
              customer_phone: customer.phone || undefined,
              notes: `Cliente cadastrado com dados incompletos durante empréstimo em lote`,
              created_by: loan.seller_id // Use seller as creator
            });
          }
        }

        return loan;
      });

      await Promise.all(loanPromises);

      toast({
        title: requiresCustomer ? "✅ Empréstimos Concluídos" : "✅ Saídas Registradas",
        description: `${items.length} ${items.length === 1 ? 
          (requiresCustomer ? 'empréstimo processado' : 'saída processada') : 
          (requiresCustomer ? 'empréstimos processados' : 'saídas processadas')
        } com sucesso`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error('❌ Erro no lote:', error);
      
      let message = requiresCustomer ? "Falha ao processar empréstimos. Tente novamente." : "Falha ao processar saídas. Tente novamente.";
      
      if (error.message?.includes('DUPLICATE_LOAN')) {
        message = 'Um ou mais itens já possuem empréstimo ativo';
      } else if (error.message?.includes('permission')) {
        message = 'Você não tem permissão para criar empréstimos';
      } else if (error.message?.includes('PIN')) {
        message = 'Erro na validação do PIN';
      } else if (error.message?.includes('stock_status') || error.message?.includes('type') && error.message?.includes('does not exist')) {
        message = 'Erro interno do sistema corrigido. Tente novamente em alguns segundos.';
      }
      
      toast({
        title: requiresCustomer ? "❌ Erro nos Empréstimos" : "❌ Erro nas Saídas",
        description: message,
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
        
        <div className="max-h-48 overflow-y-auto">
          <div className="grid gap-2 p-1">
            {items.map((item, index) => (
              <div
                key={item.imei}
                className={`flex items-center gap-3 p-3 bg-muted/30 rounded-lg ${isMobile ? 'text-sm' : ''}`}
              >
                <Badge variant="outline" className={`text-xs ${isMobile ? 'min-w-[24px]' : ''}`}>
                  #{index + 1}
                </Badge>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium truncate ${isMobile ? 'text-sm' : ''}`}>{item.model}</h4>
                  <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {item.color} • ...{item.imei.slice(-5)}
                  </p>
                </div>
              </div>
            ))}
          </div>
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
          {/* Reason selection - Always mandatory */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Motivo da Saída *</label>
            <div className="max-h-24 overflow-y-auto">
              <div className="flex flex-wrap gap-2 p-1">
                {reasons.map((reason) => (
                  <Badge
                    key={reason.id}
                    variant={selectedReason === reason.id ? "default" : "outline"}
                    className={`
                      cursor-pointer px-3 py-2 text-base hover:bg-primary hover:text-primary-foreground transition-colors
                      ${isMobile ? 'min-h-[48px] text-sm' : 'min-h-[40px]'}
                      ${selectedReason === reason.id ? 'bg-primary text-primary-foreground' : ''}
                    `}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    {reason.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Seller selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Vendedor Responsável *</label>
            <div className="max-h-48 overflow-y-auto">
              <div className={`grid gap-2 p-1 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {sellers.filter(s => s.is_active).map((seller) => (
                  <Button
                    key={seller.id}
                    variant={selectedSeller === seller.id ? "default" : "outline"}
                    onClick={() => setSelectedSeller(seller.id)}
                    className={`justify-start transition-colors ${isMobile ? 'h-14 text-base' : 'h-12'}`}
                  >
                    {seller.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer selection - Only when required */}
          {requiresCustomer && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Cliente *</label>
              <CustomerSearchInput
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                onNewCustomer={handleNewCustomer}
                placeholder="Buscar cliente por nome, CPF ou telefone..."
                disabled={isSubmitting}
              />
              
              {/* Show selected customer info */}
              {selectedCustomer && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      {(() => {
                        const customer = customers.find(c => c.id === selectedCustomer);
                        if (!customer) return null;
                        
                        return (
                          <div>
                            <p className="font-medium text-sm">{customer.name}</p>
                            <div className="flex gap-2 mt-1">
                              {customer.is_registered && (
                                <Badge variant="secondary" className="text-xs">
                                  Registrado
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                Cliente válido
                              </Badge>
                              {customer.pending_data && (
                                <Badge variant="secondary" className="text-xs">
                                  ⚠️ Dados incompletos
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer("")}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
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

      {/* Quick Customer Form */}
      <QuickCustomerForm
        open={showQuickForm}
        onOpenChange={setShowQuickForm}
        onCustomerCreated={handleCustomerCreated}
        onSkip={handleSkipCustomer}
      />

      {/* Actions */}
      <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className={`${isMobile ? 'w-full h-14 text-base order-2' : 'flex-1 h-12'}`}
          disabled={isSubmitting}
        >
          Voltar à Seleção
        </Button>
        <Button 
          onClick={handleSubmit}
          className={`bg-primary hover:bg-primary-hover ${isMobile ? 'w-full h-14 text-base order-1' : 'flex-1 h-12'}`}
          disabled={!isFormValid() || isSubmitting}
        >
          {isSubmitting ? "Registrando..." : `Confirmar ${requiresCustomer ? 'Empréstimo' : 'Saída'} de ${items.length} ${items.length === 1 ? 'Item' : 'Itens'}`}
        </Button>
      </div>

      {/* PIN Confirmation Modal */}
      <PinConfirmationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onConfirm={executeOutflow}
        actionType="outflow"
        title="Confirmar Saída dos Aparelhos"
        description={`Digite seu PIN para confirmar a saída de ${items.length} aparelho(s) do cofre.`}
      />
    </div>
  );
};