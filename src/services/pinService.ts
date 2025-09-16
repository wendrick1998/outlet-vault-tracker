import { supabase } from '@/integrations/supabase/client';

// Error interface for Supabase errors
interface SupabaseError {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
  stack?: string;
}

export interface PinValidationResult {
  valid: boolean;
  blocked?: boolean;
  not_configured?: boolean;
  message: string;
}

export interface PinSetupResult {
  success: boolean;
  message: string;
}

export class PinService {
  /**
   * Configura um novo PIN operacional para o usuário
   */
  static async setupPin(pin: string): Promise<PinSetupResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.error('PIN Setup Error: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      

      const { data, error } = await supabase.rpc('set_operation_pin', {
        user_id: user.user.id,
        pin: pin
      });

      if (error) {
        console.error('PIN Setup RPC Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      
      return data as unknown as PinSetupResult;
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError;
      console.error('PIN Setup Complete Error:', {
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint,
        code: supabaseError.code,
        stack: supabaseError.stack
      });
      
      // Retornar erro mais específico baseado no tipo
      let errorMessage = 'Erro interno ao configurar PIN.';
      
      if (supabaseError.message?.includes('PIN deve conter')) {
        errorMessage = supabaseError.message;
      } else if (supabaseError.message?.includes('PIN muito simples')) {
        errorMessage = supabaseError.message;
      } else if (supabaseError.message?.includes('Usuário não encontrado')) {
        errorMessage = 'Usuário não encontrado ou inativo.';
      } else if (supabaseError.message?.includes('Erro na criptografia')) {
        errorMessage = 'Erro na criptografia do PIN. Contate o administrador.';
      } else if (supabaseError.details) {
        errorMessage = `Erro no banco de dados: ${supabaseError.details}`;
      }

      return {
        success: false,
        message: errorMessage
      };
    }
  }

  /**
   * Valida o PIN operacional do usuário
   */
  static async validatePin(pin: string): Promise<PinValidationResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.error('PIN Validation Error: Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      

      const { data, error } = await supabase.rpc('validate_operation_pin', {
        user_id: user.user.id,
        pin: pin
      });

      if (error) {
        console.error('PIN Validation RPC Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      
      return data as unknown as PinValidationResult;
    } catch (error: unknown) {
      const supabaseError = error as SupabaseError;
      console.error('PIN Validation Complete Error:', {
        message: supabaseError.message,
        details: supabaseError.details,
        hint: supabaseError.hint,
        code: supabaseError.code,
        stack: supabaseError.stack
      });

      // Retornar erro mais específico
      let errorMessage = 'Erro interno ao validar PIN.';
      
      if (supabaseError.message?.includes('bloqueado')) {
        errorMessage = supabaseError.message;
      } else if (supabaseError.message?.includes('não foi configurado')) {
        errorMessage = 'PIN operacional não foi configurado.';
      } else if (supabaseError.details) {
        errorMessage = `Erro no banco de dados: ${supabaseError.details}`;
      }

      return {
        valid: false,
        message: errorMessage
      };
    }
  }

  /**
   * Verifica se o usuário já tem PIN configurado (com cache para performance)
   */
  static async hasPinConfigured(): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      // Usar query otimizada que só busca o campo necessário
      const { data, error } = await supabase
        .from('profiles')
        .select('operation_pin_hash')
        .eq('id', user.user.id)
        .single();

      if (error) {
        console.error('Erro ao verificar PIN configurado:', error);
        return false;
      }

      return data?.operation_pin_hash !== null;
    } catch (error) {
      console.error('Erro ao verificar PIN configurado:', error);
      return false;
    }
  }

  /**
   * Valida formato do PIN (4 dígitos)
   */
  static validatePinFormat(pin: string): { valid: boolean; message?: string } {
    if (!pin || pin.length !== 4) {
      return { valid: false, message: 'PIN deve ter exatamente 4 dígitos.' };
    }

    if (!/^\d{4}$/.test(pin)) {
      return { valid: false, message: 'PIN deve conter apenas números.' };
    }

    // Verificar PINs óbvios
    const weakPins = ['0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123', '9876'];
    if (weakPins.includes(pin)) {
      return { valid: false, message: 'PIN muito simples. Use uma combinação mais complexa.' };
    }

    return { valid: true };
  }
}