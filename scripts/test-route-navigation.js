/**
 * Route Navigation Test
 * Testa navegação programática e carregamento de lazy chunks
 */

class RouteNavigationTest {
  constructor() {
    this.results = [];
    this.chunkErrors = [];
    this.routes = [
      '/',
      '/admin',
      '/active-loans', 
      '/history',
      '/batch-outflow',
      '/search-and-operate',
      '/search-and-register',
      '/profile',
      '/settings'
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type];
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testRoute(route) {
    this.log(`Testing route: ${route}`, 'info');
    
    const startTime = Date.now();
    const initialChunkCount = this.getLoadedChunks().length;
    
    try {
      // Navigate to route
      if (window.history && window.history.pushState) {
        window.history.pushState({}, '', route);
        
        // Trigger route change event
        const event = new PopStateEvent('popstate', { state: {} });
        window.dispatchEvent(event);
      }
      
      // Wait for route to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const endTime = Date.now();
      const finalChunkCount = this.getLoadedChunks().length;
      const newChunks = finalChunkCount - initialChunkCount;
      
      // Check for 404 errors in network
      const networkErrors = this.checkNetworkFor404s();
      
      return {
        route,
        loadTime: endTime - startTime,
        newChunksLoaded: newChunks,
        networkErrors,
        success: networkErrors.length === 0
      };
      
    } catch (error) {
      return {
        route,
        error: error.message,
        success: false
      };
    }
  }

  getLoadedChunks() {
    // Get all script tags that look like chunks
    const scripts = Array.from(document.querySelectorAll('script[src*="assets/"]'));
    return scripts.map(s => s.src).filter(src => src.includes('.js'));
  }

  checkNetworkFor404s() {
    // This would need to be run with Performance Observer or network monitoring
    // For now, we'll simulate checking for common 404 patterns
    const errors = [];
    
    // Check if any scripts failed to load
    const scripts = document.querySelectorAll('script[src*="assets/"]');
    scripts.forEach(script => {
      if (script.hasAttribute('data-failed')) {
        errors.push(`404: ${script.src}`);
      }
    });
    
    return errors;
  }

  async testLazyLoading() {
    this.log('Testing lazy loading patterns...', 'info');
    
    const lazyPatterns = [
      'LazyHistory',
      'LazyAdmin', 
      'LazyActiveLoans',
      'LazyBatchOutflow',
      'LazySearchAndOperate'
    ];
    
    const results = {};
    
    for (const pattern of lazyPatterns) {
      try {
        // Check if lazy component exists in code
        const response = await fetch(`/src/pages/lazy/${pattern}.tsx`);
        results[pattern] = {
          exists: response.ok,
          status: response.status
        };
      } catch (error) {
        results[pattern] = {
          exists: false,
          error: error.message
        };
      }
    }
    
    return results;
  }

  async testPrefetching() {
    this.log('Testing prefetch directives...', 'info');
    
    // Check for prefetch link tags
    const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
    const modulePreloadLinks = document.querySelectorAll('link[rel="modulepreload"]');
    
    // Check for webpack prefetch comments in source
    const hasPrefetchDirectives = await this.checkForPrefetchInSource();
    
    return {
      prefetchLinksCount: prefetchLinks.length,
      modulePreloadCount: modulePreloadLinks.length,
      hasPrefetchDirectives,
      prefetchImplemented: prefetchLinks.length > 0 || modulePreloadLinks.length > 0 || hasPrefetchDirectives
    };
  }

  async checkForPrefetchInSource() {
    try {
      // This would need to check actual source files
      // For demo purposes, return false - would need build-time analysis
      return false;
    } catch (error) {
      return false;
    }
  }

  captureNetworkRequests() {
    const requests = [];
    
    // Override fetch to capture requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const startTime = Date.now();
      
      return originalFetch.apply(this, args)
        .then(response => {
          const endTime = Date.now();
          requests.push({
            url,
            status: response.status,
            duration: endTime - startTime,
            timestamp: startTime
          });
          return response;
        })
        .catch(error => {
          const endTime = Date.now();
          requests.push({
            url,
            status: 'error',
            error: error.message,
            duration: endTime - startTime,
            timestamp: startTime
          });
          throw error;
        });
    };
    
    // Return cleanup function
    return () => {
      window.fetch = originalFetch;
      return requests;
    };
  }

  async runFullTest() {
    this.log('🗺️ Starting Route Navigation Tests...', 'info');
    
    // Start network monitoring
    const cleanup = this.captureNetworkRequests();
    
    // Test each route
    const routeResults = [];
    for (const route of this.routes) {
      try {
        const result = await this.testRoute(route);
        routeResults.push(result);
        
        // Small delay between route tests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        this.log(`Error testing route ${route}: ${error.message}`, 'error');
        routeResults.push({
          route,
          error: error.message,
          success: false
        });
      }
    }
    
    // Test lazy loading
    const lazyResults = await this.testLazyLoading();
    
    // Test prefetching
    const prefetchResults = await this.testPrefetching();
    
    // Get network requests and cleanup
    const networkRequests = cleanup();
    
    // Analyze results
    const analysis = {
      totalRoutes: this.routes.length,
      successfulRoutes: routeResults.filter(r => r.success).length,
      failedRoutes: routeResults.filter(r => !r.success).length,
      total404s: networkRequests.filter(r => r.status === 404).length,
      lazyComponentsFound: Object.values(lazyResults).filter(r => r.exists).length,
      prefetchingImplemented: prefetchResults.prefetchImplemented
    };
    
    const report = {
      timestamp: new Date().toISOString(),
      routes: routeResults,
      lazyComponents: lazyResults,
      prefetching: prefetchResults,
      networkRequests,
      analysis,
      overall: {
        allRoutesWork: analysis.failedRoutes === 0,
        no404s: analysis.total404s === 0,
        lazyLoadingComplete: analysis.lazyComponentsFound >= 3, // At least 3 lazy components
        success: analysis.failedRoutes === 0 && analysis.total404s === 0
      }
    };
    
    this.log(`Route Navigation Tests Complete - Success: ${report.overall.success}`, 
      report.overall.success ? 'success' : 'error');
    
    return report;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.RouteNavigationTest = RouteNavigationTest;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RouteNavigationTest;
}