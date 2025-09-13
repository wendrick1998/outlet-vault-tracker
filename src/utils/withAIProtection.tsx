import React from 'react';
import { useAIWithRetry } from '@/hooks/useAIWithRetry';

/**
 * HOC que bloqueia ações quando a IA estiver rate limited / quota exceeded.
 * - Preserva ref (forwardRef)
 * - Mantém typing do componente original (T)
 * - Injeta disabled e aria-disabled quando bloqueado
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
    } as T & { 'aria-disabled': boolean };
    
    return React.createElement(Comp, { ...enhancedProps, ref });
  });
  
  Wrapped.displayName = `${name}(${(Comp as any).displayName || (Comp as any).name || 'Component'})`;
  return Wrapped as React.ComponentType<T>;
}

// Pre-created AI-gated components for common use cases
import { Button } from '@/components/ui/button';

export const AIGatedButton = withAIProtection(Button);