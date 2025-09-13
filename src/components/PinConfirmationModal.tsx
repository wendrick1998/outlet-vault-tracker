import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { usePinProtection } from '@/hooks/usePinProtection';

interface PinConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  actionType?: 'outflow' | 'return' | 'operation';
}

export const PinConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  description,
  actionType = 'operation'
}: PinConfirmationModalProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { validatePin, isValidating } = usePinProtection();

  // Reset estado quando modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const getActionDetails = () => {
    switch (actionType) {
      case 'outflow':
        return {
          title: title || 'Confirmar Saída de Aparelhos',
          description: description || 'Digite seu PIN operacional para confirmar a retirada dos aparelhos do cofre.',
          icon: '📦'
        };
      case 'return':
        return {
          title: title || 'Confirmar Devolução',
          description: description || 'Digite seu PIN operacional para confirmar a devolução do aparelho.',
          icon: '🔄'
        };
      default:
        return {
          title: title || 'Confirmar Operação',
          description: description || 'Digite seu PIN operacional para confirmar esta operação.',
          icon: '🔐'
        };
    }
  };

  const actionDetails = getActionDetails();

  const handlePinChange = (value: string) => {
    setPin(value);
    setError('');
  };

  const handleConfirm = async () => {
    if (pin.length !== 4) {
      setError('PIN deve ter 4 dígitos.');
      return;
    }

    const isValid = await validatePin(pin);
    if (isValid) {
      onConfirm();
      onClose();
    } else {
      setPin('');
      setError('PIN inválido. Tente novamente.');
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && pin.length === 4) {
      handleConfirm();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, pin]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {actionDetails.title}
          </DialogTitle>
          <DialogDescription>
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ícone da operação */}
          <div className="text-center">
            <div className="text-4xl mb-2">{actionDetails.icon}</div>
          </div>

          {/* Input do PIN */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-4">
                Digite seu PIN operacional:
              </p>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  render={({ slots }) => (
                    <InputOTPGroup>
                      {slots.map((slot, index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          {...slot}
                          className="w-12 h-12 text-lg"
                        />
                      ))}
                    </InputOTPGroup>
                  )}
                />
              </div>
            </div>

            {/* Mostrar erro se houver */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isValidating}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={pin.length !== 4 || isValidating}
              className="flex-1"
            >
              {isValidating ? 'Validando...' : 'Confirmar'}
            </Button>
          </div>

          {/* Informação sobre segurança */}
          <div className="text-xs text-muted-foreground text-center">
            <p>
              <Shield className="h-3 w-3 inline mr-1" />
              Esta operação requer confirmação por motivos de segurança
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};