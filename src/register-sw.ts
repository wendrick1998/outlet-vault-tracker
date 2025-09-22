// Service Worker registration with cache busting
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    const isPreview = typeof window !== 'undefined' && 
      window.location.hostname.startsWith('preview--');
    
    if (import.meta.env.PROD && !isPreview) {
      window.addEventListener('load', () => {
        // Clear old caches before registering new SW
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              if (name !== 'offline-cache') {
                caches.delete(name);
              }
            });
          });
        }

        navigator.serviceWorker.register('/sw.js?' + Date.now())
          .then((registration) => {
            console.log('SW registered:', registration);
            
            // Force update check
            registration.update();
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }
};