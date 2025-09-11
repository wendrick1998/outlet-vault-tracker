// Environment utilities for production/development detection
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Conditional logging - Deprecated: Use logger from @/lib/logger instead
export const devLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Environment-specific configurations
export const config = {
  analytics: {
    enabled: isProduction,
    endpoint: isProduction ? '/api/analytics' : '/dev/analytics'
  },
  monitoring: {
    enabled: isProduction,
    sampleRate: isProduction ? 0.1 : 1.0
  },
  serviceWorker: {
    enabled: isProduction,
    updateCheckInterval: isProduction ? 60000 : 10000 // 1 min vs 10 sec
  }
};