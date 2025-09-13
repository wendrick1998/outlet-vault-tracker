import { ThemeTokens } from './ThemeProvider';

/**
 * Fallback token validation without Zod dependency
 * Simple guard validation for production environments where Zod might not be available
 */
export function safeParseTokensFallback(maybe: any, fallback: ThemeTokens): ThemeTokens {
  try {
    // Basic structure validation
    const isValidTokens = maybe
      && typeof maybe === 'object'
      && maybe.colors?.primary
      && maybe.colors?.secondary
      && maybe.colors?.background
      && maybe.typography?.fontFamily
      && maybe.borderRadius?.base
      && typeof maybe.colors.primary === 'string'
      && typeof maybe.typography.fontFamily === 'string'
      && typeof maybe.borderRadius.base === 'string';
    
    if (!isValidTokens) {
      console.warn('[tokens] Invalid tokens structure detected, using fallback');
      return fallback;
    }
    
    // Additional safety checks for required properties
    const hasRequiredColors = [
      'primary', 'secondary', 'accent', 'background', 
      'foreground', 'mutedForeground', 'success', 'warning', 'destructive'
    ].every(color => typeof maybe.colors[color] === 'string');
    
    const hasRequiredBorderRadius = [
      'base', 'lg', 'md', 'sm'
    ].every(radius => typeof maybe.borderRadius[radius] === 'string');
    
    if (!hasRequiredColors || !hasRequiredBorderRadius) {
      console.warn('[tokens] Missing required token properties, using fallback');
      return fallback;
    }
    
    return maybe as ThemeTokens;
  } catch (error) {
    console.warn('[tokens] Error parsing tokens, using fallback:', error);
    return fallback;
  }
}

/**
 * Quick validation for critical UI-breaking scenarios
 * Use this when you need lightweight validation without external dependencies
 */
export function isValidTokenStructure(tokens: any): boolean {
  return !!(
    tokens?.colors?.primary &&
    tokens?.colors?.background &&
    tokens?.typography?.fontFamily &&
    tokens?.borderRadius?.base
  );
}