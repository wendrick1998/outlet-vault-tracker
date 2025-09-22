import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldX, User, Plus } from "lucide-react";
import { useReasons } from "@/hooks/useReasons";
import { useSellers } from "@/hooks/useSellers";
import { useCustomers } from "@/hooks/useCustomers";
import { useLoans } from "@/hooks/useLoans";
import { usePendingLoans } from "@/hooks/usePendingLoans";
import { useDevicesLeftAtStore } from "@/hooks/useDevicesLeftAtStore";
import { useHasPermission } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePinProtection } from "@/hooks/usePinProtection";
import { useDebounce } from "@/hooks/useDebounce";
import { SmartFormHelper } from "@/components/SmartFormHelper";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { CustomerSearchInput } from "@/components/CustomerSearchInput";
import { DeviceLeftAtStoreDialog } from "@/components/DeviceLeftAtStoreDialog";
import { PinConfirmationModal } from "@/components/PinConfirmationModal";
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
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [justification, setJustification] = useState<string>(""); // Renamed from quickNote
  const [deviceLeftQuestion, setDeviceLeftQuestion] = useState<boolean | null>(null);
  const [showDeviceLeftDialog, setShowDeviceLeftDialog] = useState(false);
  const [pendingLoanId, setPendingLoanId] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { data: hasWithdrawPermission, isLoading: loadingPermission } = useHasPermission('movements.create');
  const { reasons = [] } = useReasons();
  const { sellers = [] } = useSellers();
  const { customers = [] } = useCustomers();
  const { createLoan, isCreating } = useLoans();
  const { createPendingLoan } = usePendingLoans();
  const { createDeviceLeft } = useDevicesLeftAtStore();
  const { hasPinConfigured, checkPinConfiguration } = usePinProtection();
  
  const selectedReasonData = reasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requires_customer || false;
  
  // Verificar configuração do PIN ao montar componente
  useEffect(() => {
    checkPinConfiguration();
  }, [checkPinConfiguration]);
  
  // Lógica de cliente obrigatório baseada no motivo selecionado

  if (loadingPermission) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (!hasWithdrawPermission) {
    return (
      <Card className="p-6">
        <Alert>
          <ShieldX className="h-4 w-4" />
          <AlertDescription>
            Acesso negado: Você não tem permissão para realizar retiradas de aparelhos.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={onCancel}>
            Voltar
          </Button>
        </div>
      </Card>
    );
  }

  const isFormValid = () => {
    // Justification is always required
    if (!justification.trim()) return false;
    if (!selectedReason || !selectedSeller) return false;
    if (requiresCustomer && !useGuestCustomer && !selectedCustomer && !showQuickForm) return false;
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
        setJustification(value);
        break;
      case 'guest_customer':
        if (useGuestCustomer) {
          setGuestCustomer(value);
        }
        break;
      default:
        
    }
  };

  const getFormData = () => ({
    reason_id: selectedReason,
    seller_id: selectedSeller,
    customer_id: useGuestCustomer ? null : selectedCustomer,
    guest_customer: useGuestCustomer ? guestCustomer : null,
    notes: justification,
    requires_customer: requiresCustomer,
    use_guest_customer: useGuestCustomer
  });

  const handleCustomerCreated = (customerId: string) => {
    setSelectedCustomer(customerId);
    setShowQuickForm(false);
    
    // Check if customer has incomplete data for pendency creation later
    const customer = customers.find(c => c.id === customerId);
    if (customer?.pending_data) {
      toast({
        title: "Cliente cadastrado com pendências",
        description: "Complete os dados do cliente posteriormente na seção de pendências.",
        variant: "default"
      });
    }
  };

  const handleSkipCustomerRegistration = () => {
    // Create loan without customer but create a pending entry
    const loanData = {
      item_id: item.id,
      reason_id: selectedReason,
      seller_id: selectedSeller,
      customer_id: null,
      notes: justification.trim() || null,
    };

    createLoan(loanData, {
      onSuccess: (loan) => {
        setPendingLoanId(loan.id);
        
        // Create pending loan entry
        const pendingData = {
          loan_id: loan.id,
          item_id: item.id,
          pending_type: 'incomplete_customer_data' as const,
          created_by: user?.id || loan.id,
          notes: 'Cliente será cadastrado posteriormente'
        };

        createPendingLoan(pendingData);
        
        // Ask about device left at store
        if (deviceLeftQuestion === null) {
          setDeviceLeftQuestion(true);
          return;
        }
        
        if (deviceLeftQuestion === true) {
          setShowDeviceLeftDialog(true);
          return;
        }
        
        toast({
          title: "Empréstimo registrado",
          description: `${item.model} saiu do cofre. Complete as pendências posteriormente.`,
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

  const handleSubmit = useDebounce(async () => {
    if (isSubmitting) return;
    // Validation with improved messages
    if (!justification.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "A justificativa da saída é sempre obrigatória",
        variant: "destructive"
      });
      return;
    }

    if (!selectedReason || !selectedSeller) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o motivo e o vendedor responsável",
        variant: "destructive"
      });
      return;
    }

    // If requires customer but none selected and not using quick form
    if (requiresCustomer && !selectedCustomer && !useGuestCustomer && !showQuickForm) {
      toast({
        title: "Cliente obrigatório",
        description: "Para empréstimos, selecione um cliente ou cadastre um novo",
        variant: "destructive"
      });
      return;
    }

    // If using guest customer but no name provided
    if (requiresCustomer && useGuestCustomer && !guestCustomer.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome do cliente avulso",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Verificar se PIN está configurado
    if (hasPinConfigured === false) {
      toast({
        title: "PIN não configurado",
        description: "Configure seu PIN operacional nas configurações antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    // Mostrar modal PIN para confirmação
    setShowPinModal(true);
  }, 500);

  const executeOutflow = async () => {
    try {
      console.log("🚀 Iniciando saída do cofre:", {
        item: item.id,  
        itemModel: item.model,
        itemStatus: item.status,
        reason: selectedReason,
        seller: selectedSeller,
        customer: selectedCustomer,
        useGuestCustomer: useGuestCustomer,
        guestCustomer: guestCustomer,
        justification: justification
      });

      // Validações extras antes de criar empréstimo
      if (item.status !== 'available') {
        toast({
          title: "❌ Item Indisponível",
          description: `Este item está com status "${item.status}" e não pode sair do cofre.`,
          variant: "destructive"
        });
        return;
      }

      const loanData = {
        item_id: item.id,
        reason_id: selectedReason,
        seller_id: selectedSeller,
        customer_id: useGuestCustomer ? null : (selectedCustomer || null),
        notes: justification.trim() || null,
      };

      console.log("📋 Dados do empréstimo:", loanData);

      await createLoan(loanData);
      
      console.log("✅ Empréstimo criado com sucesso");
      
      toast({
        title: "✅ Saída Registrada",
        description: `${item.model} saiu do cofre com sucesso`,
      });
      
      onComplete();
    } catch (error: any) {
      console.error("❌ Erro na criação do empréstimo:", error);
      
      let errorMessage = "Falha ao processar saída. Tente novamente.";
      
      if (error?.message?.includes('DUPLICATE_LOAN')) {
        errorMessage = "Este aparelho já possui um empréstimo ativo.";
      } else if (error?.message?.includes('permission')) {
        errorMessage = "Você não tem permissão para realizar esta operação.";
      } else if (error?.message?.includes('PIN')) {
        errorMessage = "Erro com PIN operacional. Verifique as configurações.";
      } else if (error?.message?.includes('stock_status') || error?.message?.includes('type') && error?.message?.includes('does not exist')) {
        errorMessage = "Erro interno do sistema corrigido. Tente novamente em alguns segundos.";
      }
      
      toast({
        title: "❌ Erro na Saída",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeviceLeftSubmit = (data: { deviceInfo: string; imei?: string; notes: string }) => {
    if (!pendingLoanId) return;
    
    createDeviceLeft({
      loan_id: pendingLoanId,
      model: data.deviceInfo,
      imei: data.imei || null,
      reason: data.notes,
      created_by: user?.id || '',
    }, {
      onSuccess: () => {
        handleDeviceLeftRegistered();
      },
      onError: () => {
        toast({
          title: "Erro ao registrar aparelho",
          description: "Não foi possível registrar o aparelho deixado.",
          variant: "destructive"
        });
      }
    });
  };

  const handleDeviceLeftRegistered = () => {
    setShowDeviceLeftDialog(false);
    toast({
      title: "Saída registrada",
      description: `${item.model} saiu do cofre com sucesso`,
    });
    onComplete();
  };

  const handleDeviceLeftSkip = () => {
    setShowDeviceLeftDialog(false);
    toast({
      title: "Saída registrada", 
      description: `${item.model} saiu do cofre com sucesso`,
    });
    onComplete();
  };

  const getCustomerDisplayName = () => {
    if (useGuestCustomer) return guestCustomer;
    const customer = customers.find(c => c.id === selectedCustomer);
    return customer?.name || '';
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

        {/* Justification */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="justification">Justificativa da Saída *</Label>
          <Textarea
            id="justification"
            placeholder="Descreva o motivo da saída..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Reason selection */}
        <div className="space-y-2 mb-6">
          <Label>Motivo da Saída *</Label>
          <ScrollArea className="h-20">
            <div className="flex flex-wrap gap-2">
              {reasons.map((reason) => (
                <Badge
                  key={reason.id}
                  variant={selectedReason === reason.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedReason(reason.id)}
                >
                  {reason.name}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Seller selection */}
        <div className="space-y-2 mb-6">
          <Label>Vendedor Responsável *</Label>
          <ScrollArea className="h-20">
            <div className="flex flex-wrap gap-2">
              {sellers.map((seller) => (
                <Button
                  key={seller.id}
                  variant={selectedSeller === seller.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSeller(seller.id)}
                >
                  {seller.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Customer section - only show if required */}
        {requiresCustomer && (
          <div className="space-y-4 mb-6">
            <Label>Cliente {requiresCustomer && "*"}</Label>
            
            {!useGuestCustomer ? (
              <div className="space-y-3">
                <CustomerSearchInput
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  onNewCustomer={() => setShowQuickForm(true)}
                  placeholder="Buscar cliente..."
                />
                
                <div className="flex items-center gap-2">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setUseGuestCustomer(true)}
                    className="text-xs"
                  >
                    <User className="w-3 h-3 mr-1" />
                    Cliente Avulso
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowQuickForm(true)}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Cadastrar Novo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome do cliente avulso..."
                  value={guestCustomer}
                  onChange={(e) => setGuestCustomer(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setUseGuestCustomer(false);
                    setGuestCustomer("");
                  }}
                >
                  Cancelar
                </Button>
              </div>
            )}

            {/* Selected customer display - secure */}
            {!useGuestCustomer && selectedCustomer && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {customers.find(c => c.id === selectedCustomer)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Cliente selecionado para empréstimo
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomer("")}
                  >
                    Alterar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Device left question - only for loans */}
        {requiresCustomer && (selectedCustomer || useGuestCustomer) && deviceLeftQuestion === null && (
          <div className="mb-6 p-4 border rounded-lg bg-blue-50/50">
            <p className="font-medium mb-3">O cliente deixou algum aparelho na loja?</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => setDeviceLeftQuestion(true)}
                variant="outline"
              >
                Sim
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setDeviceLeftQuestion(false)}
                variant="outline"
              >
                Não
              </Button>
            </div>
          </div>
        )}

        {/* Show answer */}
        {deviceLeftQuestion !== null && (
          <div className="text-sm p-3 rounded-lg bg-muted/30">
            <p>
              <span className="font-medium">Aparelho deixado na loja:</span>{" "}
              <span className={deviceLeftQuestion ? "text-blue-600" : "text-gray-600"}>
                {deviceLeftQuestion ? "Sim" : "Não"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeviceLeftQuestion(null)}
                className="ml-2 h-6 px-2 text-xs"
              >
                Alterar
              </Button>
            </p>
          </div>
        )}
      </Card>

      {/* Smart Form Helper - IA Integration */}
      <SmartFormHelper
        item={item}
        formData={getFormData()}
        onSuggestionApply={handleSuggestionApply}
        context="outflow_form"
      />

      {/* Actions */}
      <div className={`flex gap-3 ${isMobile ? 'flex-col' : ''}`}>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className={`${isMobile ? 'w-full h-14 text-base order-2' : 'flex-1 h-12'}`}
          disabled={isCreating}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          className={`bg-primary hover:bg-primary-hover ${isMobile ? 'w-full h-14 text-base order-1' : 'flex-1 h-12'}`}
          disabled={isCreating || !isFormValid() || isSubmitting}
        >
          {isCreating || isSubmitting ? "Registrando..." : "Confirmar Saída"}
        </Button>
      </div>

      {/* Quick Customer Form */}
      <QuickCustomerForm
        open={showQuickForm && requiresCustomer}
        onOpenChange={setShowQuickForm}
        onCustomerCreated={handleCustomerCreated}
        onSkip={handleSkipCustomerRegistration}
      />

      {/* Device Left At Store Dialog */}
      {pendingLoanId && (
        <DeviceLeftAtStoreDialog
          open={showDeviceLeftDialog}
          onOpenChange={setShowDeviceLeftDialog}
          loanId={pendingLoanId}
          onDeviceRegistered={handleDeviceLeftRegistered}
        />
      )}

      {/* PIN Confirmation Modal */}
      <PinConfirmationModal
        isOpen={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setIsSubmitting(false);
        }}
        onConfirm={() => {
          setShowPinModal(false);
          executeOutflow();
        }}
        actionType="outflow"
        title="Confirmar Saída do Aparelho"
        description={`Digite seu PIN para confirmar a saída do aparelho ${item.model} - ${item.imei}.`}
      />
    </div>
  );
};