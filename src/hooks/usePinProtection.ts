import { useState, useCallback, useRef } from 'react';
import { PinService, PinValidationResult, PinSetupResult } from '@/services/pinService';
import { useToast } from '@/hooks/use-toast';

interface UsePinProtectionReturn {
  isValidating: boolean;
  isSettingUp: boolean;
  hasPinConfigured: boolean | null;
  validatePin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<boolean>;
  checkPinConfiguration: (forceRefresh?: boolean) => Promise<void>;
}

export function usePinProtection(): UsePinProtectionReturn {
  const [isValidating, setIsValidating] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [hasPinConfigured, setHasPinConfigured] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  // Cache para evitar múltiplas verificações de configuração de PIN
  const pinConfigCache = useRef<{ checked: boolean; hasPin: boolean | null }>({
    checked: false,
    hasPin: null
  });

  const validatePin = useCallback(async (pin: string): Promise<boolean> => {
    setIsValidating(true);
    try {
      // Validar formato primeiro
      const formatValidation = PinService.validatePinFormat(pin);
      if (!formatValidation.valid) {
        toast({
          title: "PIN inválido",
          description: formatValidation.message,
          variant: "destructive",
        });
        return false;
      }

      // Validar no backend
      const result: PinValidationResult = await PinService.validatePin(pin);
      
      if (result.blocked) {
        toast({
          title: "Acesso bloqueado",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }

      if (result.not_configured) {
        toast({
          title: "PIN não configurado",
          description: "Configure seu PIN operacional nas configurações do perfil.",
          variant: "destructive",
        });
        return false;
      }

      if (!result.valid) {
        toast({
          title: "PIN incorreto",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao validar PIN. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [toast]);

  const setupPin = useCallback(async (pin: string): Promise<boolean> => {
    setIsSettingUp(true);
    try {
      // Validar formato primeiro
      const formatValidation = PinService.validatePinFormat(pin);
      if (!formatValidation.valid) {
        toast({
          title: "PIN inválido",
          description: formatValidation.message,
          variant: "destructive",
        });
        return false;
      }

      // Configurar no backend
      const result: PinSetupResult = await PinService.setupPin(pin);
      
      if (result.success) {
        // PIN configurado com sucesso, atualizar cache e estado
        pinConfigCache.current = { checked: true, hasPin: true };
        setHasPinConfigured(true);
        
        toast({
          title: "PIN configurado",
          description: result.message,
        });
        return true;
      } else {
        toast({
          title: "Erro ao configurar PIN",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao configurar PIN. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSettingUp(false);
    }
  }, [toast]);

  const checkPinConfiguration = useCallback(async (forceRefresh = false) => {
    // Se já verificamos antes e não é refresh forçado, usar o cache
    if (pinConfigCache.current.checked && !forceRefresh) {
      setHasPinConfigured(pinConfigCache.current.hasPin);
      return;
    }

    try {
      const hasPin = await PinService.hasPinConfigured();
      
      // Atualizar cache e estado
      pinConfigCache.current = { checked: true, hasPin };
      setHasPinConfigured(hasPin);
    } catch (error) {
      console.error('Erro ao verificar configuração do PIN:', error);
      // Se der erro, assumir que não tem PIN configurado
      pinConfigCache.current = { checked: true, hasPin: false };
      setHasPinConfigured(false);
    }
  }, []);

  return {
    isValidating,
    isSettingUp,
    hasPinConfigured,
    validatePin,
    setupPin,
    checkPinConfiguration,
  };
}