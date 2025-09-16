/**
 * Production Console Cleaner
 * Remove/substitui console.logs em produção por logging estruturado
 */

// Environment detection inline to avoid circular dependencies
const isPreview = typeof window !== 'undefined' && 
  window.location.hostname.startsWith('preview--');

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  component?: string;
}

class ProductionLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private shouldLog(level: LogLevel): boolean {
    if (isPreview) return true;
    // Em produção, só loggar warn/error
    return level === 'warn' || level === 'error';
  }

  private log(level: LogLevel, message: string, data?: any, component?: string) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      component,
    };

    this.logs.push(entry);
    
    // Manter apenas os últimos maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Em desenvolvimento, usar console nativo
    if (isPreview) {
      const consoleMethod = console[level] || console.log;
      if (data) {
        consoleMethod(`[${component || 'App'}] ${message}`, data);
      } else {
        consoleMethod(`[${component || 'App'}] ${message}`);
      }
    }
  }

  debug(message: string, data?: any, component?: string) {
    this.log('debug', message, data, component);
  }

  info(message: string, data?: any, component?: string) {
    this.log('info', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('warn', message, data, component);
  }

  error(message: string, data?: any, component?: string) {
    this.log('error', message, data, component);
    
    // Em produção, enviar errors para serviço de monitoramento
    if (!isPreview) {
      // TODO: Integrar com Sentry/LogRocket/similar
      this.reportError(message, data, component);
    }
  }

  private reportError(message: string, data?: any, component?: string) {
    // Placeholder para integração com serviço de error tracking
    try {
      // window.Sentry?.captureException(new Error(message), {
      //   extra: { data, component }
      // });
    } catch (err) {
      // Fail silently
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

// Instância única
export const logger = new ProductionLogger();

// Helper para migrar console.logs existentes
export const cleanLog = {
  debug: (message: string, data?: any, component?: string) => 
    logger.debug(message, data, component),
  info: (message: string, data?: any, component?: string) => 
    logger.info(message, data, component),
  warn: (message: string, data?: any, component?: string) => 
    logger.warn(message, data, component),
  error: (message: string, data?: any, component?: string) => 
    logger.error(message, data, component),
};

// Para development/debug
if (isPreview) {
  (window as any).__productionLogger = logger;
}