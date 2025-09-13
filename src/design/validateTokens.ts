import { z } from 'zod';
import { ThemeTokens } from './ThemeProvider';

/**
 * Zod schema for validating theme tokens structure
 * Ensures tokens loaded from localStorage/external sources are valid
 */
export const TokensSchema = z.object({
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    background: z.string(),
    foreground: z.string(),
    mutedForeground: z.string(),
    success: z.string(),
    warning: z.string(),
    destructive: z.string(),
  }),
  borderRadius: z.object({
    base: z.string(),
    lg: z.string(),
    md: z.string(),
    sm: z.string(),
  }),
  spacing: z.record(z.string(), z.string()),
  typography: z.object({
    fontFamily: z.string(),
    fontSize: z.record(z.string(), z.string()),
  }),
});

/**
 * Safely parse tokens with fallback to default if validation fails
 * Prevents UI breakage from invalid token data
 */
export function safeParseTokens(maybe: unknown, fallback: ThemeTokens): ThemeTokens {
  try {
    const parsed = TokensSchema.safeParse(maybe);
    
    if (!parsed.success) {
      console.warn('[tokens] Invalid tokens detected, falling back to defaults:', parsed.error.issues);
      return fallback;
    }
    
    return parsed.data as ThemeTokens;
  } catch (error) {
    console.warn('[tokens] Error parsing tokens, using fallback:', error);
    return fallback;
  }
}