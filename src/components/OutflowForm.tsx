import { useState } from "react";
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
import { SmartFormHelper } from "@/components/SmartFormHelper";
import { QuickCustomerForm } from "@/components/QuickCustomerForm";
import { CustomerSearchInput } from "@/components/CustomerSearchInput";
import { DeviceLeftAtStoreDialog } from "@/components/DeviceLeftAtStoreDialog";
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
  
  const selectedReasonData = reasons.find(r => r.id === selectedReason);
  const requiresCustomer = selectedReasonData?.requires_customer || false;

  // Permission check
  if (loadingPermission) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasWithdrawPermission) {
    return (
      <Card className="p-6">
        <Alert className="border-destructive bg-destructive/10">
          <ShieldX className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive font-medium">
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
        console.log('Unknown field:', field, value);
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

  const handleSubmit = async () => {
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

    const loanData = {
      item_id: item.id,
      reason_id: selectedReason,
      seller_id: selectedSeller,
      customer_id: useGuestCustomer ? null : (selectedCustomer || null),
      notes: justification.trim() || null,
    };

    createLoan(loanData, {
      onSuccess: (loan) => {
        setPendingLoanId(loan.id);
        
        // For loans with customers, ask about device left at store
        if (requiresCustomer && (selectedCustomer || useGuestCustomer)) {
          // Show device left question first
          if (deviceLeftQuestion === null) {
            setDeviceLeftQuestion(true);
            return;
          }
        }
        
        // If answered yes to device left question, show dialog
        if (deviceLeftQuestion === true) {
          setShowDeviceLeftDialog(true);
          return;
        }
        
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
          <ScrollArea className="h-auto max-h-24">
            <div className="flex flex-wrap gap-2 p-1">
              {reasons.filter(r => r.is_active).map((reason) => (
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
          </ScrollArea>
        </div>

        {/* Seller selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Vendedor Responsável *</label>
          <ScrollArea className="h-auto max-h-48">
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
          </ScrollArea>
        </div>

        {/* Customer selection (if required) */}
        {requiresCustomer && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Cliente *</label>
            
            <div className="flex gap-2 mb-3">
              <Button
                variant={!useGuestCustomer && !showQuickForm ? "default" : "outline"}
                onClick={() => { setUseGuestCustomer(false); setShowQuickForm(false); }}
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Buscar Cliente
              </Button>
              <Button
                variant={useGuestCustomer && !showQuickForm ? "default" : "outline"}
                onClick={() => { setUseGuestCustomer(true); setShowQuickForm(false); }}
                size="sm"
              >
                Cliente Avulso
              </Button>
            </div>

            {!useGuestCustomer && !showQuickForm ? (
              <div className="space-y-2">
                <CustomerSearchInput
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  onNewCustomer={() => setShowQuickForm(true)}
                  placeholder="Pesquisar por nome, CPF ou telefone..."
                />
                {selectedCustomer && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                    ✓ Cliente selecionado
                  </div>
                )}
              </div>
            ) : showQuickForm ? (
              <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  Clique no botão "Confirmar Saída" para abrir o formulário de cadastro rápido
                </p>
              </div>
            ) : (
              <Input
                type="text"
                placeholder="Nome do cliente avulso..."
                value={guestCustomer}
                onChange={(e) => setGuestCustomer(e.target.value)}
                className={`w-full ${isMobile ? 'h-14 text-base' : 'h-12'}`}
              />
            )}
          </div>
        )}

        {/* Justification - Always required */}
        <div className="space-y-3">
          <Label htmlFor="justification" className="text-sm font-medium">
            Justificativa *
            <span className="text-xs text-muted-foreground ml-1">(sempre obrigatória)</span>
          </Label>
          <Textarea
            id="justification"
            placeholder="Justifique a saída deste aparelho..."
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className={!justification.trim() ? "border-amber-300 bg-amber-50" : ""}
          />
          {!justification.trim() && (
            <p className="text-xs text-amber-600">⚠️ Justificativa é obrigatória para todas as saídas</p>
          )}
        </div>

        {/* Device left at store question */}
        {requiresCustomer && (selectedCustomer || useGuestCustomer) && deviceLeftQuestion === null && (
          <div className="space-y-3 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium text-blue-800">
              Verificação de Aparelho
            </Label>
            <p className="text-sm text-blue-700">
              O cliente está deixando algum aparelho na loja?
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeviceLeftQuestion(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Sim
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeviceLeftQuestion(false)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
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
          onClick={() => {
            if (requiresCustomer && showQuickForm) {
              setShowQuickForm(true);
            } else {
              handleSubmit();
            }
          }}
          className={`bg-primary hover:bg-primary-hover ${isMobile ? 'w-full h-14 text-base order-1' : 'flex-1 h-12'}`}
          disabled={isCreating || !isFormValid()}
        >
          {isCreating ? "Registrando..." : "Confirmar Saída"}
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
    </div>
  );
};