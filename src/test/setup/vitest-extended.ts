import { expect } from 'vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
declare module 'vitest' {
  interface Assertion<T = any> extends jest.Matchers<void>, TestingLibraryMatchers<T, void> {}
}

// Add custom matchers for better testing
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      message: () => `expected ${received} to be a valid date`,
      pass,
    };
  },
  
  toHaveValidFormData(received: FormData) {
    const pass = received instanceof FormData && [...received.keys()].length > 0;
    return {
      message: () => `expected FormData to have entries`,
      pass,
    };
  },

  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
      pass,
    };
  }
});