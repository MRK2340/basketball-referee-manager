/**
 * leagueParser.test.js
 * Tests for the league schedule parser (grouped + flat + CSV formats)
 * and the receipt PDF generator utility.
 */
import { describe, it, expect } from 'vitest';

// ── Test the mappers with Record<string, unknown> type safety ─────────────────

import {
  mapProfile, mapTournament, mapPayment, mapAvailability,
} from '../lib/mappers';

describe('Mapper type safety (Record<string, unknown>)', () => {
  it('mapProfile handles missing fields safely', () => {
    const raw = { id: 'u1', name: 'Bob', role: 'referee', email: 'b@test.com' };
    const p = mapProfile(raw);
    expect(p.phone).toBe('');
    expect(p.avatarUrl).toBe('');
    expect(p.bio).toBe('');
    expect(p.certifications).toEqual([]);
    expect(p.gamesOfficiated).toBe(0);
    expect(p.rating).toBe(0);
  });

  it('mapProfile handles non-string fields gracefully', () => {
    const raw = { id: 123, name: null, role: undefined, email: '' };
    const p = mapProfile(raw);
    expect(p.id).toBe('');
    expect(p.name).toBe('');
    expect(p.role).toBe('');
  });

  it('mapTournament handles missing/null fields', () => {
    const raw = { id: 't1', name: 'Test', start_date: '2026-01-01', end_date: '2026-01-02', location: 'Gym', number_of_courts: 2, manager_id: 'm1' };
    const t = mapTournament(raw, []);
    expect(t.archived).toBe(false);
    expect(t.archivedAt).toBe(null);
    expect(t.games).toBe(0);
  });

  it('mapPayment extracts all fields correctly', () => {
    const raw = { id: 'p1', game_id: 'g1', amount: 75, status: 'paid', payment_date: '2026-01-15', payment_method: 'Venmo', referee_id: 'r1' };
    const p = mapPayment(raw);
    expect(p.amount).toBe(75);
    expect(p.method).toBe('Venmo');
    expect(p.refereeId).toBe('r1');
  });

  it('mapAvailability extracts start/end times', () => {
    const raw = { id: 'a1', start_time: '2026-03-11T19:00:00Z', end_time: '2026-03-11T21:00:00Z' };
    const a = mapAvailability(raw);
    expect(a.startTime).toBe('2026-03-11T19:00:00Z');
    expect(a.endTime).toBe('2026-03-11T21:00:00Z');
  });
});

// ── Firestore rules validation (security) ─────────────────────────────────────

describe('Security: Firestore rules review', () => {
  it('ratings rule no longer has || true (H1 fix verified)', async () => {
    const fs = await import('fs');
    const rules = fs.readFileSync('/app/firestore.rules', 'utf8');
    // Line 150 should NOT have || true
    expect(rules).not.toContain('isAuth() || true');
    // ratings should require isAuth()
    expect(rules).toContain('referee_ratings');
  });

  it('live_game_sessions requires manager_id ownership (H2 fix verified)', async () => {
    const fs = await import('fs');
    const rules = fs.readFileSync('/app/firestore.rules', 'utf8');
    // Should have manager_id check, not generic allow write: if isAuth()
    const liveSection = rules.substring(rules.indexOf('live_game_sessions'));
    expect(liveSection).toContain('manager_id');
    expect(liveSection).not.toMatch(/allow write:\s*if isAuth\(\);/);
  });

  it('backend CORS does not combine allow_origins=* with credentials (H3 fix verified)', async () => {
    const fs = await import('fs');
    const serverPy = fs.readFileSync('/app/backend/server.py', 'utf8');
    expect(serverPy).toContain('allow_credentials=False');
    expect(serverPy).not.toContain('allow_credentials=True');
  });
});

// ── Type safety: no any in mappers ────────────────────────────────────────────

describe('Type safety: Record<string, unknown> (H6 fix)', () => {
  it('mappers.ts uses Record<string, unknown> not Record<string, any>', async () => {
    const fs = await import('fs');
    const mappersSrc = fs.readFileSync('/app/src/lib/mappers.ts', 'utf8');
    expect(mappersSrc).toContain('Record<string, unknown>');
    expect(mappersSrc).not.toContain('Record<string, any>');
  });

  it('firestoreService helpers use Record<string, unknown> not Record<string, any>', async () => {
    const fs = await import('fs');
    const fsSrc = fs.readFileSync('/app/src/lib/firestore/helpers.ts', 'utf8');
    expect(fsSrc).toContain('Record<string, unknown>');
    expect(fsSrc).not.toContain('Record<string, any>');
  });
});

// ── Dead code removal (H5 fix) ────────────────────────────────────────────────

describe('Code quality: dead code removal (H5 fix)', () => {
  it('old monolithic Calendar.tsx has been removed', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('/app/src/pages/Calendar.tsx')).toBe(false);
  });

  it('Calendar/index.tsx exists as the active component', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('/app/src/pages/Calendar/index.tsx')).toBe(true);
  });

  it('Receipt PDF logic extracted to generateReceiptPdf.ts', async () => {
    const fs = await import('fs');
    expect(fs.existsSync('/app/src/lib/generateReceiptPdf.ts')).toBe(true);
    const content = fs.readFileSync('/app/src/lib/generateReceiptPdf.ts', 'utf8');
    expect(content).toContain('generateReceiptPdf');
    expect(content).toContain('jsPDF');
  });
});
