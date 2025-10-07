import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCustomers } from "@/hooks/useCustomers";
import { useSecureCustomerEdit } from "@/hooks/useSecureCustomerEdit";
import { useActiveSession } from "@/hooks/useSensitiveDataAccess";
import { useToast } from "@/hooks/use-toast";
import { customerSchema } from "@/lib/validation";
import { Shield, Loader2, Clock, ShieldAlert } from "lucide-react";
import { SensitiveDataAccessRequest } from "@/components/SensitiveDataAccessRequest";
import type { Database } from '@/integrations/supabase/types';

type Customer = Database['public']['Tables']['customers']['Row'];

interface CustomerFormDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CustomerFormDialog = ({
  customer,
  open,
  onOpenChange,
  onSuccess
}: CustomerFormDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cpf: "",
    address: "",
    loan_limit: 3,
    notes: "",
    is_registered: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAccessRequest, setShowAccessRequest] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [approvedFields, setApprovedFields] = useState<string[]>([]);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  
  const { toast } = useToast();
  const { createCustomer, updateCustomer, isCreating, isUpdating } = useCustomers();
  
  // Use secure customer data loading for administrative editing
  const { secureCustomer, isLoading: isLoadingSecureData, error: secureDataError } = useSecureCustomerEdit(customer?.id);
  const { data: activeSession } = useActiveSession(customer?.id);

  // Check for active session
  useEffect(() => {
    if (activeSession && customer) {
      setSessionId(activeSession.id);
      setApprovedFields(activeSession.approved_fields as string[]);
      setSessionExpiry(new Date(activeSession.expires_at));
    }
  }, [activeSession, customer]);

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open) {
      if (customer && secureCustomer) {
        // Use secure customer data when available
        setFormData({
          name: secureCustomer.name || "",
          phone: secureCustomer.phone || "",
          email: secureCustomer.email || "",
          cpf: secureCustomer.cpf || "",
          address: secureCustomer.address || "",
          loan_limit: secureCustomer.loan_limit || 3,
          notes: secureCustomer.notes || "",
          is_registered: secureCustomer.is_registered || false
        });
      } else if (customer && !secureCustomer && !isLoadingSecureData) {
        // For existing customers without secure data yet, show basic info
        setFormData({
          name: customer.name || "",
          phone: "", // Will be loaded securely
          email: "", // Will be loaded securely
          cpf: "",   // Will be loaded securely
          address: "", // Will be loaded securely
          loan_limit: customer.loan_limit || 3,
          notes: "",   // Will be loaded securely
          is_registered: customer.is_registered || false
        });
      } else if (!customer) {
        // Reset form for new customer
        setFormData({
          name: "",
          phone: "",
          email: "",
          cpf: "",
          address: "",
          loan_limit: 3,
          notes: "",
          is_registered: false
        });
      }
      setErrors({});
    } else {
      // Reset session state when closing
      setSessionId(null);
      setApprovedFields([]);
      setSessionExpiry(null);
    }
  }, [open, customer, secureCustomer, isLoadingSecureData]);

  const handleAccessGranted = (newSessionId: string, fields: string[]) => {
    setSessionId(newSessionId);
    setApprovedFields(fields);
    setSessionExpiry(new Date(Date.now() + 15 * 60 * 1000)); // 15 minutes
  };

  const hasSensitiveFieldAccess = (field: string) => {
    if (!customer) return true; // New customer, no restrictions
    if (!sessionId) return false; // Editing existing customer without session
    return approvedFields.includes(field);
  };

  const isSessionExpired = () => {
    if (!sessionExpiry) return false;
    return new Date() > sessionExpiry;
  };

  // Show secure data loading status
  if (customer && isLoadingSecureData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Carregando Dados Seguros
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Verificando permissões e carregando dados...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show error if secure data loading failed
  if (customer && secureDataError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Erro de Segurança
            </DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              Não foi possível carregar os dados sensíveis do cliente: {secureDataError}
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatCPFInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatPhoneInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const validateForm = () => {
    try {
      const cleanData = {
        ...formData,
        cpf: formData.cpf || undefined,
        email: formData.email || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      };
      
      customerSchema.parse(cleanData);
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        newErrors[err.path[0]] = err.message;
      });
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      cpf: formData.cpf.trim() || null,
      address: formData.address.trim() || null,
      loan_limit: formData.loan_limit,
      notes: formData.notes.trim() || null,
      is_registered: formData.is_registered
    };

    const onSuccessCallback = () => {
      toast({
        title: customer ? "Cliente atualizado" : "Cliente cadastrado",
        description: `${formData.name} foi ${customer ? "atualizado" : "cadastrado"} com sucesso`,
      });
      onSuccess();
    };

    const onErrorCallback = () => {
      toast({
        title: "Erro",
        description: `Não foi possível ${customer ? "atualizar" : "cadastrar"} o cliente`,
        variant: "destructive"
      });
    };

    if (customer) {
      updateCustomer(
        { id: customer.id, data: submitData },
        { onSuccess: onSuccessCallback, onError: onErrorCallback }
      );
    } else {
      createCustomer(submitData, {
        onSuccess: onSuccessCallback,
        onError: onErrorCallback
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              {customer ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>

          {/* Session Status Alerts */}
          {customer && !sessionId && (
            <Alert className="bg-amber-50 border-amber-200">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 space-y-2">
                <p><strong>Dados Sensíveis Protegidos:</strong></p>
                <p>Para editar dados pessoais (email, telefone, CPF, endereço, notas), você precisa solicitar acesso temporário.</p>
                <Button 
                  onClick={() => setShowAccessRequest(true)}
                  variant="outline"
                  size="sm"
                  className="mt-2 border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Solicitar Acesso
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {customer && sessionId && !isSessionExpired() && (
            <Alert className="bg-green-50 border-green-200">
              <Clock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Sessão Ativa:</strong> Acesso concedido até {sessionExpiry?.toLocaleTimeString('pt-BR')}
              </AlertDescription>
            </Alert>
          )}

          {customer && sessionId && isSessionExpired() && (
            <Alert className="bg-red-50 border-red-200">
              <ShieldAlert className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Sessão Expirada:</strong> Solicite novo acesso para editar dados sensíveis.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo do cliente"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF {customer && !hasSensitiveFieldAccess('cpf') && '🔒'}</Label>
              <Input
                id="cpf"
                value={hasSensitiveFieldAccess('cpf') ? formData.cpf : '•••.•••.•••-••'}
                onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPFInput(e.target.value) }))}
                placeholder="CPF (apenas números)"
                maxLength={11}
                disabled={customer ? !hasSensitiveFieldAccess('cpf') : false}
              />
              {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone {customer && !hasSensitiveFieldAccess('phone') && '🔒'}</Label>
              <Input
                id="phone"
                value={hasSensitiveFieldAccess('phone') ? formData.phone : '(••) •••••-••••'}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
                placeholder="Telefone (apenas números)"
                maxLength={11}
                disabled={customer ? !hasSensitiveFieldAccess('phone') : false}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email {customer && !hasSensitiveFieldAccess('email') && '🔒'}</Label>
              <Input
                id="email"
                type="email"
                value={hasSensitiveFieldAccess('email') ? formData.email : '••••••@••••.•••'}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Email do cliente"
                disabled={customer ? !hasSensitiveFieldAccess('email') : false}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço {customer && !hasSensitiveFieldAccess('address') && '🔒'}</Label>
              <Input
                id="address"
                value={hasSensitiveFieldAccess('address') ? formData.address : '•••••••••••••••'}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Endereço completo"
                disabled={customer ? !hasSensitiveFieldAccess('address') : false}
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            {/* Loan Limit */}
            <div className="space-y-2">
              <Label htmlFor="loan_limit">Limite de Empréstimos Simultâneos</Label>
              <Input
                id="loan_limit"
                type="number"
                min="1"
                max="50"
                value={formData.loan_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, loan_limit: parseInt(e.target.value) || 3 }))}
              />
              {errors.loan_limit && <p className="text-sm text-destructive">{errors.loan_limit}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações {customer && !hasSensitiveFieldAccess('notes') && '🔒'}</Label>
              <Textarea
                id="notes"
                value={hasSensitiveFieldAccess('notes') ? formData.notes : '•••••••••••••••'}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o cliente"
                rows={3}
                disabled={customer ? !hasSensitiveFieldAccess('notes') : false}
              />
              {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
            </div>

            {/* Registered Status */}
            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_registered">Cliente Registrado Oficialmente</Label>
              <Switch
                id="is_registered"
                checked={formData.is_registered}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_registered: checked }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                disabled={isCreating || isUpdating}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating
                  ? (customer ? "Atualizando..." : "Cadastrando...")
                  : (customer ? "Atualizar" : "Cadastrar")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <SensitiveDataAccessRequest
        customerId={customer?.id || ''}
        customerName={customer?.name || ''}
        isOpen={showAccessRequest}
        onClose={() => setShowAccessRequest(false)}
        onAccessGranted={handleAccessGranted}
      />
    </>
  );
};