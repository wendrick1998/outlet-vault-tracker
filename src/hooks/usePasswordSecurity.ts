import { useState, useCallback } from 'react';
import { PasswordSecurityService, type PasswordSecurityResult } from '@/services/passwordSecurityService';
import { toast } from '@/hooks/use-toast';

interface UsePasswordSecurityOptions {
  onValidationComplete?: (result: PasswordSecurityResult) => void;
  showToasts?: boolean;
}

export const usePasswordSecurity = (options: UsePasswordSecurityOptions = {}) => {
  const { onValidationComplete, showToasts = false } = options;
  const [isValidating, setIsValidating] = useState(false);
  const [lastResult, setLastResult] = useState<PasswordSecurityResult | null>(null);

  const validatePassword = useCallback(async (password: string): Promise<PasswordSecurityResult> => {
    if (!password) {
      const emptyResult: PasswordSecurityResult = {
        isValid: false,
        message: 'Senha é obrigatória',
        warnings: []
      };
      setLastResult(emptyResult);
      return emptyResult;
    }

    setIsValidating(true);
    
    try {
      const result = await PasswordSecurityService.validatePasswordSecurity(password);
      setLastResult(result);
      
      if (showToasts) {
        if (!result.isValid) {
          toast({
            variant: "destructive",
            title: "Senha rejeitada",
            description: result.message,
          });
        } else if (result.warnings.length > 0) {
          toast({
            title: "Senha aceita com avisos",
            description: result.warnings[0],
          });
        } else {
          toast({
            title: "Senha aprovada",
            description: "Senha passou em todas as verificações de segurança.",
          });
        }
      }
      
      onValidationComplete?.(result);
      return result;
    } catch (error) {
      console.error('Error validating password security:', error);
      
      const errorResult: PasswordSecurityResult = {
        isValid: true, // Fallback gracioso
        message: 'Erro na validação - senha aceita por segurança',
        warnings: ['Falha na verificação de segurança, mas senha foi aceita.']
      };
      
      if (showToasts) {
        toast({
          variant: "destructive",
          title: "Erro na validação",
          description: "Não foi possível validar a senha completamente.",
        });
      }
      
      setLastResult(errorResult);
      onValidationComplete?.(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [onValidationComplete, showToasts]);

  const validatePasswordStrengthOnly = useCallback(async (password: string) => {
    if (!password) return { isValid: false, errors: ['Senha é obrigatória'] };
    
    setIsValidating(true);
    
    try {
      const result = await PasswordSecurityService.validatePasswordStrengthOnly(password);
      return result;
    } catch (error) {
      console.error('Error validating password strength:', error);
      return {
        isValid: false,
        errors: ['Erro na validação da força da senha']
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  return {
    validatePassword,
    validatePasswordStrengthOnly,
    isValidating,
    lastResult,
    clearResult: () => setLastResult(null)
  };
};