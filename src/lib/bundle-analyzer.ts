// Bundle analysis utilities for development
export const bundleAnalyzer = {
  // Analyze chunk sizes and dependencies
  analyzeChunks: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const chunks = document.querySelectorAll('script[src]');
    const chunkInfo = Array.from(chunks).map(script => {
      const src = (script as HTMLScriptElement).src;
      return {
        name: src.split('/').pop() || 'unknown',
        url: src,
        size: 'unknown', // Size would need to be fetched
      };
    });
    
    console.group('📦 Bundle Analysis');
    console.table(chunkInfo);
    console.groupEnd();
  },

  // Track resource loading performance
  trackResourceLoading: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const resources = entries
        .filter(entry => entry.entryType === 'resource')
        .map(entry => ({
          name: entry.name.split('/').pop(),
          duration: Math.round(entry.duration),
          size: (entry as any).transferSize || 0,
          type: entry.name.split('.').pop(),
        }))
        .sort((a, b) => b.duration - a.duration);

      if (resources.length > 0) {
        console.group('⏱️ Resource Loading Times');
        console.table(resources.slice(0, 10)); // Top 10 slowest
        console.groupEnd();
      }
    });

    observer.observe({ entryTypes: ['resource'] });

    // Stop observing after 30 seconds
    setTimeout(() => observer.disconnect(), 30000);
  },

  // Memory usage tracking
  trackMemoryUsage: () => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!(performance as any).memory) return;

    const memory = (performance as any).memory;
    const memoryInfo = {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
      allocated: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`,
      usage: `${Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)}%`,
    };

    console.group('🧠 Memory Usage');
    console.table(memoryInfo);
    console.groupEnd();
  },

  // Initialize all analyzers
  init: () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    // Run initial analysis after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        bundleAnalyzer.analyzeChunks();
        bundleAnalyzer.trackResourceLoading();
        bundleAnalyzer.trackMemoryUsage();
      }, 1000);
    });

    // Track memory periodically
    setInterval(() => {
      bundleAnalyzer.trackMemoryUsage();
    }, 30000); // Every 30 seconds
  },
};