/**
 * Substituto seguro para console em produção
 * Protege logs sensíveis e redireciona para sistema de logging estruturado
 */

import { logger } from './logger';
import { isProduction } from './environment';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface SafeConsoleOptions {
  component?: string;
  force?: boolean; // Force log even in production
  metadata?: Record<string, unknown>;
}

class SafeConsole {
  private shouldLog(level: LogLevel, force = false): boolean {
    if (force) return true;
    if (!isProduction) return true;
    
    // Em produção, apenas warn e error
    return level === 'warn' || level === 'error';
  }

  debug(message: string, data?: unknown, options: SafeConsoleOptions = {}) {
    const { component, force = false, metadata } = options;
    
    if (this.shouldLog('debug', force)) {
      // Em desenvolvimento, usar console nativo
      if (!isProduction) {
        console.debug(`[${component || 'App'}] ${message}`, data || '');
      }
      
      // Logger estruturado
      logger.debug(message, { data, ...metadata }, component);
    }
  }

  info(message: string, data?: unknown, options: SafeConsoleOptions = {}) {
    const { component, force = false, metadata } = options;
    
    if (this.shouldLog('info', force)) {
      if (!isProduction) {
        console.info(`[${component || 'App'}] ${message}`, data || '');
      }
      
      logger.info(message, { data, ...metadata }, component);
    }
  }

  warn(message: string, data?: unknown, options: SafeConsoleOptions = {}) {
    const { component, force = false, metadata } = options;
    
    if (this.shouldLog('warn', force)) {
      if (!isProduction) {
        console.warn(`[${component || 'App'}] ${message}`, data || '');
      }
      
      logger.warn(message, { data, ...metadata }, component);
    }
  }

  error(message: string, data?: unknown, options: SafeConsoleOptions = {}) {
    const { component, force = false, metadata } = options;
    
    if (this.shouldLog('error', force)) {
      if (!isProduction) {
        console.error(`[${component || 'App'}] ${message}`, data || '');
      }
      
      logger.error(message, { data, ...metadata }, component);
    }
  }

  // Método para migração automática de console.* existentes
  log(message: string, data?: unknown, options: SafeConsoleOptions = {}) {
    this.info(message, data, options);
  }
}

// Instância singleton
export const safeConsole = new SafeConsole();

// Export direto das funções para facilitar migração
export const { debug, info, warn, error, log } = safeConsole;

// Helper para substituir console.* em migrações
export const replaceConsole = (component: string) => ({
  debug: (message: string, data?: unknown) => debug(message, data, { component }),
  info: (message: string, data?: unknown) => info(message, data, { component }),
  warn: (message: string, data?: unknown) => warn(message, data, { component }),
  error: (message: string, data?: unknown) => error(message, data, { component }),
  log: (message: string, data?: unknown) => log(message, data, { component }),
});