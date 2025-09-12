// Environment detection utilities
export const isPreview = typeof window !== 'undefined' && 
  window.location.hostname.startsWith('preview--');

export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD && !isPreview;