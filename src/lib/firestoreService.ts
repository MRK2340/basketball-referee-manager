/**
 * firestoreService.ts
 * Barrel re-export — all Firestore operations in one import path.
 *
 * Modules:
 *   firestore/helpers.ts   — safeHandle, chunkArray, docsToArr, Doc type
 *   firestore/data.ts      — fetchAppData (main data loader)
 *   firestore/crud.ts      — Tournaments, Games, Assignments, Messages, etc.
 *   firestore/imports.ts   — Batch imports, duplicate detection, import history
 *   firestore/advanced.ts  — Pagination, profiles, audit, GDPR, AI, brackets, etc.
 */

// Helpers (only re-export what consumers need)
export { toISOString } from './firestore/helpers';
export type { Doc } from './firestore/helpers';

// Data loader
export { fetchAppData } from './firestore/data';

// CRUD
export {
  addTournament, updateTournamentRecord, deleteTournamentRecord, archiveTournamentRecord,
  addGameRecord, markGameCompleted,
  assignReferee, unassignReferee, updateAssignment, assignCourtSchedule, requestAssignment,
  sendMessageRecord, markMessageRead,
  addAvailabilityRecord, addAvailability,
  submitGameReportRecord,
  markNotificationReadRecord, markAllNotificationsReadRecord,
  batchMarkPaymentsPaidRecord,
  batchUnassignRefereesRecord,
  rateRefereeRecord,
  saveNotificationPreferencesRecord,
  addReportResolutionRecord,
  requestManagerConnectionRecord, respondToConnectionRecord, withdrawConnectionRecord,
  addIndependentGameRecord, updateIndependentGameRecord, deleteIndependentGameRecord,
} from './firestore/crud';

// Imports
export {
  batchImportRefereeSchedule, batchImportManagerGames, batchImportLeagueSchedule,
  checkRefereeDuplicates, checkManagerDuplicates,
  fetchImportHistory, undoImport,
} from './firestore/imports';
export type { ImportHistoryRecord, LeagueImportGame } from './firestore/imports';

// Advanced
export {
  fetchMoreMessages, fetchMoreGames, fetchMoreTournaments, fetchMoreNotifications,
  fetchPublicRefereeProfile,
  writeAuditLog,
  exportUserData, deleteUserData,
  saveAIChatHistory, loadAIChatHistory, clearAIChatHistory,
  generateAutoAssignSuggestions,
  saveBracket, loadBracket, deleteBracket,
  fetchLoginHistory,
  saveFeedback,
  fetchPaymentInfo, savePaymentInfo,
} from './firestore/advanced';
export type { LoginEvent, PaymentInfo } from './firestore/advanced';
