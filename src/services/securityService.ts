import { supabase } from '@/integrations/supabase/client';
import { ProfileService } from './profileService';
import { AuditService } from './auditService';

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // em minutos
  sessionTimeout: number; // em minutos
  passwordMinLength: number;
  passwordRequireSpecialChar: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  mfaRequired: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 480, // 8 horas
  passwordMinLength: 8,
  passwordRequireSpecialChar: true,
  passwordRequireNumbers: true,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  mfaRequired: true
};

export class SecurityService {
  static async validatePassword(password: string): Promise<PasswordValidation> {
    const { data, error } = await supabase.rpc('validate_password_strength', {
      password
    });

    if (error) throw error;
    
    // Safe type checking for the response
    if (data && 
        typeof data === 'object' && 
        'valid' in data && 
        'errors' in data &&
        typeof (data as any).valid === 'boolean' &&
        Array.isArray((data as any).errors)) {
      return {
        valid: (data as any).valid,
        errors: (data as any).errors
      };
    }
    
    return { valid: false, errors: ['Erro na validação da senha'] };
  }

  static async recordLoginAttempt(success: boolean, email?: string): Promise<void> {
    await AuditService.logAction(
      success ? 'login_success' : 'login_failed',
      {
        success,
        email: email || 'unknown',
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent
      }
    );
  }

  static async isAccountLocked(userId: string): Promise<boolean> {
    const profile = await ProfileService.getProfileById(userId);
    
    if (!profile?.bloqueado_ate) return false;
    
    return new Date(profile.bloqueado_ate) > new Date();
  }

  static async lockAccount(userId: string, duration: number = DEFAULT_SECURITY_CONFIG.lockoutDuration): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + duration);

    await ProfileService.updateProfile(userId, {
      bloqueado_ate: lockUntil.toISOString(),
      tentativas_login: 0
    });

    await AuditService.logAction('account_locked', {
      user_id: userId,
      locked_until: lockUntil.toISOString(),
      duration_minutes: duration
    }, 'profiles', userId);
  }

  static async unlockAccount(userId: string): Promise<void> {
    await ProfileService.updateProfile(userId, {
      bloqueado_ate: null,
      tentativas_login: 0
    });

    await AuditService.logAction('account_unlocked', {
      user_id: userId
    }, 'profiles', userId);
  }

  static async incrementLoginAttempts(userId: string): Promise<number> {
    const profile = await ProfileService.getProfileById(userId);
    const currentAttempts = (profile?.tentativas_login || 0) + 1;

    await ProfileService.updateProfile(userId, {
      tentativas_login: currentAttempts,
      ultimo_login: new Date().toISOString()
    });

    // Se excedeu tentativas, bloquear conta
    if (currentAttempts >= DEFAULT_SECURITY_CONFIG.maxLoginAttempts) {
      await this.lockAccount(userId);
    }

    return currentAttempts;
  }

  static async resetLoginAttempts(userId: string): Promise<void> {
    await ProfileService.updateProfile(userId, {
      tentativas_login: 0,
      ultimo_login: new Date().toISOString()
    });
  }

  static async updatePasswordChangeTime(userId: string): Promise<void> {
    await ProfileService.updateProfile(userId, {
      senha_alterada_em: new Date().toISOString()
    });

    await AuditService.logAction('password_changed', {
      user_id: userId
    }, 'profiles', userId);
  }

  static async isWorkingHours(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_working_hours', {
      user_id: userId
    });

    if (error) throw error;
    return data || false;
  }

  static generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  static async saveBackupCodes(userId: string, codes: string[]): Promise<void> {
    await ProfileService.updateProfile(userId, {
      codigo_backup: codes
    });

    await AuditService.logAction('backup_codes_generated', {
      user_id: userId,
      codes_count: codes.length
    }, 'profiles', userId);
  }

  static async useBackupCode(userId: string, code: string): Promise<boolean> {
    const profile = await ProfileService.getProfileById(userId);
    const backupCodes = profile?.codigo_backup || [];

    if (!backupCodes.includes(code)) {
      return false;
    }

    // Remove o código usado
    const updatedCodes = backupCodes.filter(c => c !== code);
    await ProfileService.updateProfile(userId, {
      codigo_backup: updatedCodes
    });

    await AuditService.logAction('backup_code_used', {
      user_id: userId,
      remaining_codes: updatedCodes.length
    }, 'profiles', userId);

    return true;
  }
}