import { isDevelopment, isProduction } from './environment';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  source?: string;
}

class Logger {
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  private createLogEntry(level: LogLevel, message: string, data?: any, source?: string): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source: source || 'app'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true;
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  info(message: string, data?: any, source?: string): void {
    const entry = this.createLogEntry('info', message, data, source);
    this.addToBuffer(entry);
    
    if (this.shouldLog('info')) {
      console.log(`[${entry.timestamp}] INFO: ${message}`, data ? data : '');
    }
  }

  warn(message: string, data?: any, source?: string): void {
    const entry = this.createLogEntry('warn', message, data, source);
    this.addToBuffer(entry);
    
    if (this.shouldLog('warn')) {
      console.warn(`[${entry.timestamp}] WARN: ${message}`, data ? data : '');
    }
  }

  error(message: string, error?: any, source?: string): void {
    const entry = this.createLogEntry('error', message, error, source);
    this.addToBuffer(entry);
    
    if (this.shouldLog('error')) {
      console.error(`[${entry.timestamp}] ERROR: ${message}`, error ? error : '');
    }

    // In production, also send to monitoring service
    if (isProduction && typeof window !== 'undefined') {
      // Send to analytics/monitoring service
      this.sendToMonitoring(entry);
    }
  }

  debug(message: string, data?: any, source?: string): void {
    const entry = this.createLogEntry('debug', message, data, source);
    this.addToBuffer(entry);
    
    if (this.shouldLog('debug')) {
      console.debug(`[${entry.timestamp}] DEBUG: ${message}`, data ? data : '');
    }
  }

  private sendToMonitoring(entry: LogEntry): void {
    try {
      // Send error to monitoring service in production
      if (navigator.sendBeacon) {
        const payload = JSON.stringify({
          level: entry.level,
          message: entry.message,
          timestamp: entry.timestamp,
          url: window.location.href,
          userAgent: navigator.userAgent,
          data: entry.data
        });
        
        navigator.sendBeacon('/api/logs', payload);
      }
    } catch (e) {
      // Silently fail - don't want logging to break the app
    }
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logBuffer.filter(entry => entry.level === level);
    }
    return [...this.logBuffer];
  }

  clearLogs(): void {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience exports
export const { info, warn, error, debug } = logger;