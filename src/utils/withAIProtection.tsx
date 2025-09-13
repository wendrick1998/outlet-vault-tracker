import React from 'react';
import { useAIWithRetry } from '@/hooks/useAIWithRetry';

/**
 * HOC that automatically protects components from AI actions when rate limited or quota exceeded
 */
export function withAIProtection<T extends { disabled?: boolean }>(
  Comp: React.ComponentType<T>
) {
  return (props: T) => {
    const { isRateLimited, quotaExceeded } = useAIWithRetry();
    const blocked = isRateLimited || quotaExceeded;
    
    return (
      <Comp 
        {...props} 
        disabled={blocked || props.disabled} 
        aria-disabled={blocked || props.disabled} 
      />
    );
  };
}

// Pre-created AI-gated components for common use cases
import { Button } from '@/components/ui/button';

export const AIGatedButton = withAIProtection(Button);