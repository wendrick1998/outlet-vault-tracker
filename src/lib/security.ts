/**
 * Security utilities and constants for the application
 * Implements OWASP security best practices
 */

// Content Security Policy
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.openai.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co https://api.openai.com wss://*.supabase.co;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s+/g, ' ').trim();

// Rate limiting constants
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MINUTES: 15,
  API_REQUESTS_PER_MINUTE: 100,
  PASSWORD_RESET_PER_HOUR: 3,
  ACCOUNT_CREATION_PER_IP_PER_DAY: 5,
} as const;

// Security headers
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

// Input validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  IMEI: /^[0-9]{15}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.@]+$/,
} as const;

// Sanitization functions
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .substring(0, 1000); // Limit length
}

export function sanitizeSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/[^\w\s\-_.@]/g, '') // Only allow safe characters
    .substring(0, 100);
}

// Security logging
export function logSecurityEvent(event: string, details: Record<string, unknown>): void {
  console.warn('SECURITY_EVENT:', {
    timestamp: new Date().toISOString(),
    event,
    details: {
      ...details,
      userAgent: navigator?.userAgent || 'unknown',
      url: window?.location?.href || 'unknown',
    },
  });
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  else feedback.push('Senha deve ter pelo menos 8 caracteres');

  // Character diversity
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Inclua letras minúsculas');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Inclua letras maiúsculas');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Inclua números');

  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  else feedback.push('Inclua símbolos especiais');

  // Common patterns
  if (!/(.)\1{2,}/.test(password)) score += 1;
  else feedback.push('Evite caracteres repetidos');

  const isValid = score >= 5 && feedback.length === 0;
  
  return { isValid, score, feedback };
}

// CSRF token management
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Session security
export function validateSessionSecurity(): {
  isSecure: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  if (typeof window !== 'undefined') {
    // Check HTTPS in production
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      warnings.push('Conexão insegura - use HTTPS');
    }
    
    // Check for secure context
    if (!window.isSecureContext) {
      warnings.push('Contexto inseguro detectado');
    }
    
    // Check local storage security
    try {
      const testKey = '__security_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch {
      warnings.push('Armazenamento local não disponível');
    }
  }
  
  return {
    isSecure: warnings.length === 0,
    warnings,
  };
}