/**
 * Tests for firestoreService.ts — Firestore CRUD operations and validation.
 * Uses mocked Firebase SDK to test business logic without hitting Firestore.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Firebase before importing the service ───────────────────────────────

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' });
const mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
const mockDeleteDoc = vi.fn().mockResolvedValue(undefined);
const mockSetDoc = vi.fn().mockResolvedValue(undefined);
const mockGetDoc = vi.fn();
const mockGetDocs = vi.fn();
const mockDoc = vi.fn().mockReturnValue({ id: 'mock-doc' });
const mockCollection = vi.fn().mockReturnValue('mock-col');
const mockQuery = vi.fn().mockReturnValue('mock-q');
const mockWhere = vi.fn().mockReturnValue('mock-where');
const mockOrderBy = vi.fn().mockReturnValue('mock-orderBy');
const mockLimit = vi.fn().mockReturnValue('mock-limit');
const mockWriteBatch = vi.fn().mockReturnValue({
  set: vi.fn(), update: vi.fn(), delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
});
const mockDocumentId = vi.fn().mockReturnValue('__name__');

vi.mock('firebase/firestore', () => ({
  addDoc: (...args) => mockAddDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  doc: (...args) => mockDoc(...args),
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  orderBy: (...args) => mockOrderBy(...args),
  limit: (...args) => mockLimit(...args),
  writeBatch: (...args) => mockWriteBatch(...args),
  documentId: (...args) => mockDocumentId(...args),
  onSnapshot: vi.fn().mockReturnValue(vi.fn()),
  getFirestore: vi.fn().mockReturnValue({}),
  enableIndexedDbPersistence: vi.fn().mockResolvedValue(undefined),
  FieldValue: { serverTimestamp: vi.fn() },
  serverTimestamp: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({ db: {}, default: {} }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/performanceTraces', () => ({ traceAsync: (_, fn) => fn(), startTrace: () => null, stopTrace: () => {} }));

// Dynamic import after mocks are set up
const firestoreService = await import('@/lib/firestoreService');

// ── Test Data ────────────────────────────────────────────────────────────────

const managerUser = { id: 'mgr-1', name: 'Test Manager', email: 'mgr@test.com', role: 'manager' };
const refereeUser = { id: 'ref-1', name: 'Test Referee', email: 'ref@test.com', role: 'referee' };

// ── Tournament Tests ─────────────────────────────────────────────────────────

describe('addTournament', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates a tournament for a manager', async () => {
    const { data, error } = await firestoreService.addTournament(managerUser, {
      name: 'Spring Classic',
      location: 'Atlanta Arena',
      startDate: '2026-05-15',
      endDate: '2026-05-17',
      numberOfCourts: 4,
    });
    expect(error).toBeUndefined();
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
  });

  it('rejects non-manager users', async () => {
    const { error } = await firestoreService.addTournament(refereeUser, {
      name: 'Test', location: 'Test', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 1,
    });
    expect(error).toBeDefined();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('validates required fields', async () => {
    const { error } = await firestoreService.addTournament(managerUser, {
      name: '', location: 'Test', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 1,
    });
    expect(error).toBeDefined();
    expect(error.message).toContain('required');
  });

  it('validates date format', async () => {
    const { error } = await firestoreService.addTournament(managerUser, {
      name: 'Test', location: 'Test', startDate: 'bad-date', endDate: '2026-01-02', numberOfCourts: 1,
    });
    expect(error).toBeDefined();
  });

  it('validates court count range', async () => {
    const { error } = await firestoreService.addTournament(managerUser, {
      name: 'Test', location: 'Test', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 999,
    });
    expect(error).toBeDefined();
  });
});

// ── Game Record Tests ────────────────────────────────────────────────────────

describe('addGameRecord', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates a game for a manager', async () => {
    const { error } = await firestoreService.addGameRecord(managerUser, {
      home_team: 'Hawks', away_team: 'Eagles', game_date: '2026-06-01',
      game_time: '09:00', venue: 'Gym', tournament_id: 't1', status: 'scheduled',
    });
    expect(error).toBeUndefined();
    expect(mockAddDoc).toHaveBeenCalledTimes(1);
  });

  it('rejects non-manager users', async () => {
    const { error } = await firestoreService.addGameRecord(refereeUser, {
      home_team: 'A', away_team: 'B', game_date: '2026-01-01', game_time: '10:00', venue: 'V',
    });
    expect(error).toBeDefined();
  });

  it('validates team names are required', async () => {
    const { error } = await firestoreService.addGameRecord(managerUser, {
      home_team: '', away_team: 'B', game_date: '2026-01-01', game_time: '10:00', venue: 'V',
    });
    expect(error).toBeDefined();
    expect(error.message).toContain('required');
  });

  it('validates date format', async () => {
    const { error } = await firestoreService.addGameRecord(managerUser, {
      home_team: 'A', away_team: 'B', game_date: 'not-a-date', game_time: '10:00', venue: 'V',
    });
    expect(error).toBeDefined();
  });

  it('validates payment amount range', async () => {
    const { error } = await firestoreService.addGameRecord(managerUser, {
      home_team: 'A', away_team: 'B', game_date: '2026-01-01', game_time: '10:00',
      venue: 'V', payment_amount: -50,
    });
    expect(error).toBeDefined();
  });
});

// ── Message Tests ────────────────────────────────────────────────────────────

describe('sendMessageRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ name: 'Recipient' }) });
  });

  it('sends a message to a valid recipient', async () => {
    const { error } = await firestoreService.sendMessageRecord(refereeUser, {
      recipientId: 'other-user', subject: 'Hello', content: 'Test message',
    });
    expect(error).toBeUndefined();
    expect(mockAddDoc).toHaveBeenCalled();
  });

  it('rejects empty recipient ID', async () => {
    const { error } = await firestoreService.sendMessageRecord(refereeUser, {
      recipientId: '', subject: 'Hello', content: 'Test',
    });
    expect(error).toBeDefined();
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('rejects self-messaging', async () => {
    const { error } = await firestoreService.sendMessageRecord(refereeUser, {
      recipientId: refereeUser.id, subject: 'Hello', content: 'Test',
    });
    expect(error).toBeDefined();
  });

  it('rejects non-existent recipient', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });
    const { error } = await firestoreService.sendMessageRecord(refereeUser, {
      recipientId: 'nonexistent', subject: 'Hello', content: 'Test',
    });
    expect(error).toBeDefined();
  });

  it('validates message content length', async () => {
    const { error } = await firestoreService.sendMessageRecord(refereeUser, {
      recipientId: 'other-user', subject: 'Hello', content: 'x'.repeat(6000),
    });
    expect(error).toBeDefined();
  });
});

// ── Batch Import Tests ───────────────────────────────────────────────────────

describe('batchImportRefereeSchedule', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('imports past games and future availability', async () => {
    const { data, error } = await firestoreService.batchImportRefereeSchedule(
      refereeUser,
      [{ date: '2025-01-01', time: '10:00', location: 'Gym', organization: 'League', fee: 75, level: 'Varsity' }],
      [{ date: '2026-12-01', time: '09:00' }],
      'test.csv',
    );
    expect(error).toBeUndefined();
    expect(data.gamesAdded).toBe(1);
    expect(data.availabilityAdded).toBe(1);
  });

  it('rejects non-referee users', async () => {
    const { error } = await firestoreService.batchImportRefereeSchedule(managerUser, [], [], 'test.csv');
    expect(error).toBeDefined();
  });
});

describe('batchImportManagerGames', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('imports games for a tournament', async () => {
    const { data, error } = await firestoreService.batchImportManagerGames(
      managerUser, 'tournament-1',
      [{ homeTeam: 'A', awayTeam: 'B', date: '2026-05-15', time: '10:00', venue: 'Gym', division: 'U14', level: 'Varsity', payment: 75 }],
      'bracket.csv',
    );
    expect(error).toBeUndefined();
    expect(data.added).toBe(1);
  });

  it('rejects non-manager users', async () => {
    const { error } = await firestoreService.batchImportManagerGames(refereeUser, 't1', [], 'test.csv');
    expect(error).toBeDefined();
  });
});

// ── Error Sanitization Tests ─────────────────────────────────────────────────

describe('Error sanitization', () => {
  it('maps permission-denied to user-friendly message', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('PERMISSION_DENIED: Missing permissions'));
    const { error } = await firestoreService.addTournament(managerUser, {
      name: 'Test', location: 'Test', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 1,
    });
    expect(error).toBeDefined();
    expect(error.message).not.toContain('PERMISSION_DENIED');
    expect(error.message).toContain('permission');
  });

  it('does not expose raw Firebase error messages', async () => {
    mockAddDoc.mockRejectedValueOnce(new Error('Firestore internal stack trace at line 4567'));
    const { error } = await firestoreService.addTournament(managerUser, {
      name: 'Test', location: 'Test', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 1,
    });
    expect(error).toBeDefined();
    expect(error.message).not.toContain('stack trace');
    expect(error.message).not.toContain('line 4567');
  });
});
