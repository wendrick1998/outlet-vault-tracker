import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { customerSchema } from "@/lib/validation";
import type { SecureCustomer } from '@/services/customerService';

interface CustomerFormDialogProps {
  customer: SecureCustomer | null;
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

  // Reset form when dialog opens/closes or customer changes
  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData({
          name: customer.name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          cpf: customer.cpf || "",
          address: customer.address || "",
          loan_limit: customer.loan_limit || 3,
          notes: customer.notes || "",
          is_registered: customer.is_registered || false
        });
      } else {
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
  }, [open, customer]);

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
          <DialogTitle>
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

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