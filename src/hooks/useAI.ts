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
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const executeAIAction = async (action: AIAction): Promise<AIResponse> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
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

      if (response.error) {
        throw new Error(response.error.message || 'AI action failed');
      }

      return {
        success: true,
        data: response.data,
        confidence: response.data?.confidence || 0.5
      };

    } catch (error) {
      console.error('AI action failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'AI action failed';
      
      toast({
        title: "Erro na IA",
        description: errorMessage,
        variant: "destructive",
      });

      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Convenience methods
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

  return {
    isLoading,
    executeAIAction,
    searchWithAI,
    getSuggestions,
    getPredictions,
    getAnalysis,
    validateLoan
  };
}