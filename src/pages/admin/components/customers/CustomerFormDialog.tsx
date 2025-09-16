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
import { useToast } from "@/hooks/use-toast";
import { customerSchema } from "@/lib/validation";
import { Shield, Loader2 } from "lucide-react";
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
  
  const { toast } = useToast();
  const { createCustomer, updateCustomer, isCreating, isUpdating } = useCustomers();
  
  // Use secure customer data loading for administrative editing
  const { secureCustomer, isLoading: isLoadingSecureData, error: secureDataError } = useSecureCustomerEdit(customer?.id);

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
    }
  }, [open, customer, secureCustomer, isLoadingSecureData]);

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
    // Remove all non-numeric characters
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-numeric characters and limit to 11 digits
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        {/* Security Notice for editing */}
        {customer && (
          <Alert className="bg-amber-50 border-amber-200">
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-amber-800">
              <strong>Acesso Administrativo:</strong> Você está editando dados sensíveis do cliente. 
              Esta ação está sendo auditada para conformidade com LGPD.
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
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) => setFormData(prev => ({ ...prev, cpf: formatCPFInput(e.target.value) }))}
              placeholder="CPF (apenas números)"
              maxLength={11}
            />
            {errors.cpf && <p className="text-sm text-destructive">{errors.cpf}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
              placeholder="Telefone (apenas números)"
              maxLength={11}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email do cliente"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="Endereço completo"
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
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Observações sobre o cliente"
              rows={3}
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
  );
};