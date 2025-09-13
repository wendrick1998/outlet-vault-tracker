import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { usePinProtection } from '@/hooks/usePinProtection';

interface PinConfigurationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PinConfigurationDialog = ({ isOpen, onClose, onSuccess }: PinConfigurationDialogProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const { setupPin, isSettingUp } = usePinProtection();

  // Reset estado quando dialog abre/fecha
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setShowPin(false);
      setError('');
    }
  }, [isOpen]);

  const handlePinChange = (value: string) => {
    // Aceita apenas dígitos e máximo 4 caracteres
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setPin(numericValue);
    setError('');
  };

  const handleConfirmPinChange = (value: string) => {
    // Aceita apenas dígitos e máximo 4 caracteres
    const numericValue = value.replace(/\D/g, '').slice(0, 4);
    setConfirmPin(numericValue);
    setError('');
  };

  const validatePinFormat = (pinValue: string): boolean => {
    if (pinValue.length !== 4) {
      setError('PIN deve ter exatamente 4 dígitos');
      return false;
    }

    // Verificar PINs óbvios
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876'];
    if (weakPins.includes(pinValue)) {
      setError('PIN muito simples. Use uma combinação mais complexa');
      return false;
    }

    return true;
  };

  const handleConfirm = async () => {
    setError('');

    // Validar formato do PIN
    if (!validatePinFormat(pin)) {
      return;
    }

    // Verificar se os PINs coincidem
    if (pin !== confirmPin) {
      setError('Os PINs não coincidem. Verifique e tente novamente');
      return;
    }

    // Configurar PIN
    const success = await setupPin(pin);
    if (success) {
      onSuccess?.();
      onClose();
    }
  };

  const canSubmit = pin.length === 4 && confirmPin.length === 4 && pin === confirmPin;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configurar PIN Operacional
          </DialogTitle>
          <DialogDescription>
            Crie um PIN de 4 dígitos para confirmar operações críticas como empréstimos e devoluções.
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
            <div>
              <label className="text-sm font-medium mb-2 block">
                Digite seu PIN (4 dígitos):
              </label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="text-center text-lg font-mono tracking-widest"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Confirme seu PIN:
              </label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  value={confirmPin}
                  onChange={(e) => handleConfirmPinChange(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className="text-center text-lg font-mono tracking-widest"
                />
                {pin.length === 4 && confirmPin.length === 4 && pin === confirmPin && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Mostrar PIN se solicitado */}
            {showPin && pin && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  PIN: {pin} {confirmPin && `/ Confirmação: ${confirmPin}`}
                </p>
              </div>
            )}

            {/* Exibir erro */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Botão de confirmação */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSettingUp}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit || isSettingUp}
              className="flex-1"
            >
              {isSettingUp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Configurando...
                </>
              ) : (
                'Configurar PIN'
              )}
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