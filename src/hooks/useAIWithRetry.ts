import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface AIAction {
  type: 'search' | 'suggest' | 'predict' | 'analyze' | 'validate';
  data?: any;
  context?: string;
}

export interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  confidence?: number;
  isRateLimited?: boolean;
  retryAfter?: number;
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitter: true
};

// Rate limit state
const rateLimitState = {
  isLimited: false,
  resetTime: 0,
  quotaExceeded: false
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateRetryDelay(attempt: number, retryAfter?: number): number {
  if (retryAfter) {
    return Math.min(retryAfter * 1000, RETRY_CONFIG.maxDelay);
  }

  let baseDelay = RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.exponentialBase, attempt);
  
  if (RETRY_CONFIG.jitter) {
    baseDelay *= (0.5 + Math.random() * 0.5); // Add jitter between 50-100%
  }
  
  return Math.min(baseDelay, RETRY_CONFIG.maxDelay);
}

export function useAIWithRetry() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const executeAIAction = async (action: AIAction): Promise<AIResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if we're currently rate limited
    if (rateLimitState.isLimited && Date.now() < rateLimitState.resetTime) {
      const remainingTime = Math.ceil((rateLimitState.resetTime - Date.now()) / 1000);
      return {
        success: false,
        error: `Limite de uso atingido. Tente novamente em ${remainingTime}s`,
        isRateLimited: true,
        retryAfter: remainingTime
      };
    }

    setIsLoading(true);
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        let response;

        switch (action.type) {
          case 'search':
            response = await supabase.functions.invoke('ai-search-assistant', {
              body: {
                searchTerm: action.data.searchTerm,
                type: action.data.type || 'imei'
              }
            });
            break;

          case 'suggest':
            response = await supabase.functions.invoke('ai-smart-actions', {
              body: {
                action: action.data.action,
                context: action.context,
                userId: user.id,
                itemData: action.data.itemData,
                formData: action.data.formData
              }
            });
            break;

          case 'predict':
            response = await supabase.functions.invoke('ai-predictions', {
              body: {
                type: action.data.type || 'demand',
                itemId: action.data.itemId,
                userId: user.id,
                period: action.data.period || '30d'
              }
            });
            break;

          case 'analyze':
            response = await supabase.functions.invoke('ai-analytics', {
              body: {
                type: action.data.type || 'general',
                period: action.data.period || '7d'
              }
            });
            break;

          case 'validate':
            response = await supabase.functions.invoke('ai-smart-actions', {
              body: {
                action: 'validate_loan',
                context: action.context,
                userId: user.id,
                itemData: action.data.itemData,
                formData: action.data.formData
              }
            });
            break;

          default:
            throw new Error(`Unknown AI action type: ${action.type}`);
        }

        // Handle successful response
        if (!response.error) {
          // Reset rate limit state on success
          rateLimitState.isLimited = false;
          setIsRateLimited(false);
          
          return {
            success: true,
            data: response.data,
            confidence: response.data?.confidence || 0.5
          };
        }

        // Handle rate limiting (429)
        if (response.status === 429) {
          const errorData = response.error;
          const retryAfterValue = parseInt(errorData?.retryAfter || '30');
          
          // Check if it's quota exceeded vs rate limiting
          if (errorData?.code === 'insufficient_quota') {
            rateLimitState.quotaExceeded = true;
            rateLimitState.isLimited = true;
            rateLimitState.resetTime = Date.now() + (retryAfterValue * 1000);
            
            setIsRateLimited(true);
            setRetryAfter(retryAfterValue);
            
            return {
              success: false,
              error: 'Limite de uso da IA atingido. Tente novamente mais tarde.',
              isRateLimited: true,
              retryAfter: retryAfterValue,
              data: response.data // May contain fallback data
            };
          }
          
          // Regular rate limiting - retry with backoff
          if (attempt < RETRY_CONFIG.maxRetries) {
            const delayMs = calculateRetryDelay(attempt, retryAfterValue);
            console.log(`Rate limited, retrying in ${delayMs}ms (attempt ${attempt + 1})`);
            await delay(delayMs);
            continue;
          }
          
          throw new Error(`Muitas solicitações. Tente novamente em ${retryAfterValue}s`);
        }

        // Handle other errors
        throw new Error(response.error?.message || 'AI action failed');

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on authentication or validation errors
        if (lastError.message.includes('not authenticated') || 
            lastError.message.includes('validation')) {
          break;
        }
        
        // Retry on network errors or temporary issues
        if (attempt < RETRY_CONFIG.maxRetries) {
          const delayMs = calculateRetryDelay(attempt);
          console.log(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms:`, lastError.message);
          await delay(delayMs);
          continue;
        }
      }
    }

    setIsLoading(false);
    
    const errorMessage = lastError?.message || 'AI action failed after retries';
    console.error('AI action failed after retries:', lastError);
    
    // Show toast for non-rate-limit errors
    if (!errorMessage.includes('Limite de uso') && !errorMessage.includes('Muitas solicitações')) {
      toast({
        title: "Erro na IA",
        description: errorMessage,
        variant: "destructive",
      });
    }

    return {
      success: false,
      error: errorMessage,
      isRateLimited: rateLimitState.isLimited
    };
  };

  // Convenience methods with enhanced error handling
  const searchWithAI = async (searchTerm: string, type = 'imei') => {
    return executeAIAction({
      type: 'search',
      data: { searchTerm, type }
    });
  };

  const getSuggestions = async (actionType: string, itemData: any, formData: any, context?: string) => {
    return executeAIAction({
      type: 'suggest',
      data: { action: actionType, itemData, formData },
      context
    });
  };

  const getPredictions = async (type = 'demand', itemId?: string, period = '30d') => {
    return executeAIAction({
      type: 'predict',
      data: { type, itemId, period }
    });
  };

  const getAnalysis = async (type = 'general', period = '7d') => {
    return executeAIAction({
      type: 'analyze',
      data: { type, period }
    });
  };

  const validateLoan = async (itemData: any, formData: any, context?: string) => {
    return executeAIAction({
      type: 'validate',
      data: { itemData, formData },
      context
    });
  };

  const resetRateLimit = () => {
    rateLimitState.isLimited = false;
    rateLimitState.quotaExceeded = false;
    setIsRateLimited(false);
    setRetryAfter(0);
  };

  return {
    isLoading,
    isRateLimited,
    retryAfter,
    quotaExceeded: rateLimitState.quotaExceeded,
    executeAIAction,
    searchWithAI,
    getSuggestions,
    getPredictions,
    getAnalysis,
    validateLoan,
    resetRateLimit
  };
}