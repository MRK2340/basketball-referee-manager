/**
 * validation-hardening.test.js
 * Validators receive raw form values typed as unknown — non-string input
 * must come back as a validation error, never as a thrown TypeError.
 */
import { describe, it, expect } from 'vitest';
import {
  validateRequired, validateOptional, validateDate, validateTime, validateEmail,
} from '../lib/validation';

const NON_STRINGS = [null, undefined, 42, true, {}, ['a'], () => {}];

describe('validators reject non-string input instead of throwing', () => {
  it('validateRequired returns an error for every non-string', () => {
    for (const v of NON_STRINGS) {
      expect(() => validateRequired(v, 'Field')).not.toThrow();
      expect(validateRequired(v, 'Field')).toMatch(/Field/);
    }
  });

  it('validateOptional errors on non-empty non-strings, passes empty ones', () => {
    expect(validateOptional(null, 'Field')).toBeNull();
    expect(validateOptional(undefined, 'Field')).toBeNull();
    expect(validateOptional('', 'Field')).toBeNull();
    for (const v of [42, true, {}, ['a']]) {
      expect(() => validateOptional(v, 'Field')).not.toThrow();
      expect(validateOptional(v, 'Field')).toMatch(/Field/);
    }
  });

  it('validateDate and validateTime error on non-string truthy input', () => {
    for (const v of [42, true, {}, ['a']]) {
      expect(validateDate(v, 'Date')).toMatch(/Date/);
      expect(validateTime(v, 'Time')).toMatch(/Time/);
    }
  });

  it('validateEmail errors on non-string truthy input', () => {
    for (const v of [42, true, {}]) {
      expect(validateEmail(v)).toMatch(/valid email/);
    }
  });
});

describe('validators still accept valid strings', () => {
  it('happy paths return null', () => {
    expect(validateRequired('Hawks', 'Team')).toBeNull();
    expect(validateOptional('Gym 3', 'Venue')).toBeNull();
    expect(validateDate('2026-07-06')).toBeNull();
    expect(validateTime('19:30')).toBeNull();
    expect(validateEmail('ref@example.com')).toBeNull();
  });
});
