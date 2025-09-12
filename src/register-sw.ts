// Service Worker registration - only in production, not in preview
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    const isPreview = typeof window !== 'undefined' && 
      window.location.hostname.startsWith('preview--');
    
    if (import.meta.env.PROD && !isPreview) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered:', registration);
          })
          .catch((error) => {
            console.log('SW registration failed:', error);
          });
      });
    }
  }
};