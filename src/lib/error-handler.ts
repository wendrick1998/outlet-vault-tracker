import { logger } from './logger';

// Environment detection inline to avoid circular dependencies
const isProduction = import.meta.env.PROD && typeof window !== 'undefined' && 
  !window.location.hostname.startsWith('preview--');

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logLevel?: 'error' | 'warn' | 'info';
  toastTitle?: string;
  toastDescription?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorHandler {
  /**
   * Centraliza tratamento de erros com logging e notificação
   */
  static handle(error: Error | unknown, options: ErrorHandlerOptions = {}) {
    const {
      showToast = true,
      logLevel = 'error',
      toastTitle,
      toastDescription,
      source = 'app',
      metadata = {}
    } = options;

    // Extrair informações do erro
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Log estruturado
    const logData = {
      name: errorName,
      message: errorMessage,
      stack: errorStack,
      ...metadata
    };

    switch (logLevel) {
      case 'error':
        logger.error(`Error in ${source}`, logData, source);
        break;
      case 'warn':
        logger.warn(`Warning in ${source}`, logData, source);
        break;
      case 'info':
        logger.info(`Info in ${source}`, logData, source);
        break;
    }

    // Toast notification (apenas se showToast = true)
    if (showToast && typeof window !== 'undefined') {
      return {
        toastTitle: toastTitle || 'Erro',
        toastDescription: toastDescription || errorMessage,
        variant: 'destructive' as const
      };
    }

    return null;
  }

  /**
   * Helper para criar config de toast (sem dependência circular)
   */
  static createToastConfig(error: Error | unknown, options: ErrorHandlerOptions = {}) {
    return this.handle(error, options);
  }

  /**
   * Handler para mutations do React Query
   */
  static mutationErrorHandler(operation: string, source?: string) {
    return (error: Error | unknown) => {
      return this.handle(error, {
        showToast: true,
        toastTitle: `Erro ao ${operation}`,
        source: source || 'mutation',
        metadata: { operation }
      });
    };
  }

  /**
   * Handler para queries do React Query
   */
  static queryErrorHandler(operation: string, source?: string) {
    return (error: Error | unknown) => {
      return this.handle(error, {
        showToast: false, // Queries geralmente não precisam de toast
        logLevel: 'warn',
        source: source || 'query',
        metadata: { operation }
      });
    };
  }
}

// Export convenience functions
export const handleError = ErrorHandler.handle;
export const createToastConfig = ErrorHandler.createToastConfig;
export const mutationErrorHandler = ErrorHandler.mutationErrorHandler;
export const queryErrorHandler = ErrorHandler.queryErrorHandler;

// Success handler para padronizar mensagens de sucesso
export interface SuccessHandlerOptions {
  showToast?: boolean;
  toastTitle?: string;
  toastDescription?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export const handleSuccess = (message: string, options: SuccessHandlerOptions = {}) => {
  const {
    showToast = true,
    toastTitle,
    toastDescription,
    source = 'app',
    metadata = {}
  } = options;

  // Log success
  logger.info(`Success in ${source}: ${message}`, metadata, source);

  // Toast notification
  if (showToast && typeof window !== 'undefined') {
    return {
      toastTitle: toastTitle || 'Sucesso',
      toastDescription: toastDescription || message,
      variant: 'default' as const
    };
  }

  return null;
};