import { useEffect, useState } from 'react';

/**
 * Hook to detect and handle Service Worker updates
 * Provides hasUpdate flag and apply function for user-friendly update prompts
 */
export function useServiceWorkerUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Reload when new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    navigator.serviceWorker.ready.then(registration => {
      // Check if there's already a waiting SW
      if (registration.waiting) {
        setWaiting(registration.waiting);
      }

      // Listen for new SW installations
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW is installed and ready to take over
            setWaiting(installingWorker);
          }
        });
      });
    });
  }, []);

  const apply = () => {
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return { 
    hasUpdate: !!waiting, 
    apply 
  };
}