import React from 'react';
import { Button } from '@/components/ui/button';
import { AIGatedButton } from '@/utils/withAIProtection';
import { AIQuotaStatus } from '@/components/AIQuotaStatus';
import { useAIWithRetry } from '@/hooks/useAIWithRetry';

/**
 * Example component demonstrating AI protection patterns
 * Shows how to integrate AIQuotaStatus with useAIWithRetry for complete UI blocking
 */
export function AIProtectedExample() {
  const {
    isRateLimited,
    quotaExceeded,
    countdownTimer,
    resetRateLimit,
    executeAIAction,
    isLoading
  } = useAIWithRetry();

  const handleAISearch = async () => {
    await executeAIAction({
      type: 'search',
      data: { query: 'example search' }
    });
  };

  const handleAIAnalytics = async () => {
    await executeAIAction({
      type: 'analyze',
      data: { type: 'general', period: '7d' }
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">AI Protected Actions</h3>
      
      {/* Quota status banner */}
      <AIQuotaStatus
        isRateLimited={isRateLimited}
        quotaExceeded={quotaExceeded}
        retryAfter={countdownTimer}
        onRetry={resetRateLimit}
      />
      
      {/* Manual protection example */}
      <div className="space-x-2">
        <Button
          onClick={handleAISearch}
          disabled={isRateLimited || quotaExceeded || isLoading}
          aria-disabled={isRateLimited || quotaExceeded || isLoading}
          data-testid="ai-search-action"
        >
          {isRateLimited || quotaExceeded ? 
            `Aguarde ${countdownTimer}s` : 
            isLoading ? 'Processando...' : 'Busca com IA'
          }
        </Button>
        
        {/* HOC protection example */}
        <AIGatedButton 
          onClick={handleAIAnalytics}
          disabled={isLoading}
          data-testid="ai-gated-analytics"
        >
          {isLoading ? 'Analisando...' : 'Analytics com IA'}
        </AIGatedButton>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Demonstração de como proteger ações de IA com status visual e bloqueio automático.
      </p>
    </div>
  );
}