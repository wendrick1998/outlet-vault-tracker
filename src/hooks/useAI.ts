// Legacy useAI - deprecated in favor of useAIWithRetry
// TODO: Remove after migration complete
import { useAIWithRetry } from './useAIWithRetry';

// Re-export with same interface for backwards compatibility
export const useAI = useAIWithRetry;

// Re-export types for backwards compatibility
export type { AIAction, AIResponse } from './useAIWithRetry';