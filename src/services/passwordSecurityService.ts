import { supabase } from '@/integrations/supabase/client';
import { useFeatureFlag } from '@/lib/features';

export interface PasswordSecurityResult {
  isValid: boolean;
  isLeaked?: boolean;
  breachCount?: number;
  message: string;
  warnings: string[];
}

export class PasswordSecurityService {
  
  /**
   * Validação completa de segurança de senha
   */
  static async validatePasswordSecurity(password: string): Promise<PasswordSecurityResult> {
    const warnings: string[] = [];
    let isValid = true;
    let message = 'Senha aprovada nas verificações de segurança.';

    try {
      // 1. Validação de força da senha (local)
      const strengthResult = await this.validatePasswordStrength(password);
      
      if (!strengthResult.isValid) {
        return {
          isValid: false,
          message: 'Senha não atende aos critérios de segurança.',
          warnings: strengthResult.errors || []
        };
      }

      // 2. Verificação de vazamentos (opcional via feature flag)
      const leakCheckEnabled = localStorage.getItem('feature_flags')?.includes('leaked_password_protection');
      
      if (leakCheckEnabled) {
        const leakResult = await this.checkPasswordLeaks(password);
        
        if (leakResult.isLeaked) {
          return {
            isValid: false,
            isLeaked: true,
            breachCount: leakResult.breachCount,
            message: leakResult.message,
            warnings: ['Senha encontrada em vazamentos de dados conhecidos.']
          };
        }
        
        if (leakResult.fallback) {
          warnings.push('Verificação de vazamentos temporariamente indisponível.');
        }
      } else {
        warnings.push('Proteção contra senhas vazadas está desabilitada.');
      }

      return {
        isValid: true,
        isLeaked: false,
        message: 'Senha aprovada em todas as verificações.',
        warnings
      };

    } catch (error) {
      console.error('Erro na validação de segurança da senha:', error);
      
      // Fallback gracioso: não bloquear usuário em caso de erro
      return {
        isValid: true,
        message: 'Verificação de segurança completada com avisos.',
        warnings: ['Algumas verificações de segurança falharam, mas a senha foi aceita.']
      };
    }
  }

  /**
   * Validação de força da senha via Supabase
   */
  private static async validatePasswordStrength(password: string): Promise<{
    isValid: boolean;
    errors: string[];
    score?: number;
  }> {
    const { data, error } = await supabase.rpc('validate_password_strength', {
      password: password
    });

    if (error) {
      console.error('Erro na validação de força da senha:', error);
      throw new Error('Falha na validação de força da senha');
    }

    // Tratar o retorno do Supabase (que pode ser Json)
    const result = data as any;
    return {
      isValid: result?.valid || false,
      errors: result?.errors || [],
      score: result?.score
    };
  }

  /**
   * Verificação de senha vazada via Edge Function
   */
  private static async checkPasswordLeaks(password: string): Promise<{
    isLeaked: boolean;
    breachCount?: number;
    message: string;
    fallback?: boolean;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('check-leaked-passwords', {
        body: { password }
      });

      if (error) {
        console.warn('Erro na verificação de vazamentos:', error);
        return {
          isLeaked: false,
          message: 'Verificação de vazamentos temporariamente indisponível.',
          fallback: true
        };
      }

      return data;
    } catch (error) {
      console.warn('Erro na comunicação com serviço de verificação:', error);
      return {
        isLeaked: false,
        message: 'Verificação de vazamentos temporariamente indisponível.',
        fallback: true
      };
    }
  }

  /**
   * Validação rápida apenas para força da senha (sem verificação de vazamentos)
   */
  static async validatePasswordStrengthOnly(password: string): Promise<{
    isValid: boolean;
    errors: string[];
    score?: number;
  }> {
    try {
      return await this.validatePasswordStrength(password);
    } catch (error) {
      console.error('Erro na validação rápida de senha:', error);
      
      // Validação local de fallback
      const errors: string[] = [];
      
      if (password.length < 8) {
        errors.push('Senha deve ter pelo menos 8 caracteres');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('Inclua letras maiúsculas');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('Inclua letras minúsculas');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('Inclua números');
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Inclua símbolos especiais');
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }
}