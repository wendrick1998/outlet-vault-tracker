import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, EyeOff } from 'lucide-react';
import { usePinProtection } from '@/hooks/usePinProtection';

interface PinConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PinConfigurationDialog = ({ isOpen, onClose, onSuccess }: PinConfigurationDialogProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [showPin, setShowPin] = useState(false);
  const { setupPin, isSettingUp } = usePinProtection();

  // Reset estado quando dialog abre/fecha
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setStep('setup');
    }
  }, [isOpen]);

  const handlePinComplete = (value: string) => {
    if (step === 'setup') {
      setPin(value);
      if (value.length === 4) {
        setStep('confirm');
      }
    } else {
      setConfirmPin(value);
    }
  };

  const handleConfirm = async () => {
    if (pin !== confirmPin) {
      setConfirmPin('');
      setStep('setup');
      setPin('');
      return;
    }

    const success = await setupPin(pin);
    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  const handleBack = () => {
    setConfirmPin('');
    setStep('setup');
  };

  const canProceed = step === 'setup' ? pin.length === 4 : confirmPin.length === 4;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configurar PIN Operacional
          </DialogTitle>
          <DialogDescription>
            {step === 'setup' 
              ? 'Crie um PIN de 4 dígitos para confirmar operações críticas.'
              : 'Confirme seu PIN digitando novamente.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações de segurança */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Este PIN será necessário para confirmar saídas e devoluções de aparelhos.
              Mantenha-o seguro e não compartilhe com outras pessoas.
            </AlertDescription>
          </Alert>

          {/* Input do PIN */}
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium mb-2">
                {step === 'setup' ? 'Digite seu PIN:' : 'Confirme seu PIN:'}
              </p>
              
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={step === 'setup' ? pin : confirmPin}
                  onChange={handlePinComplete}
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

              {/* Toggle para mostrar/ocultar PIN */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPin(!showPin)}
                className="mt-2 text-xs"
              >
                {showPin ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showPin ? 'Ocultar' : 'Mostrar'} PIN
              </Button>

              {/* Mostrar PIN se solicitado */}
              {showPin && (step === 'setup' ? pin : confirmPin) && (
                <p className="text-sm text-muted-foreground mt-1">
                  PIN: {step === 'setup' ? pin : confirmPin}
                </p>
              )}
            </div>

            {/* Aviso de PIN não coincidente */}
            {step === 'confirm' && confirmPin.length === 4 && pin !== confirmPin && (
              <Alert variant="destructive">
                <AlertDescription>
                  Os PINs não coincidem. Tente novamente.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            {step === 'confirm' && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                Voltar
              </Button>
            )}
            
            <Button
              onClick={step === 'setup' ? () => setStep('confirm') : handleConfirm}
              disabled={!canProceed || isSettingUp}
              className="flex-1"
            >
              {isSettingUp 
                ? 'Configurando...' 
                : step === 'setup' 
                  ? 'Continuar' 
                  : 'Confirmar PIN'
              }
            </Button>
          </div>

          {/* Dicas de segurança */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Dicas de segurança:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Evite sequências óbvias (1234, 0000, etc.)</li>
              <li>Não use datas de nascimento ou números pessoais</li>
              <li>Memorize seu PIN e não o anote em local visível</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};