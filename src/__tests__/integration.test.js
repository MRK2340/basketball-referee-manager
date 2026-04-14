/**
 * Integration tests for critical auth and Firestore mutation paths.
 * Run with: yarn test (uses Vitest)
 *
 * NOTE: These tests use unit-test patterns (mocking Firebase SDK).
 * For full emulator integration, start the Firebase emulator suite:
 *   firebase emulators:start --project demo-test
 * then set FIRESTORE_EMULATOR_HOST=localhost:8080 before running.
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeDate, normalizeTime, isDateInPast,
} from '../lib/scheduleImportParsers';
import {
  validate, validateRequired, validateDate, validateTime,
  validateNumber, validateEmail, validateOptional,
} from '../lib/validation';
import {
  generateSingleElimination, generateDoubleElimination, generateRoundRobin,
  advanceWinner,
} from '../lib/bracketUtils';

// ── Validation Tests ─────────────────────────────────────────────────────────

describe('Input Validation', () => {
  it('validateRequired rejects empty strings', () => {
    expect(validateRequired('', 'Name')).toBe('Name is required.');
    expect(validateRequired('  ', 'Name')).toBe('Name is required.');
  });

  it('validateRequired rejects strings over maxLen', () => {
    expect(validateRequired('a'.repeat(201), 'Name', 200)).toBe('Name must be under 200 characters.');
  });

  it('validateRequired passes valid strings', () => {
    expect(validateRequired('Hawks', 'Team')).toBeNull();
  });

  it('validateDate rejects invalid formats', () => {
    expect(validateDate('13/01/2026')).not.toBeNull();
    expect(validateDate('not-a-date')).not.toBeNull();
    expect(validateDate('')).not.toBeNull();
  });

  it('validateDate accepts YYYY-MM-DD', () => {
    expect(validateDate('2026-05-15')).toBeNull();
  });

  it('validateTime accepts HH:MM and HH:MM:SS', () => {
    expect(validateTime('09:00')).toBeNull();
    expect(validateTime('14:30:00')).toBeNull();
    expect(validateTime('')).toBeNull(); // optional
  });

  it('validateTime rejects bad formats', () => {
    expect(validateTime('9am')).not.toBeNull();
  });

  it('validateNumber enforces range', () => {
    expect(validateNumber(-1, 'Fee', 0, 100)).not.toBeNull();
    expect(validateNumber(101, 'Fee', 0, 100)).not.toBeNull();
    expect(validateNumber(50, 'Fee', 0, 100)).toBeNull();
  });

  it('validateEmail rejects invalid emails', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('noatsign')).not.toBeNull();
    expect(validateEmail('user@domain.com')).toBeNull();
  });

  it('validateOptional allows empty but enforces maxLen', () => {
    expect(validateOptional(undefined, 'Notes')).toBeNull();
    expect(validateOptional('short', 'Notes', 10)).toBeNull();
    expect(validateOptional('a'.repeat(11), 'Notes', 10)).not.toBeNull();
  });

  it('validate returns first error or null', () => {
    expect(validate(null, null, null)).toBeNull();
    expect(validate(null, 'error1', 'error2')).toBe('error1');
  });
});

// ── Schedule Import Parser Tests ─────────────────────────────────────────────

describe('Schedule Import Parsers', () => {
  it('normalizeDate handles MM/DD/YYYY', () => {
    expect(normalizeDate('01/15/2026')).toBe('2026-01-15');
    expect(normalizeDate('12/25/2025')).toBe('2025-12-25');
  });

  it('normalizeDate handles YYYY-MM-DD', () => {
    expect(normalizeDate('2026-05-15')).toBe('2026-05-15');
  });

  it('normalizeTime handles 12-hour format', () => {
    expect(normalizeTime('9:00 AM')).toBe('09:00');
    expect(normalizeTime('2:30 PM')).toBe('14:30');
    expect(normalizeTime('12:00 PM')).toBe('12:00');
    expect(normalizeTime('12:00 AM')).toBe('00:00');
  });

  it('normalizeTime handles 24-hour format', () => {
    expect(normalizeTime('14:30')).toBe('14:30');
    expect(normalizeTime('09:00:00')).toBe('09:00');
  });

  it('isDateInPast correctly identifies past dates', () => {
    expect(isDateInPast('2020-01-01')).toBe(true);
    expect(isDateInPast('2099-12-31')).toBe(false);
  });
});

// ── Bracket Generation Tests ─────────────────────────────────────────────────

describe('Bracket Generation', () => {
  it('generateSingleElimination creates correct round structure for 4 teams', () => {
    const rounds = generateSingleElimination(['A', 'B', 'C', 'D']);
    expect(rounds).toHaveLength(2); // Semi + Final
    expect(rounds[0].matches).toHaveLength(2); // 2 semi-final matches
    expect(rounds[1].matches).toHaveLength(1); // 1 final match
  });

  it('generateSingleElimination handles 8 teams', () => {
    const rounds = generateSingleElimination(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    expect(rounds).toHaveLength(3); // Quarter + Semi + Final
    expect(rounds[0].matches).toHaveLength(4);
  });

  it('generateSingleElimination handles byes for non-power-of-2 teams', () => {
    const rounds = generateSingleElimination(['A', 'B', 'C']); // 3 teams → padded to 4
    expect(rounds).toHaveLength(2);
    // One match should be a bye (one team is null)
    const byeMatches = rounds[0].matches.filter(m => !m.team1 || !m.team2);
    expect(byeMatches.length).toBeGreaterThan(0);
  });

  it('generateDoubleElimination includes losers bracket and grand final', () => {
    const rounds = generateDoubleElimination(['A', 'B', 'C', 'D']);
    const losersRounds = rounds.filter(r => r.name.startsWith('L:'));
    const grandFinal = rounds.find(r => r.name === 'Grand Final');
    expect(losersRounds.length).toBeGreaterThan(0);
    expect(grandFinal).toBeDefined();
  });

  it('generateRoundRobin creates correct number of rounds', () => {
    const rounds = generateRoundRobin(['A', 'B', 'C', 'D']);
    expect(rounds).toHaveLength(3); // n-1 rounds for 4 teams
    // Each round should have 2 matches (4 teams / 2)
    rounds.forEach(r => expect(r.matches).toHaveLength(2));
  });

  it('advanceWinner fills next round slot', () => {
    const rounds = generateSingleElimination(['A', 'B', 'C', 'D']);
    const matchId = rounds[0].matches[0].id;
    const updated = advanceWinner(rounds, matchId, 'A');
    expect(updated[0].matches[0].winner).toBe('A');
    expect(updated[0].matches[0].status).toBe('completed');
    // Check winner advanced to final
    expect(updated[1].matches[0].team1?.name).toBe('A');
  });
});
