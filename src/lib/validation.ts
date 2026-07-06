/**
 * validation.ts
 * Client-side input validation for data before Firestore writes.
 * Returns an error message string if invalid, or null if valid.
 */

export const MAX_TEAM_NAME = 100;
export const MAX_VENUE_NAME = 200;
export const MAX_TOURNAMENT_NAME = 150;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_NOTES_LENGTH = 1000;
export const MAX_FEE = 10000;
export const MIN_FEE = 0;
export const MAX_COURTS = 50;

/** Validate a non-empty string with max length. Non-string input is a
 * validation error, not an exception — callers hand these raw form values. */
export const validateRequired = (value: unknown, fieldName: string, maxLen = 200): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return `${fieldName} is required.`;
  if (value.trim().length > maxLen) return `${fieldName} must be under ${maxLen} characters.`;
  return null;
};

/** Validate an optional string with max length. */
export const validateOptional = (value: unknown, fieldName: string, maxLen = 200): string | null => {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') return `${fieldName} must be text.`;
  if (value.length > maxLen) return `${fieldName} must be under ${maxLen} characters.`;
  return null;
};

/** Validate a date string is YYYY-MM-DD format and is a real date. */
export const validateDate = (value: unknown, fieldName = 'Date'): string | null => {
  if (!value) return `${fieldName} is required.`;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${fieldName} must be in YYYY-MM-DD format.`;
  const d = new Date(value + 'T00:00:00');
  if (isNaN(d.getTime())) return `${fieldName} is not a valid date.`;
  return null;
};

/** Validate a time string is HH:MM or HH:MM:SS format. */
export const validateTime = (value: unknown, fieldName = 'Time'): string | null => {
  if (value == null || value === '') return null; // time is often optional
  if (typeof value !== 'string' || !/^\d{1,2}:\d{2}(:\d{2})?$/.test(value)) return `${fieldName} must be in HH:MM format.`;
  return null;
};

/** Validate a numeric value within a range. */
export const validateNumber = (value: number, fieldName: string, min = 0, max = MAX_FEE): string | null => {
  if (isNaN(value)) return `${fieldName} must be a number.`;
  if (value < min) return `${fieldName} must be at least ${min}.`;
  if (value > max) return `${fieldName} must be at most ${max}.`;
  return null;
};

/** Validate an email address format. */
export const validateEmail = (value: unknown): string | null => {
  if (!value) return 'Email is required.';
  if (typeof value !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address.';
  return null;
};

/** Run multiple validators, return first error or null. */
export const validate = (...checks: (string | null)[]): string | null => {
  return checks.find(c => c !== null) ?? null;
};
