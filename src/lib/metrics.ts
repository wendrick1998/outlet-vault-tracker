/**
 * Performance metrics and monitoring utilities
 */

interface Metric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics

  // Record a metric
  record(name: string, value: number, metadata?: Record<string, any>) {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    console.log(`📊 METRIC [${name}]: ${value}${metadata ? ` (${JSON.stringify(metadata)})` : ''}`);
  }

  // Start a timer and return a function to end it
  startTimer(name: string, metadata?: Record<string, any>) {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.record(name, Math.round(duration), { ...metadata, unit: 'ms' });
      return duration;
    };
  }

  // Get metrics by name
  getMetrics(name?: string, since?: number): Metric[] {
    let filtered = this.metrics;
    
    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }
    
    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }
    
    return filtered;
  }

  // Get aggregated stats for a metric
  getStats(name: string, since?: number) {
    const metrics = this.getMetrics(name, since);
    
    if (metrics.length === 0) {
      return null;
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: sum / values.length,
      sum,
      latest: values[values.length - 1]
    };
  }

  // Clear metrics
  clear() {
    this.metrics = [];
  }
}

// Global metrics instance
export const metrics = new MetricsCollector();

// Predefined metric names
export const METRIC_NAMES = {
  // Password Security
  PASSWORD_VALIDATION_TIME: 'password_validation_time',
  HIBP_RESPONSE_TIME: 'hibp_response_time',
  HIBP_FALLBACK_RATE: 'hibp_fallback_rate',
  PASSWORD_LEAK_CHECK_SUCCESS: 'password_leak_check_success',
  
  // SSE Analytics
  SSE_CONNECTION_TIME: 'sse_connection_time',
  SSE_TTV: 'sse_time_to_value', // Time to first valuable data
  SSE_STREAM_DURATION: 'sse_stream_duration',
  SSE_HEARTBEAT_COUNT: 'sse_heartbeat_count',
  OPENAI_RESPONSE_TIME: 'openai_response_time',
  
  // General Performance
  PAGE_LOAD_TIME: 'page_load_time',
  API_RESPONSE_TIME: 'api_response_time',
  DATABASE_QUERY_TIME: 'database_query_time',
  
  // Feature Flags
  FEATURE_FLAG_TOGGLE: 'feature_flag_toggle',
  
  // Error Rates
  ERROR_RATE: 'error_rate',
  NETWORK_ERROR: 'network_error',
} as const;

// Helper functions for common metrics
export const trackPasswordValidation = async <T>(fn: () => Promise<T>): Promise<T> => {
  const endTimer = metrics.startTimer(METRIC_NAMES.PASSWORD_VALIDATION_TIME);
  try {
    const result = await fn();
    endTimer();
    return result;
  } catch (error) {
    endTimer();
    metrics.record(METRIC_NAMES.ERROR_RATE, 1, { 
      type: 'password_validation', 
      error: error.message 
    });
    throw error;
  }
};

export const trackSSEConnection = () => {
  const startTime = performance.now();
  let ttvRecorded = false;
  
  return {
    recordTTV: () => {
      if (!ttvRecorded) {
        const ttv = performance.now() - startTime;
        metrics.record(METRIC_NAMES.SSE_TTV, Math.round(ttv));
        ttvRecorded = true;
      }
    },
    recordEnd: () => {
      const duration = performance.now() - startTime;
      metrics.record(METRIC_NAMES.SSE_STREAM_DURATION, Math.round(duration));
    }
  };
};

export const trackHIBPCall = async <T>(fn: () => Promise<T>, fallback = false): Promise<T> => {
  const endTimer = metrics.startTimer(METRIC_NAMES.HIBP_RESPONSE_TIME);
  
  try {
    const result = await fn();
    endTimer();
    
    if (fallback) {
      metrics.record(METRIC_NAMES.HIBP_FALLBACK_RATE, 1);
    } else {
      metrics.record(METRIC_NAMES.PASSWORD_LEAK_CHECK_SUCCESS, 1);
    }
    
    return result;
  } catch (error) {
    endTimer();
    metrics.record(METRIC_NAMES.HIBP_FALLBACK_RATE, 1);
    metrics.record(METRIC_NAMES.ERROR_RATE, 1, { 
      type: 'hibp_call', 
      error: error.message 
    });
    throw error;
  }
};
