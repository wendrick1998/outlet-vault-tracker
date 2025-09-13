import { useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface EnhancedPortalProps {
  children: ReactNode;
  container?: Element | null;
  key?: string;
}

/**
 * Enhanced Portal component with proper cleanup to prevent DOM race conditions
 */
export const EnhancedPortal = ({ 
  children, 
  container,
  key 
}: EnhancedPortalProps) => {
  const mountRef = useRef<Element | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create portal container
    const portalContainer = document.createElement('div');
    portalContainer.setAttribute('data-portal', 'true');
    if (key) {
      portalContainer.setAttribute('data-portal-key', key);
    }
    
    const targetContainer = container || document.body;
    
    // Store refs
    mountRef.current = targetContainer;
    portalRef.current = portalContainer;
    
    // Mount portal
    targetContainer.appendChild(portalContainer);

    return () => {
      // Enhanced cleanup to prevent race conditions
      const currentMount = mountRef.current;
      const currentPortal = portalRef.current;
      
      if (currentMount && currentPortal) {
        try {
          // Check if portal is still connected before removing
          if (currentPortal.isConnected && currentMount.contains(currentPortal)) {
            currentMount.removeChild(currentPortal);
          }
        } catch (error) {
          // Silence removeChild errors - portal already removed
          if (!(error instanceof DOMException && error.name === 'NotFoundError')) {
            console.warn('Portal cleanup warning:', error);
          }
        }
      }
      
      // Clear refs
      mountRef.current = null;
      portalRef.current = null;
    };
  }, [container, key]);

  // Only render portal if container exists
  return portalRef.current ? createPortal(children, portalRef.current) : null;
};