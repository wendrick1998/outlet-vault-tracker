import { supabase } from '@/integrations/supabase/client';

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
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('set_operation_pin', {
        user_id: user.user.id,
        pin: pin
      });

      if (error) throw error;

      return data as unknown as PinSetupResult;
    } catch (error) {
      console.error('Erro ao configurar PIN:', error);
      return {
        success: false,
        message: 'Erro interno ao configurar PIN.'
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
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('validate_operation_pin', {
        user_id: user.user.id,
        pin: pin
      });

      if (error) throw error;

      return data as unknown as PinValidationResult;
    } catch (error) {
      console.error('Erro ao validar PIN:', error);
      return {
        valid: false,
        message: 'Erro interno ao validar PIN.'
      };
    }
  }

  /**
   * Verifica se o usuário já tem PIN configurado
   */
  static async hasPinConfigured(): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data, error } = await supabase
        .from('profiles')
        .select('operation_pin_hash')
        .eq('id', user.user.id)
        .single();

      if (error) return false;

      return data.operation_pin_hash !== null;
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