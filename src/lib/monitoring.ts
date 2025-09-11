import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals';

interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: VitalMetric[] = [];
  
  init() {
    // Collect Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));
    
    // Send metrics periodically
    setInterval(() => {
      this.sendMetrics();
    }, 30000); // Send every 30 seconds
    
    // Send metrics on page unload
    window.addEventListener('beforeunload', () => {
      this.sendMetrics();
    });
  }
  
  private handleMetric(metric: any) {
    const vitalMetric: VitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      navigationType: metric.navigationType,
      timestamp: Date.now(),
    };
    
    this.metrics.push(vitalMetric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metric.name}:`, metric.value, `(${metric.rating})`);
    }
  }
  
  private sendMetrics() {
    if (this.metrics.length === 0) return;
    
    const metricsToSend = [...this.metrics];
    this.metrics = [];
    
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to your analytics endpoint
      fetch('/api/analytics/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: metricsToSend }),
        keepalive: true,
      }).catch(console.error);
    }
  }
  
  // Manual performance marks
  mark(name: string) {
    performance.mark(name);
  }
  
  // Measure between marks
  measure(name: string, startMark: string, endMark?: string) {
    performance.measure(name, startMark, endMark);
  }
  
  // Get all performance entries
  getPerformanceEntries(type?: string) {
    if (type) {
      return performance.getEntriesByType(type);
    }
    return performance.getEntries();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error tracking
interface ErrorInfo {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  userAgent: string;
}

class ErrorTracker {
  private errors: ErrorInfo[] = [];
  
  init() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
      });
    });
  }
  
  trackError(errorInfo: ErrorInfo) {
    this.errors.push(errorInfo);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Error Tracking]', errorInfo);
    }
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errorInfo }),
        keepalive: true,
      }).catch(console.error);
    }
  }
  
  // Manual error tracking
  captureException(error: Error, extra?: Record<string, any>) {
    this.trackError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      ...extra,
    });
  }
}

export const errorTracker = new ErrorTracker();

// Initialize monitoring
export function initializeMonitoring() {
  performanceMonitor.init();
  errorTracker.init();
}