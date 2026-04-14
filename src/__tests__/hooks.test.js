/**
 * Tests for custom action hooks — verifies role guards, toast calls, and fetchData triggers.
 * Hooks are tested as plain functions (they don't use React state, just wrap service calls).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock dependencies ────────────────────────────────────────────────────────

const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({ toast: (...args) => mockToast(...args) }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
vi.mock('@/lib/rateLimit', () => ({
  guardAction: (_key, fn) => fn, // passthrough — no rate limiting in tests
}));

// Mock all firestoreService functions
const mockAssignReferee = vi.fn().mockResolvedValue({ data: true });
const mockUnassignReferee = vi.fn().mockResolvedValue({ data: true });
const mockUpdateAssignment = vi.fn().mockResolvedValue({ data: true });
const mockAssignCourtSchedule = vi.fn().mockResolvedValue({ data: true });
const mockRequestAssignment = vi.fn().mockResolvedValue({ data: true });
const mockBatchUnassignRefereesRecord = vi.fn().mockResolvedValue({ data: true });
const mockWriteAuditLog = vi.fn().mockResolvedValue(undefined);
const mockSendMessageRecord = vi.fn().mockResolvedValue({ data: true });
const mockMarkMessageRead = vi.fn().mockResolvedValue({ data: true });
const mockSubmitGameReportRecord = vi.fn().mockResolvedValue({ data: true });
const mockAddReportResolutionRecord = vi.fn().mockResolvedValue({ data: true });
const mockSaveNotificationPreferencesRecord = vi.fn().mockResolvedValue({ data: true });
const mockAddAvailabilityRecord = vi.fn().mockResolvedValue({ data: true });
const mockAddIndependentGameRecord = vi.fn().mockResolvedValue({ data: true });
const mockUpdateIndependentGameRecord = vi.fn().mockResolvedValue({ data: true });
const mockDeleteIndependentGameRecord = vi.fn().mockResolvedValue({ data: true });
const mockAddTournament = vi.fn().mockResolvedValue({ data: true });
const mockUpdateTournamentRecord = vi.fn().mockResolvedValue({ data: true });
const mockDeleteTournamentRecord = vi.fn().mockResolvedValue({ data: true });
const mockRequestManagerConnectionRecord = vi.fn().mockResolvedValue({ data: true });
const mockRespondToConnectionRecord = vi.fn().mockResolvedValue({ data: true });
const mockWithdrawConnectionRecord = vi.fn().mockResolvedValue({ data: true });
const mockMarkNotificationReadRecord = vi.fn().mockResolvedValue({ data: true });
const mockMarkAllNotificationsReadRecord = vi.fn().mockResolvedValue({ data: true });
const mockBatchMarkPaymentsPaidRecord = vi.fn().mockResolvedValue({ data: true });
const mockRateRefereeRecord = vi.fn().mockResolvedValue({ data: true });

vi.mock('@/lib/firestoreService', () => ({
  assignReferee: (...a) => mockAssignReferee(...a),
  unassignReferee: (...a) => mockUnassignReferee(...a),
  updateAssignment: (...a) => mockUpdateAssignment(...a),
  assignCourtSchedule: (...a) => mockAssignCourtSchedule(...a),
  requestAssignment: (...a) => mockRequestAssignment(...a),
  batchUnassignRefereesRecord: (...a) => mockBatchUnassignRefereesRecord(...a),
  writeAuditLog: (...a) => mockWriteAuditLog(...a),
  sendMessageRecord: (...a) => mockSendMessageRecord(...a),
  markMessageRead: (...a) => mockMarkMessageRead(...a),
  submitGameReportRecord: (...a) => mockSubmitGameReportRecord(...a),
  addReportResolutionRecord: (...a) => mockAddReportResolutionRecord(...a),
  saveNotificationPreferencesRecord: (...a) => mockSaveNotificationPreferencesRecord(...a),
  addAvailabilityRecord: (...a) => mockAddAvailabilityRecord(...a),
  addIndependentGameRecord: (...a) => mockAddIndependentGameRecord(...a),
  updateIndependentGameRecord: (...a) => mockUpdateIndependentGameRecord(...a),
  deleteIndependentGameRecord: (...a) => mockDeleteIndependentGameRecord(...a),
  addTournament: (...a) => mockAddTournament(...a),
  updateTournamentRecord: (...a) => mockUpdateTournamentRecord(...a),
  deleteTournamentRecord: (...a) => mockDeleteTournamentRecord(...a),
  requestManagerConnectionRecord: (...a) => mockRequestManagerConnectionRecord(...a),
  respondToConnectionRecord: (...a) => mockRespondToConnectionRecord(...a),
  withdrawConnectionRecord: (...a) => mockWithdrawConnectionRecord(...a),
  markNotificationReadRecord: (...a) => mockMarkNotificationReadRecord(...a),
  markAllNotificationsReadRecord: (...a) => mockMarkAllNotificationsReadRecord(...a),
  batchMarkPaymentsPaidRecord: (...a) => mockBatchMarkPaymentsPaidRecord(...a),
  rateRefereeRecord: (...a) => mockRateRefereeRecord(...a),
}));

// ── Import hooks (after mocks) ───────────────────────────────────────────────

const { useAssignmentActions } = await import('@/hooks/useAssignmentActions');
const { useMessageActions } = await import('@/hooks/useMessageActions');
const { useReportActions } = await import('@/hooks/useReportActions');
const { useTournamentActions } = await import('@/hooks/useTournamentActions');
const { useConnectionActions } = await import('@/hooks/useConnectionActions');
const { useNotificationActions } = await import('@/hooks/useNotificationActions');
const { useSettingsActions } = await import('@/hooks/useSettingsActions');
const { useIndependentGameActions } = await import('@/hooks/useIndependentGameActions');
const { usePaymentActions } = await import('@/hooks/usePaymentActions');

// ── Test Data ────────────────────────────────────────────────────────────────

const manager = { id: 'mgr-1', name: 'Manager', email: 'mgr@test.com', role: 'manager' };
const referee = { id: 'ref-1', name: 'Referee', email: 'ref@test.com', role: 'referee' };
const fetchData = vi.fn().mockResolvedValue(undefined);

// ── Assignment Actions ───────────────────────────────────────────────────────

describe('useAssignmentActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('assignRefereeToGame calls service for manager', async () => {
    const { assignRefereeToGame } = useAssignmentActions(manager, fetchData);
    await assignRefereeToGame('game-1', 'ref-1');
    expect(mockAssignReferee).toHaveBeenCalledWith(manager, 'game-1', 'ref-1');
    expect(fetchData).toHaveBeenCalledWith(false);
  });

  it('assignRefereeToGame is no-op for referee', async () => {
    const { assignRefereeToGame } = useAssignmentActions(referee, fetchData);
    await assignRefereeToGame('game-1', 'ref-1');
    expect(mockAssignReferee).not.toHaveBeenCalled();
  });

  it('assignRefereeToGame is no-op for null user', async () => {
    const { assignRefereeToGame } = useAssignmentActions(null, fetchData);
    await assignRefereeToGame('game-1', 'ref-1');
    expect(mockAssignReferee).not.toHaveBeenCalled();
  });

  it('unassignRefereeFromGame calls service and refreshes', async () => {
    const { unassignRefereeFromGame } = useAssignmentActions(manager, fetchData);
    await unassignRefereeFromGame('assign-1');
    expect(mockUnassignReferee).toHaveBeenCalledWith(manager, 'assign-1');
    expect(fetchData).toHaveBeenCalledWith(false);
  });

  it('updateAssignmentStatus works for referee', async () => {
    const { updateAssignmentStatus } = useAssignmentActions(referee, fetchData);
    await updateAssignmentStatus('assign-1', 'accepted');
    expect(mockUpdateAssignment).toHaveBeenCalledWith(referee, 'assign-1', 'accepted', null);
  });

  it('batchUnassignReferees works for manager', async () => {
    const { batchUnassignReferees } = useAssignmentActions(manager, fetchData);
    await batchUnassignReferees(['g1', 'g2']);
    expect(mockBatchUnassignRefereesRecord).toHaveBeenCalledWith(manager, ['g1', 'g2']);
  });

  it('shows error toast on service failure', async () => {
    mockAssignReferee.mockResolvedValueOnce({ error: { message: 'Failed' } });
    const { assignRefereeToGame } = useAssignmentActions(manager, fetchData);
    await assignRefereeToGame('game-1', 'ref-1');
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: 'destructive' }));
  });
});

// ── Message Actions ──────────────────────────────────────────────────────────

describe('useMessageActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sendMessage calls service and refreshes', async () => {
    const { sendMessage } = useMessageActions(referee, fetchData);
    await sendMessage({ recipientId: 'mgr-1', subject: 'Hi', content: 'Hello' });
    expect(mockSendMessageRecord).toHaveBeenCalled();
    expect(fetchData).toHaveBeenCalledWith(false);
  });

  it('sendMessage is no-op for null user', async () => {
    const { sendMessage } = useMessageActions(null, fetchData);
    await sendMessage({ recipientId: 'mgr-1', subject: 'Hi', content: 'Hello' });
    expect(mockSendMessageRecord).not.toHaveBeenCalled();
  });

  it('markMessageAsRead calls service', async () => {
    const { markMessageAsRead } = useMessageActions(referee, fetchData);
    await markMessageAsRead('msg-1');
    expect(mockMarkMessageRead).toHaveBeenCalledWith(referee, 'msg-1');
  });
});

// ── Tournament Actions ───────────────────────────────────────────────────────

describe('useTournamentActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('addTournament calls service for manager', async () => {
    const { addTournament } = useTournamentActions(manager, fetchData);
    await addTournament({ name: 'T1', location: 'L1', startDate: '2026-01-01', endDate: '2026-01-02', numberOfCourts: 2 });
    expect(mockAddTournament).toHaveBeenCalled();
  });

  it('deleteTournament calls service for manager', async () => {
    const { deleteTournament } = useTournamentActions(manager, fetchData);
    await deleteTournament('t-1');
    expect(mockDeleteTournamentRecord).toHaveBeenCalledWith(manager, 't-1');
  });
});

// ── Connection Actions ───────────────────────────────────────────────────────

describe('useConnectionActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('requestManagerConnection works for referee', async () => {
    const { requestManagerConnection } = useConnectionActions(referee, fetchData);
    await requestManagerConnection('mgr-1', 'Please add me');
    expect(mockRequestManagerConnectionRecord).toHaveBeenCalledWith(referee, 'mgr-1', 'Please add me');
  });

  it('requestManagerConnection is no-op for manager', async () => {
    const { requestManagerConnection } = useConnectionActions(manager, fetchData);
    await requestManagerConnection('other', 'note');
    expect(mockRequestManagerConnectionRecord).not.toHaveBeenCalled();
  });

  it('respondToConnection works for manager', async () => {
    const { respondToConnection } = useConnectionActions(manager, fetchData);
    await respondToConnection('conn-1', 'connected');
    expect(mockRespondToConnectionRecord).toHaveBeenCalledWith(manager, 'conn-1', 'connected');
  });
});

// ── Report Actions ───────────────────────────────────────────────────────────

describe('useReportActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('submitGameReport works for referee and returns true', async () => {
    const { submitGameReport } = useReportActions(referee, fetchData);
    const result = await submitGameReport({ gameId: 'g1', notes: 'Good game' });
    expect(result).toBe(true);
    expect(mockSubmitGameReportRecord).toHaveBeenCalled();
  });

  it('submitGameReport returns false on error', async () => {
    mockSubmitGameReportRecord.mockResolvedValueOnce({ error: { message: 'Err' } });
    const { submitGameReport } = useReportActions(referee, fetchData);
    const result = await submitGameReport({ gameId: 'g1' });
    expect(result).toBe(false);
  });

  it('addReportResolution works for manager', async () => {
    const { addReportResolution } = useReportActions(manager, fetchData);
    await addReportResolution('rpt-1', 'Resolved');
    expect(mockAddReportResolutionRecord).toHaveBeenCalledWith(manager, 'rpt-1', 'Resolved');
  });
});

// ── Notification Actions ─────────────────────────────────────────────────────

describe('useNotificationActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('markNotificationRead calls service', async () => {
    const { markNotificationRead } = useNotificationActions(referee, fetchData);
    await markNotificationRead('notif-1');
    expect(mockMarkNotificationReadRecord).toHaveBeenCalledWith(referee, 'notif-1');
  });

  it('markAllNotificationsRead calls service', async () => {
    const { markAllNotificationsRead } = useNotificationActions(referee, fetchData);
    await markAllNotificationsRead();
    expect(mockMarkAllNotificationsReadRecord).toHaveBeenCalledWith(referee);
  });

  it('is no-op for null user', async () => {
    const { markNotificationRead } = useNotificationActions(null, fetchData);
    await markNotificationRead('notif-1');
    expect(mockMarkNotificationReadRecord).not.toHaveBeenCalled();
  });
});

// ── Settings Actions ─────────────────────────────────────────────────────────

describe('useSettingsActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('saveNotificationPreferences calls service and refreshes', async () => {
    const { saveNotificationPreferences } = useSettingsActions(referee, fetchData);
    await saveNotificationPreferences({ push: true, email: false });
    expect(mockSaveNotificationPreferencesRecord).toHaveBeenCalledWith(referee, { push: true, email: false });
    expect(fetchData).toHaveBeenCalledWith(false);
  });
});

// ── Independent Game Actions ─────────────────────────────────────────────────

describe('useIndependentGameActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('addIndependentGame calls service', async () => {
    const { addIndependentGame } = useIndependentGameActions(referee, fetchData);
    await addIndependentGame({ date: '2026-01-01', location: 'Gym', fee: 50 });
    expect(mockAddIndependentGameRecord).toHaveBeenCalled();
  });

  it('deleteIndependentGame calls service', async () => {
    const { deleteIndependentGame } = useIndependentGameActions(referee, fetchData);
    await deleteIndependentGame('ig-1');
    expect(mockDeleteIndependentGameRecord).toHaveBeenCalledWith(referee, 'ig-1');
  });
});

// ── Payment Actions ──────────────────────────────────────────────────────────

describe('usePaymentActions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rateReferee works for manager', async () => {
    const { rateReferee } = usePaymentActions(manager, fetchData);
    await rateReferee('g1', 'r1', 5, 'Great!');
    expect(mockRateRefereeRecord).toHaveBeenCalledWith(manager, 'g1', 'r1', 5, 'Great!');
  });

  it('rateReferee is no-op for referee', async () => {
    const { rateReferee } = usePaymentActions(referee, fetchData);
    await rateReferee('g1', 'r1', 5, 'Great!');
    expect(mockRateRefereeRecord).not.toHaveBeenCalled();
  });
});
