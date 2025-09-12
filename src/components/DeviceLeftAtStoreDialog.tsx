import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDevicesLeftAtStore } from "@/hooks/useDevicesLeftAtStore";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface DeviceLeftAtStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  onDeviceRegistered?: () => void;
}

export const DeviceLeftAtStoreDialog = ({
  open,
  onOpenChange,
  loanId,
  onDeviceRegistered
}: DeviceLeftAtStoreDialogProps) => {
  const [formData, setFormData] = useState({
    model: "",
    imei: "",
    reason: ""
  });
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { createDeviceLeft, isCreating } = useDevicesLeftAtStore();

  const resetForm = () => {
    setFormData({
      model: "",
      imei: "",
      reason: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Usuário não encontrado",
        variant: "destructive"
      });
      return;
    }

    // Check if at least one field is filled
    const hasAnyData = formData.model.trim() || formData.imei.trim() || formData.reason.trim();
    
    try {
      await createDeviceLeft({
        loan_id: loanId,
        model: formData.model.trim() || null,
        imei: formData.imei.trim() || null,
        reason: formData.reason.trim() || null,
        created_by: user.id
      });

      // If data is incomplete, it will automatically create a pending entry via the service
      if (!hasAnyData || !formData.model.trim() || !formData.imei.trim() || !formData.reason.trim()) {
        toast({
          title: "Aparelho registrado com pendência",
          description: "Complete as informações posteriormente na seção de pendências.",
          variant: "default"
        });
      }

      onDeviceRegistered?.();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error registering device left at store:', error);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aparelho Deixado na Loja</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Modelo</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="Ex: iPhone 13 Pro Max"
            />
          </div>

          {/* IMEI */}
          <div className="space-y-2">
            <Label htmlFor="imei">IMEI</Label>
            <Input
              id="imei"
              value={formData.imei}
              onChange={(e) => setFormData(prev => ({ ...prev, imei: e.target.value }))}
              placeholder="IMEI do aparelho"
              maxLength={15}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Por que o cliente deixou este aparelho?"
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Informação:</p>
            <p>Campos não preenchidos gerarão pendências para regularização posterior.</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isCreating}
            >
              {isCreating ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};