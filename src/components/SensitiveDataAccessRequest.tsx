import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SensitiveDataAccessRequestProps {
  customerId: string;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted: (sessionId: string, approvedFields: string[]) => void;
}

const SENSITIVE_FIELDS = [
  { id: 'email', label: 'Email', icon: '📧' },
  { id: 'phone', label: 'Telefone', icon: '📱' },
  { id: 'cpf', label: 'CPF', icon: '🆔' },
  { id: 'address', label: 'Endereço', icon: '🏠' },
  { id: 'notes', label: 'Notas/Observações', icon: '📝' }
];

export const SensitiveDataAccessRequest = ({
  customerId,
  customerName,
  isOpen,
  onClose,
  onAccessGranted
}: SensitiveDataAccessRequestProps) => {
  const [requestedFields, setRequestedFields] = useState<string[]>([]);
  const [businessReason, setBusinessReason] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const { toast } = useToast();

  const handleFieldChange = (fieldId: string, checked: boolean) => {
    if (checked) {
      setRequestedFields(prev => [...prev, fieldId]);
    } else {
      setRequestedFields(prev => prev.filter(id => id !== fieldId));
    }
  };

  const handleRequestAccess = async () => {
    if (requestedFields.length === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione pelo menos um campo para acessar.",
        variant: "destructive",
      });
      return;
    }

    if (!businessReason.trim()) {
      toast({
        title: "Justificativa obrigatória",
        description: "Informe o motivo comercial para acessar os dados sensíveis.",
        variant: "destructive",
      });
      return;
    }

    setIsRequesting(true);

    try {
      const { data, error } = await supabase.rpc('request_sensitive_data_access', {
        customer_id: customerId,
        requested_fields: requestedFields,
        business_reason: businessReason.trim()
      });

      if (error) throw error;

      const result = data as any; // Type assertion for RPC response
      if (result?.success) {
        toast({
          title: "Acesso autorizado",
          description: `Você tem 15 minutos para acessar os dados de ${customerName}.`,
        });

        onAccessGranted(result.session_id, result.approved_fields);
        onClose();
        
        // Reset form
        setRequestedFields([]);
        setBusinessReason('');
      } else {
        throw new Error(result?.error || 'Falha na autorização');
      }
    } catch (error) {
      console.error('Access request error:', error);
      toast({
        title: "Erro na autorização",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setRequestedFields([]);
    setBusinessReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            Acesso a Dados Sensíveis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Você está solicitando acesso a dados pessoais sensíveis de <strong>{customerName}</strong>.
              Este acesso será auditado e registrado.
            </AlertDescription>
          </Alert>

          <div>
            <Label htmlFor="business-reason">Justificativa comercial *</Label>
            <Input
              id="business-reason"
              placeholder="Ex: Processamento de empréstimo, atualização cadastral..."
              value={businessReason}
              onChange={(e) => setBusinessReason(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Campos solicitados *</Label>
            <div className="grid grid-cols-1 gap-3 mt-2">
              {SENSITIVE_FIELDS.map((field) => (
                <div key={field.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.id}
                    checked={requestedFields.includes(field.id)}
                    onCheckedChange={(checked) => 
                      handleFieldChange(field.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={field.id} className="flex items-center gap-2 cursor-pointer">
                    <span>{field.icon}</span>
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              O acesso será válido por <strong>15 minutos</strong> após a aprovação.
              Todos os acessos são registrados para auditoria.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestAccess}
              disabled={isRequesting}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isRequesting ? 'Processando...' : 'Solicitar Acesso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};