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

    // Mantém T intacto; insere aria-* como any para não "forçar" no tipo do Comp
    const a11y: any = { 'aria-disabled': blocked || props.disabled };

    return (
      <Comp
        {...props}
        {...a11y}
        ref={ref}
        disabled={blocked || props.disabled}
      />
    );
  });

  Wrapped.displayName = `${name}(${(Comp as any).displayName || (Comp as any).name || 'Component'})`;
  return Wrapped;
}

// Pre-created AI-gated components for common use cases
import { Button } from '@/components/ui/button';

export const AIGatedButton = withAIProtection(Button);