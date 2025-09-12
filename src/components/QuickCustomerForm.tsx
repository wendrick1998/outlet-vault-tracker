import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCustomers } from "@/hooks/useCustomers";
import { useToast } from "@/hooks/use-toast";
import { quickCustomerSchema } from "@/lib/validation";

interface QuickCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: (customerId: string) => void;
  onSkip?: () => void;
}

export const QuickCustomerForm = ({
  open,
  onOpenChange,
  onCustomerCreated,
  onSkip
}: QuickCustomerFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    phone: "",
    loan_reason: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { createCustomer, isCreating } = useCustomers();

  const formatCPFInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const formatPhoneInput = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 11);
  };

  const validateForm = () => {
    try {
      quickCustomerSchema.parse(formData);
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

    const customerData = {
      name: formData.name.trim(),
      cpf: formData.cpf.trim(),
      phone: formData.phone.trim(),
      notes: `Motivo do empréstimo: ${formData.loan_reason.trim()}`,
      is_registered: true
    };

    createCustomer(customerData, {
      onSuccess: (data) => {
        toast({
          title: "Cliente cadastrado",
          description: `${formData.name} foi cadastrado com sucesso`,
        });
        onCustomerCreated?.(data.id);
        resetForm();
        onOpenChange(false);
      },
      onError: () => {
        toast({
          title: "Erro ao cadastrar",
          description: "Não foi possível cadastrar o cliente",
          variant: "destructive"
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      cpf: "",
      phone: "",
      loan_reason: ""
    });
    setErrors({});
  };

  const handleSkip = () => {
    onSkip?.();
    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastro Rápido de Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
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
            <Label htmlFor="cpf">CPF *</Label>
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
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneInput(e.target.value) }))}
              placeholder="Telefone (apenas números)"
              maxLength={11}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>

          {/* Loan Reason */}
          <div className="space-y-2">
            <Label htmlFor="loan_reason">Motivo do Empréstimo *</Label>
            <Textarea
              id="loan_reason"
              value={formData.loan_reason}
              onChange={(e) => setFormData(prev => ({ ...prev, loan_reason: e.target.value }))}
              placeholder="Por que este cliente precisa do aparelho?"
              rows={3}
            />
            {errors.loan_reason && <p className="text-sm text-destructive">{errors.loan_reason}</p>}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isCreating}
            >
              {isCreating ? "Cadastrando..." : "Cadastrar Cliente"}
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
                disabled={isCreating}
              >
                Cadastrar Depois
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isCreating}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};