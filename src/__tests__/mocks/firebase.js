/**
 * Firebase mock factory for unit tests.
 * Provides mock implementations of Firebase Auth, Firestore, and Storage.
 */
import { vi } from 'vitest';

// ── Firestore Mocks ──────────────────────────────────────────────────────────

const mockDocRef = { id: 'mock-doc-id' };
const mockDocSnap = (exists = true, data = {}) => ({
  exists: () => exists,
  data: () => data,
  id: 'mock-doc-id',
});
const mockQuerySnap = (docs = []) => ({
  docs,
  empty: docs.length === 0,
  size: docs.length,
  forEach: (cb) => docs.forEach(cb),
});

export const firestoreMocks = {
  addDoc: vi.fn().mockResolvedValue(mockDocRef),
  updateDoc: vi.fn().mockResolvedValue(undefined),
  deleteDoc: vi.fn().mockResolvedValue(undefined),
  setDoc: vi.fn().mockResolvedValue(undefined),
  getDoc: vi.fn().mockResolvedValue(mockDocSnap(true, { name: 'Test User', role: 'referee' })),
  getDocs: vi.fn().mockResolvedValue(mockQuerySnap([])),
  doc: vi.fn().mockReturnValue(mockDocRef),
  collection: vi.fn().mockReturnValue('mock-collection'),
  query: vi.fn().mockReturnValue('mock-query'),
  where: vi.fn().mockReturnValue('mock-where'),
  orderBy: vi.fn().mockReturnValue('mock-orderBy'),
  limit: vi.fn().mockReturnValue('mock-limit'),
  writeBatch: vi.fn().mockReturnValue({
    set: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  }),
  documentId: vi.fn().mockReturnValue('__name__'),
  onSnapshot: vi.fn().mockReturnValue(vi.fn()), // unsubscribe function
  serverTimestamp: vi.fn().mockReturnValue(new Date().toISOString()),
  mockDocSnap,
  mockQuerySnap,
};

// ── Auth Mocks ───────────────────────────────────────────────────────────────

export const authMocks = {
  signInWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: 'test-uid', email: 'test@test.com' },
  }),
  createUserWithEmailAndPassword: vi.fn().mockResolvedValue({
    user: { uid: 'new-uid', email: 'new@test.com', sendEmailVerification: vi.fn() },
  }),
  signOut: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  onAuthStateChanged: vi.fn().mockReturnValue(vi.fn()), // unsubscribe
  getMultiFactorResolver: vi.fn(),
  multiFactor: vi.fn(),
  auth: { currentUser: null },
};

// ── Toast Mock ───────────────────────────────────────────────────────────────

export const toastMock = vi.fn();

// ── Logger Mock ──────────────────────────────────────────────────────────────

export const loggerMock = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};
