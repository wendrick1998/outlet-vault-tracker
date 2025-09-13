import React from 'react';
import { useAIWithRetry } from '@/hooks/useAIWithRetry';

/**
 * HOC that automatically protects components from AI actions when rate limited or quota exceeded  
 * Enhanced with forwardRef support and displayName for better debugging
 */
export function withAIProtection<T extends { disabled?: boolean }>(
  Comp: React.ComponentType<T>,
  name = 'AIGated'
) {
  const Wrapped = React.forwardRef<any, T>((props, ref) => {
    const { isRateLimited, quotaExceeded } = useAIWithRetry();
    const blocked = isRateLimited || quotaExceeded;
    
    const enhancedProps = {
      ...props,
      disabled: blocked || props.disabled,
      'aria-disabled': blocked || props.disabled
    } as T;
    
    return React.createElement(Comp, { ...enhancedProps, ref });
  });
  
  Wrapped.displayName = `${name}(${Comp.displayName || Comp.name || 'Component'})`;
  return Wrapped as React.ComponentType<T>;
}

// Pre-created AI-gated components for common use cases
import { Button } from '@/components/ui/button';

export const AIGatedButton = withAIProtection(Button);