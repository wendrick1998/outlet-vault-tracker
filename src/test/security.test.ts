import { describe, it, expect } from 'vitest';
import { 
  sanitizeInput, 
  sanitizeSearchQuery, 
  validatePasswordStrength,
  VALIDATION_PATTERNS 
} from '@/lib/security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const maliciousInput = '<script>alert("XSS")</script>';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
    });

    it('should trim whitespace', () => {
      const input = '  test input  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('test input');
    });

    it('should limit input length', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeInput(longInput);
      expect(sanitized.length).toBe(1000);
    });
  });

  describe('sanitizeSearchQuery', () => {
    it('should only allow safe characters', () => {
      const maliciousQuery = 'test; DROP TABLE users; --';
      const sanitized = sanitizeSearchQuery(maliciousQuery);
      expect(sanitized).toBe('test DROP TABLE users --');
    });

    it('should limit query length', () => {
      const longQuery = 'search'.repeat(50);
      const sanitized = sanitizeSearchQuery(longQuery);
      expect(sanitized.length).toBeLessThanOrEqual(100);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd123';
      const result = validatePasswordStrength(strongPassword);
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(5);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPassword = '123';
      const result = validatePasswordStrength(weakPassword);
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(5);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for missing requirements', () => {
      const noUppercase = 'lowercaseonly123!';
      const result = validatePasswordStrength(noUppercase);
      expect(result.feedback).toContain('Inclua letras maiúsculas');
    });

    it('should detect repeated characters', () => {
      const repeated = 'Aaaaaa123!';
      const result = validatePasswordStrength(repeated);
      expect(result.feedback).toContain('Evite caracteres repetidos');
    });
  });

  describe('VALIDATION_PATTERNS', () => {
    it('should validate email addresses', () => {
      expect('test@example.com').toMatch(VALIDATION_PATTERNS.EMAIL);
      expect('invalid-email').not.toMatch(VALIDATION_PATTERNS.EMAIL);
    });

    it('should validate phone numbers', () => {
      expect('+5511999999999').toMatch(VALIDATION_PATTERNS.PHONE);
      expect('(11) 99999-9999').toMatch(VALIDATION_PATTERNS.PHONE);
      expect('123').not.toMatch(VALIDATION_PATTERNS.PHONE);
    });

    it('should validate IMEI numbers', () => {
      expect('123456789012345').toMatch(VALIDATION_PATTERNS.IMEI);
      expect('12345678901234').not.toMatch(VALIDATION_PATTERNS.IMEI);
      expect('12345678901234a').not.toMatch(VALIDATION_PATTERNS.IMEI);
    });

    it('should validate UUIDs', () => {
      expect('123e4567-e89b-12d3-a456-426614174000').toMatch(VALIDATION_PATTERNS.UUID);
      expect('not-a-uuid').not.toMatch(VALIDATION_PATTERNS.UUID);
    });
  });
});