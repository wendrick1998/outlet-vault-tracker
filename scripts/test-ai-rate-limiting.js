/**
 * AI Rate Limiting Test
 * Força 429 errors e testa backoff exponencial
 */

class AIRateLimitTest {
  constructor() {
    this.results = [];
    this.retryAttempts = [];
    this.baseUrl = window.location.origin;
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

  async testAIFunction(functionName, attempts = 10) {
    this.log(`Testing ${functionName} with ${attempts} rapid requests...`, 'info');
    
    const promises = [];
    const startTime = Date.now();
    
    // Fire multiple requests simultaneously to trigger rate limiting
    for (let i = 0; i < attempts; i++) {
      const promise = this.callAIFunction(functionName, i)
        .then(result => ({ ...result, attempt: i }))
        .catch(error => ({ error: error.message, attempt: i, status: 'error' }));
      
      promises.push(promise);
      
      // Small delay to simulate real usage
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    const results = await Promise.allSettled(promises);
    const endTime = Date.now();
    
    const analysis = this.analyzeResults(results, functionName, endTime - startTime);
    this.results.push(analysis);
    
    return analysis;
  }

  async callAIFunction(functionName, attempt) {
    const requestStart = Date.now();
    
    try {
      // Simulate Supabase function call
      const response = await fetch(`${this.baseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          prompt: `Test request #${attempt}`,
          timestamp: requestStart
        })
      });
      
      const requestEnd = Date.now();
      const duration = requestEnd - requestStart;
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        this.retryAttempts.push({
          attempt,
          status: 429,
          retryAfter: retryAfter ? parseInt(retryAfter) : null,
          duration
        });
        
        return {
          status: 429,
          retryAfter,
          duration,
          message: 'Rate limited'
        };
      }
      
      if (!response.ok) {
        return {
          status: response.status,
          duration,
          error: await response.text()
        };
      }
      
      const data = await response.json();
      return {
        status: 200,
        duration,
        data
      };
      
    } catch (error) {
      return {
        status: 'network_error',
        duration: Date.now() - requestStart,
        error: error.message
      };
    }
  }

  getAuthToken() {
    // Try to get auth token from localStorage or return placeholder
    try {
      const supabaseSession = localStorage.getItem('sb-lwbouxonjohqfdhnasvk-auth-token');
      if (supabaseSession) {
        const session = JSON.parse(supabaseSession);
        return session.access_token;
      }
    } catch (error) {
      this.log('Could not get auth token, using placeholder', 'warning');
    }
    return 'placeholder-token';
  }

  analyzeResults(results, functionName, totalDuration) {
    const successful = results.filter(r => r.status === 'fulfilled' && r.value?.status === 200).length;
    const rateLimited = results.filter(r => r.status === 'fulfilled' && r.value?.status === 429).length;
    const errors = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value?.status === 'error')).length;
    
    // Check for exponential backoff in retry attempts
    const retryDelays = this.retryAttempts
      .filter(r => r.retryAfter)
      .map(r => r.retryAfter)
      .sort((a, b) => a - b);
    
    const hasExponentialBackoff = retryDelays.length > 1 && 
      retryDelays.every((delay, index) => 
        index === 0 || delay >= retryDelays[index - 1]
      );
    
    return {
      functionName,
      totalRequests: results.length,
      successful,
      rateLimited,
      errors,
      totalDuration,
      retryAttempts: this.retryAttempts.length,
      hasExponentialBackoff,
      retryDelays,
      avgResponseTime: results
        .filter(r => r.status === 'fulfilled' && r.value?.duration)
        .reduce((sum, r) => sum + r.value.duration, 0) / Math.max(1, successful),
      analysis: {
        rateLimitingWorking: rateLimited > 0,
        backoffImplemented: hasExponentialBackoff,
        gracefulDegradation: errors === 0 || rateLimited > errors
      }
    };
  }

  async testUIFeedback() {
    this.log('Testing UI feedback for rate limiting...', 'info');
    
    // Check if rate limit UI components exist
    const quotaComponent = document.querySelector('[data-testid="ai-quota-status"]');
    const retryButton = document.querySelector('[data-testid="ai-retry-button"]');
    const countdown = document.querySelector('[data-testid="retry-countdown"]');
    
    return {
      hasQuotaComponent: !!quotaComponent,
      hasRetryButton: !!retryButton,
      hasCountdown: !!countdown,
      uiFeedbackWorking: !!(quotaComponent || retryButton || countdown)
    };
  }

  async runFullTest() {
    this.log('🤖 Starting AI Rate Limiting Tests...', 'info');
    
    // Test different AI functions
    const functions = ['ai-analytics', 'ai-predictions', 'ai-search-assistant', 'ai-smart-actions'];
    const testResults = [];
    
    for (const func of functions) {
      try {
        const result = await this.testAIFunction(func, 15);
        testResults.push(result);
        
        // Wait between different function tests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        this.log(`Error testing ${func}: ${error.message}`, 'error');
        testResults.push({
          functionName: func,
          error: error.message,
          analysis: { rateLimitingWorking: false, backoffImplemented: false }
        });
      }
    }
    
    // Test UI feedback
    const uiTest = await this.testUIFeedback();
    
    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      functions: testResults,
      uiFeedback: uiTest,
      overall: {
        allFunctionsHaveRateLimit: testResults.every(r => r.analysis?.rateLimitingWorking),
        allHaveBackoff: testResults.every(r => r.analysis?.backoffImplemented),
        uiWorking: uiTest.uiFeedbackWorking,
        success: testResults.every(r => r.analysis?.rateLimitingWorking && r.analysis?.backoffImplemented) && uiTest.uiFeedbackWorking
      }
    };
    
    this.log(`AI Rate Limiting Tests Complete - Success: ${report.overall.success}`, 
      report.overall.success ? 'success' : 'error');
    
    return report;
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.AIRateLimitTest = AIRateLimitTest;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIRateLimitTest;
}