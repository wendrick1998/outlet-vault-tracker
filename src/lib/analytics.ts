// Enhanced analytics system
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
  userId?: string;
  sessionId?: string;
}

export interface PerformanceMetrics {
  name: string;
  value: number;
  delta: number;
  id: string;
  navigationType: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private queue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.startQueueProcessor();
  }

  private generateSessionId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden', { sessionDuration: this.getSessionDuration() });
      } else {
        this.track('page_visible');
      }
    });

    // Unload events
    window.addEventListener('beforeunload', () => {
      this.track('session_end', { 
        sessionDuration: this.getSessionDuration(),
        finalUrl: window.location.href 
      });
      this.flush();
    });
  }

  private getSessionDuration(): number {
    const sessionStart = parseInt(this.sessionId.split('_')[0]);
    return Date.now() - sessionStart;
  }

  private startQueueProcessor() {
    // Process queue every 10 seconds
    setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    }, 10000);
  }

  public track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.queue.push(event);

    // Process immediately for critical events
    const criticalEvents = ['error', 'crash', 'security_event'];
    if (criticalEvents.includes(eventName) && this.isOnline) {
      this.processQueue();
    }
  }

  public trackPerformance(metric: PerformanceMetrics) {
    this.track('performance_metric', {
      metricName: metric.name,
      value: metric.value,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });
  }

  public trackError(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
    });
  }

  public trackUserAction(action: string, target?: string, value?: any) {
    this.track('user_action', {
      action,
      target,
      value,
      timestamp: Date.now(),
    });
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  private async processQueue() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // In production, send to real analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      } else {
        // Development logging
        console.group('📊 Analytics Events');
        events.forEach(event => {
          console.log(`${event.name}:`, event.properties);
        });
        console.groupEnd();
      }
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...events);
      console.warn('Analytics processing failed:', error);
    }
  }

  public flush() {
    // Synchronous flush for page unload
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (process.env.NODE_ENV === 'production' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify({ events }));
    }
  }

  // Page tracking helpers
  public pageView(path: string, title?: string) {
    this.track('page_view', {
      path,
      title: title || document.title,
      referrer: document.referrer,
    });
  }

  public timeOnPage(startTime: number) {
    this.track('time_on_page', {
      duration: Date.now() - startTime,
      path: window.location.pathname,
    });
  }
}

export const analytics = new Analytics();

// Auto-track page views for SPA navigation
let currentPath = window.location.pathname;
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  originalPushState.apply(history, args);
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    analytics.pageView(currentPath);
  }
};

history.replaceState = function(...args) {
  originalReplaceState.apply(history, args);
  if (window.location.pathname !== currentPath) {
    currentPath = window.location.pathname;
    analytics.pageView(currentPath);
  }
};

// Track initial page view
analytics.pageView(window.location.pathname);