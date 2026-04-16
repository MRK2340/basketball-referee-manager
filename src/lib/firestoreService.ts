/**
 * firestoreService.ts
 * Async Firestore DB service.
 *
 * Pure data mappers live in ./mappers.ts (testable in isolation).
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, documentId, serverTimestamp, writeBatch,
  type DocumentSnapshot, type QuerySnapshot,
} from 'firebase/firestore';
import {
  mapProfile, mapConnection, mapGame, mapTournament,
  mapPayment, mapMessage, mapAvailability, mapGameReport,
  type MappedProfile, type MappedMessage,
} from './mappers';
import type { SafeResult, ServiceUser } from './types';
import { validate, validateRequired, validateOptional, validateDate, validateTime, validateNumber, MAX_TEAM_NAME, MAX_VENUE_NAME, MAX_TOURNAMENT_NAME, MAX_MESSAGE_LENGTH, MAX_FEE, MAX_COURTS } from './validation';

// ── Helpers ─────────────────────────────────────────────────────────────────

import { logger } from './logger';

/** Raw Firestore document type. Uses `unknown` for type safety — callers must narrow. */
type Doc = Record<string, unknown>;

/** Firestore error codes that are safe to retry (transient failures). */
const RETRYABLE_CODES = new Set([
  'unavailable', 'resource-exhausted', 'deadline-exceeded', 'aborted', 'internal',
]);

/** Extract the Firestore error code from an error object or message string. */
const extractErrorCode = (err: unknown): string => {
  const e = err as { code?: string; message?: string };
  // Firebase SDK errors have a `code` property like "firestore/permission-denied"
  if (e.code) {
    const parts = e.code.split('/');
    return parts[parts.length - 1].toLowerCase();
  }
  // Client-side throws use the code as the message prefix: "permission-denied: ..."
  const msg = e.message || '';
  const colonIdx = msg.indexOf(':');
  if (colonIdx > 0 && colonIdx < 30) {
    // Normalize "PERMISSION_DENIED" → "permission-denied"
    return msg.slice(0, colonIdx).trim().toLowerCase().replace(/_/g, '-');
  }
  // Last resort: scan for known keywords
  const lower = msg.toLowerCase();
  if (lower.includes('permission-denied') || lower.includes('permission')) return 'permission-denied';
  if (lower.includes('not-found')) return 'not-found';
  if (lower.includes('unauthenticated')) return 'unauthenticated';
  if (lower.includes('unavailable')) return 'unavailable';
  if (lower.includes('invalid-argument')) return 'invalid-argument';
  return 'unknown';
};

/** Map error codes to safe user-facing messages. */
const sanitizeError = (code: string, raw: string): string => {
  switch (code) {
    case 'permission-denied': return 'You don\'t have permission to perform this action.';
    case 'not-found': return 'The requested item was not found.';
    case 'already-exists': return 'This item already exists.';
    case 'unauthenticated': return 'Your session has expired. Please log in again.';
    case 'resource-exhausted': return 'Too many requests. Please wait a moment and try again.';
    case 'unavailable': return 'Network error. Please check your connection.';
    case 'deadline-exceeded': return 'The request timed out. Please try again.';
    case 'invalid-argument': return 'Invalid input. Please check your data and try again.';
    case 'failed-precondition': return 'This action cannot be performed right now. Please try again later.';
    case 'aborted': return 'The operation was interrupted. Please try again.';
    default: {
      // Fallback: check raw message for known patterns
      if (!raw) return 'An unexpected error occurred. Please try again.';
      const lower = raw.toLowerCase();
      if (lower.includes('network')) return 'Network error. Please check your connection.';
      if (lower.includes('timeout')) return 'The request timed out. Please try again.';
      return 'Something went wrong. Please try again.';
    }
  }
};

const safeHandle = async <T = true>(fn: () => Promise<T>): Promise<SafeResult<T>> => {
  try {
    const result = await fn();
    return { data: (result ?? true) as T };
  } catch (err: unknown) {
    const e = err as Error;
    const code = extractErrorCode(err);
    logger.error('[Firestore]', e);
    return {
      error: {
        message: sanitizeError(code, e.message || ''),
        code,
        retryable: RETRYABLE_CODES.has(code),
      },
    };
  }
};

const docToObj = (snap: DocumentSnapshot): Doc | null =>
  snap.exists() ? { id: snap.id, ...snap.data() } : null;

const docsToArr = (snap: QuerySnapshot): Doc[] =>
  snap.docs.map(d => ({ id: d.id, ...d.data() }));

// Normalize Firestore Timestamp or ISO string → ISO string for consistent sorting
import { toISOString } from './timestampUtils';
export { toISOString };

// Split an array into chunks of `size` — needed for Firestore `in` queries (30-item limit)
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

// ── fetchAppData ───────────────────────────────────────────────────

const INITIAL_PAGE = 100;

export const fetchAppData = async (user: ServiceUser) => {
  if (!user) return {} as Doc;
  const isManager = user.role === 'manager';

  // 1. M2 fix: two role-scoped queries + current user doc in parallel
  //    (replaces full collection scan — getDocs(collection(db, 'users')))
  const [refereeUserSnap, managerUserSnap, currentUserSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('role', '==', 'referee'))),
    getDocs(query(collection(db, 'users'), where('role', '==', 'manager'))),
    getDoc(doc(db, 'users', user.id)),
  ]);
  const allReferees = docsToArr(refereeUserSnap).map(mapProfile);
  const managerProfilesRaw = docsToArr(managerUserSnap).map(mapProfile);
  const allUsers = [...allReferees, ...managerProfilesRaw];

  // 2. Fetch games + assignments (based on role)
  let gamesRaw = [], assignmentsRaw = [];
  if (isManager) {
    const [gSnap, aSnap] = await Promise.all([
      getDocs(query(collection(db, 'games'), where('manager_id', '==', user.id), orderBy('game_date', 'desc'), limit(100))),
      getDocs(query(collection(db, 'game_assignments'), where('manager_id', '==', user.id))),
    ]);
    gamesRaw = docsToArr(gSnap);
    assignmentsRaw = docsToArr(aSnap);
  } else {
    // Referee: find their assignments, then fetch those games
    const aSnap = await getDocs(query(collection(db, 'game_assignments'), where('referee_id', '==', user.id)));
    assignmentsRaw = docsToArr(aSnap);
    const gameIds = [...new Set(assignmentsRaw.map(a => a.game_id))];
    if (gameIds.length > 0) {
      // H1 fix: single batch query per chunk instead of one getDoc() per game
      const chunks = chunkArray(gameIds, 30);
      const snapshots = await Promise.all(
        chunks.map(chunk =>
          getDocs(query(collection(db, 'games'), where(documentId(), 'in', chunk)))
        )
      );
      gamesRaw = snapshots.flatMap(docsToArr);
    }
  }

  // 3. Parallel fetch for everything else (manager profiles already derived above)
  const [
    tournamentsSnap, paymentsSnap, messagesSnap, notificationsSnap,
    availabilitySnap, gameReportsSnap, ratingsSnap, connectionsSnap,
    indGamesSnap,
  ] = await Promise.all([
    isManager
      ? getDocs(query(collection(db, 'tournaments'), where('manager_id', '==', user.id), orderBy('name'), limit(100)))
      : getDocs(query(collection(db, 'tournaments'), limit(100))),
    getDocs(isManager
      ? query(collection(db, 'payments'), where('manager_id', '==', user.id))
      : query(collection(db, 'payments'), where('referee_id', '==', user.id))),
    // M3 fix: server-side orderBy + limit — prevents unbounded reads for active users
    // P2 fix: aligned with useRealtimeMessages limit(100) to avoid duplicate initial fetch
    getDocs(query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      orderBy('created_at', 'desc'),
      limit(100),
    )),
    getDocs(query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(100),
    )),
    getDocs(query(collection(db, 'referee_availability'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? query(collection(db, 'game_reports'), where('manager_id', '==', user.id))
      : query(collection(db, 'game_reports'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? collection(db, 'referee_ratings')
      : query(collection(db, 'referee_ratings'), where('referee_id', '==', user.id))),
    getDocs(isManager
      ? query(collection(db, 'manager_connections'), where('manager_id', '==', user.id))
      : query(collection(db, 'manager_connections'), where('referee_id', '==', user.id))),
    isManager
      ? Promise.resolve({ docs: [] })
      : getDocs(query(collection(db, 'independent_games'), where('referee_id', '==', user.id))),
  ]);

  const tournamentsRaw = docsToArr(tournamentsSnap);
  const paymentsRaw = docsToArr(paymentsSnap);
  const messagesRaw = docsToArr(messagesSnap);
  const notificationsRaw = docsToArr(notificationsSnap);
  const availabilityRaw = docsToArr(availabilitySnap);
  const gameReportsRaw = docsToArr(gameReportsSnap);
  const ratingsRaw = docsToArr(ratingsSnap);
  const connectionsRaw = docsToArr(connectionsSnap);
  const indGamesRaw = docsToArr(indGamesSnap);

  // Read the current user's saved notification preferences (if any)
  const savedPrefs = currentUserSnap.exists()
    ? (currentUserSnap.data()?.notification_preferences || {})
    : {};
  const notificationPreferences = {
    gameAssignments: true, scheduleChanges: true, paymentUpdates: true,
    messages: true, emailNotifications: true, pushNotifications: false, smsNotifications: false,
    ...savedPrefs,
  };

  // M1 fix: pre-build a Map<referee_id → availability[]> for O(1) lookups.
  // Previous code ran availabilityRaw.filter() inside a .map() — O(n²).
  const availabilityByReferee = new Map();
  availabilityRaw.forEach(a => {
    const list = availabilityByReferee.get(a.referee_id) || [];
    list.push(mapAvailability(a));
    availabilityByReferee.set(a.referee_id, list);
  });

  // 4. Map everything into the app's expected format
  const sortedGames = [...gamesRaw].sort((a, b) => {
    const aStamp = `${a.game_date}T${a.game_time}`;
    const bStamp = `${b.game_date}T${b.game_time}`;
    return bStamp.localeCompare(aStamp);
  });

  return {
    games: sortedGames.map(g => mapGame(g.id, g, assignmentsRaw, allUsers, tournamentsRaw)),
    payments: paymentsRaw.map(mapPayment),
    messages: messagesRaw
      .sort((a, b) => toISOString(b.created_at).localeCompare(toISOString(a.created_at)))
      .map(m => mapMessage(m, allUsers)),
    notifications: notificationsRaw.sort((a, b) => toISOString(b.created_at).localeCompare(toISOString(a.created_at))),
    tournaments: tournamentsRaw.map(t => mapTournament(t, gamesRaw)),
    referees: allReferees.map(r => ({
      ...r,
      availability: availabilityByReferee.get(r.id) || [],
    })),
    availability: availabilityRaw.map(mapAvailability),
    gameReports: gameReportsRaw.map(r => mapGameReport(r, gamesRaw, allUsers)),
    refereeRatings: ratingsRaw.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    notificationPreferences,
    connections: connectionsRaw.map(mapConnection),
    managerProfiles: managerProfilesRaw,
    independentGames: indGamesRaw.sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    // Pagination cursors — true when the initial page is full (more data may exist)
    hasMoreGames: isManager && gamesRaw.length === INITIAL_PAGE,
    hasMoreTournaments: isManager && tournamentsRaw.length === INITIAL_PAGE,
    hasMoreMessages: messagesRaw.length === INITIAL_PAGE,
    hasMoreNotifications: notificationsRaw.length === INITIAL_PAGE,
  };
};

// ── Tournaments ───────────────────────────────────────────────────────────────

export const addTournament = async (user: ServiceUser, tournamentData: Doc) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  const err = validate(
    validateRequired(tournamentData.name, 'Tournament name', MAX_TOURNAMENT_NAME),
    validateRequired(tournamentData.location, 'Location', MAX_VENUE_NAME),
    validateDate(tournamentData.startDate, 'Start date'),
    validateDate(tournamentData.endDate, 'End date'),
    validateNumber(Number(tournamentData.numberOfCourts), 'Courts', 1, MAX_COURTS),
  );
  if (err) throw new Error(`invalid-argument: ${err}`);
  await addDoc(collection(db, 'tournaments'), {
    name: tournamentData.name.trim(),
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location.trim(),
    number_of_courts: Number(tournamentData.numberOfCourts),
    manager_id: user.id,
  });
});

export const updateTournamentRecord = async (user: ServiceUser, tournamentId: string, tournamentData: Doc) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    name: tournamentData.name,
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location,
    number_of_courts: Number(tournamentData.numberOfCourts),
  });
});

export const deleteTournamentRecord = async (user: ServiceUser, tournamentId: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'tournaments', tournamentId));
});

export const archiveTournamentRecord = async (user: ServiceUser, tournamentId: string, archived: boolean) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    archived,
    archived_at: archived ? new Date().toISOString() : null,
  });
});

// ── Games ─────────────────────────────────────────────────────────────────────

export const addGameRecord = async (user: ServiceUser, gameData: Doc) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  const err = validate(
    validateRequired(gameData.home_team, 'Home team', MAX_TEAM_NAME),
    validateRequired(gameData.away_team, 'Away team', MAX_TEAM_NAME),
    validateDate(gameData.game_date, 'Game date'),
    validateOptional(gameData.venue, 'Venue', MAX_VENUE_NAME),
    validateTime(gameData.game_time),
    gameData.payment_amount != null ? validateNumber(Number(gameData.payment_amount), 'Payment', 0, MAX_FEE) : null,
  );
  if (err) throw new Error(`invalid-argument: ${err}`);
  await addDoc(collection(db, 'games'), {
    ...gameData,
    manager_id: user.id,
    game_time: gameData.game_time?.length === 5 ? `${gameData.game_time}:00` : gameData.game_time,
  });
});

export const markGameCompleted = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'games', gameId), { status: 'completed' });
  // Create payment records for active assignments
  const assignmentsSnap = await getDocs(query(collection(db, 'game_assignments'), where('game_id', '==', gameId)));
  const gameDoc = await getDoc(doc(db, 'games', gameId));
  const gameData = gameDoc.data();
  const batch = writeBatch(db);
  assignmentsSnap.docs.forEach(aDoc => {
    const a = aDoc.data();
    if (a.status !== 'declined') {
      const payRef = doc(collection(db, 'payments'));
      batch.set(payRef, {
        game_id: gameId, referee_id: a.referee_id, manager_id: user.id,
        amount: gameData?.payment_amount || 0, status: 'pending',
        payment_date: new Date().toISOString().slice(0, 10), payment_method: 'Pending',
      });
    }
  });
  await batch.commit();
});

// ── Assignments ───────────────────────────────────────────────────────────────

export const assignReferee = async (user: ServiceUser, gameId: string, refereeId: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  // Check for existing assignment
  const existing = await getDocs(query(
    collection(db, 'game_assignments'),
    where('game_id', '==', gameId),
    where('referee_id', '==', refereeId)
  ));
  if (!existing.empty) throw new Error('Referee is already assigned to this game.');
  const newAssignRef = doc(collection(db, 'game_assignments'));
  await setDoc(newAssignRef, {
    game_id: gameId, referee_id: refereeId, manager_id: user.id,
    status: 'assigned', decline_reason: null,
  });
  // Create notification
  await addDoc(collection(db, 'notifications'), {
    type: 'assignment', title: 'New game assignment',
    body: 'You have been assigned to a new game. Check your schedule.',
    link: '/schedule', read: false, created_at: serverTimestamp(),
    recipient_id: refereeId,
  });
});

export const unassignReferee = async (user: ServiceUser, assignmentId: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'game_assignments', assignmentId));
});

export const updateAssignment = async (user: ServiceUser, assignmentId: string, status: string, reason: string | null = null) => safeHandle(async () => {
  await updateDoc(doc(db, 'game_assignments', assignmentId), {
    status,
    decline_reason: reason,
  });
});

export const assignCourtSchedule = async (user: ServiceUser, assignments: {gameId: string; refereeId: string}[]) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  const batch = writeBatch(db);
  assignments.forEach(({ gameId, refereeId }) => {
    const ref = doc(collection(db, 'game_assignments'));
    batch.set(ref, { game_id: gameId, referee_id: refereeId, manager_id: user.id, status: 'assigned', decline_reason: null });
  });
  await batch.commit();
});

export const requestAssignment = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can request assignments.');
  const existing = await getDocs(query(
    collection(db, 'game_assignments'),
    where('game_id', '==', gameId),
    where('referee_id', '==', user.id)
  ));
  if (!existing.empty) throw new Error('You already have a pending request for this game.');
  await addDoc(collection(db, 'game_assignments'), {
    game_id: gameId, referee_id: user.id, manager_id: null,
    status: 'pending', decline_reason: null,
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────

export const sendMessageRecord = async (user: ServiceUser, messageData: Doc) => safeHandle(async () => {
  const recipientId = messageData.recipientId || messageData.recipient_id;
  if (!recipientId || typeof recipientId !== 'string' || recipientId.trim().length === 0) {
    throw new Error('invalid-argument: Recipient ID is required.');
  }
  if (recipientId === user.id) {
    throw new Error('invalid-argument: Cannot send a message to yourself.');
  }
  const contentErr = validateOptional(messageData.content, 'Message content', MAX_MESSAGE_LENGTH);
  if (contentErr) throw new Error(`invalid-argument: ${contentErr}`);
  // Verify recipient exists
  const recipientSnap = await getDoc(doc(db, 'users', recipientId));
  if (!recipientSnap.exists()) {
    throw new Error('not-found: Recipient not found.');
  }
  await addDoc(collection(db, 'messages'), {
    sender_id: user.id, recipient_id: recipientId,
    participants: [user.id, recipientId],
    subject: messageData.subject || 'No Subject',
    content: messageData.content || messageData.message || '',
    created_at: serverTimestamp(), is_read: false,
  });
  await addDoc(collection(db, 'notifications'), {
    type: 'message', title: `New message from ${user.name}`,
    body: messageData.subject || 'You have a new message.',
    link: '/messages', read: false,
    created_at: serverTimestamp(), recipient_id: recipientId,
  });
});

export const markMessageRead = async (user: ServiceUser, messageId: string) => safeHandle(async () => {
  await updateDoc(doc(db, 'messages', messageId), { is_read: true });
});

// ── Availability ──────────────────────────────────────────────────────────────

export const addAvailabilityRecord = async (user: ServiceUser, startDate: string, endDate: string) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  await addDoc(collection(db, 'referee_availability'), {
    referee_id: user.id, start_time: startDate, end_time: endDate,
  });
});

// ── Game Reports ──────────────────────────────────────────────────────────────

export const submitGameReportRecord = async (user: ServiceUser, reportData: Doc) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  const existing = await getDocs(query(
    collection(db, 'game_reports'),
    where('game_id', '==', reportData.gameId),
    where('referee_id', '==', user.id)
  ));
  if (!existing.empty) throw new Error('A report for this game has already been submitted.');
  await addDoc(collection(db, 'game_reports'), {
    game_id: reportData.gameId,
    referee_id: user.id,
    manager_id: reportData.managerId || null,
    home_score: reportData.homeScore,
    away_score: reportData.awayScore,
    professionalism_rating: reportData.professionalismRating,
    incidents: reportData.incidents || '',
    notes: reportData.notes || '',
    technical_fouls: reportData.technicalFouls ?? null,
    personal_fouls: reportData.personalFouls ?? null,
    ejections: reportData.ejections ?? null,
    mvp_player: reportData.mvpPlayer || null,
    status: 'submitted',
    created_at: new Date().toISOString(),
    resolution_note: null, resolved_by: null, resolved_at: null,
  });
});

// ── Notifications ─────────────────────────────────────────────────────────────

export const markNotificationReadRecord = async (user: ServiceUser, notificationId: string) => safeHandle(async () => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
});

export const markAllNotificationsReadRecord = async (user: ServiceUser) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'notifications'),
    where('recipient_id', '==', user.id),
    where('read', '==', false)
  ));
  // S1 fix: chunk into batches of 400 to stay under Firestore's 500-write limit
  const chunks = chunkArray(snap.docs, 400);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const batchMarkPaymentsPaidRecord = async (user: ServiceUser, paymentIds: string[]) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  const batch = writeBatch(db);
  paymentIds.forEach(id => batch.update(doc(db, 'payments', id), { status: 'paid', payment_date: new Date().toISOString().slice(0, 10) }));
  await batch.commit();
});

// ── Batch Unassign ────────────────────────────────────────────────────────────

export const batchUnassignRefereesRecord = async (user: ServiceUser, gameIds: string[]) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  // H1 fix: single batch query per chunk instead of one getDocs() per game
  const chunks = chunkArray(gameIds, 30);
  const snaps = await Promise.all(
    chunks.map(chunk =>
      getDocs(query(collection(db, 'game_assignments'), where('game_id', 'in', chunk)))
    )
  );
  const batch = writeBatch(db);
  snaps.forEach(snap => snap.docs.forEach(d => batch.delete(d.ref)));
  await batch.commit();
});

// ── Referee Ratings ───────────────────────────────────────────────────────────

export const rateRefereeRecord = async (user: ServiceUser, gameId: string, refereeId: string, stars: number, feedback: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  // Validate star rating bounds
  const s = Number(stars);
  if (!Number.isFinite(s) || s < 1 || s > 5) throw new Error('Rating must be between 1 and 5.');
  const existing = await getDocs(query(
    collection(db, 'referee_ratings'),
    where('game_id', '==', gameId),
    where('referee_id', '==', refereeId)
  ));
  if (!existing.empty) {
    await updateDoc(existing.docs[0].ref, { stars, feedback });
  } else {
    await addDoc(collection(db, 'referee_ratings'), {
      game_id: gameId, referee_id: refereeId, manager_id: user.id,
      stars: s, feedback, created_at: serverTimestamp(),
    });
  }
});

// ── Notification Preferences ──────────────────────────────────────────────────

export const saveNotificationPreferencesRecord = async (user: ServiceUser, prefs: Doc) => safeHandle(async () => {
  await updateDoc(doc(db, 'users', user.id), { notification_preferences: prefs });
});

// ── Report Resolution ─────────────────────────────────────────────────────────

export const addReportResolutionRecord = async (user: ServiceUser, reportId: string, note: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'game_reports', reportId), {
    resolution_note: note, resolved_by: user.id,
    resolved_at: new Date().toISOString(), status: 'resolved',
  });
});

// ── Manager Connections ───────────────────────────────────────────────────────

export const requestManagerConnectionRecord = async (user: ServiceUser, managerId: string, note: string) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  const existing = await getDocs(query(
    collection(db, 'manager_connections'),
    where('referee_id', '==', user.id),
    where('manager_id', '==', managerId)
  ));
  if (!existing.empty) throw new Error('A connection with this manager already exists or is pending.');
  await addDoc(collection(db, 'manager_connections'), {
    referee_id: user.id, manager_id: managerId,
    status: 'pending', note: note || '', created_at: new Date().toISOString(),
  });
});

export const respondToConnectionRecord = async (user: ServiceUser, connectionId: string, newStatus: string) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'manager_connections', connectionId), { status: newStatus });
});

export const withdrawConnectionRecord = async (user: ServiceUser, managerId: string) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  const snap = await getDocs(query(
    collection(db, 'manager_connections'),
    where('referee_id', '==', user.id),
    where('manager_id', '==', managerId)
  ));
  if (snap.empty) throw new Error('Connection not found.');
  await deleteDoc(snap.docs[0].ref);
});

// ── Independent Games ─────────────────────────────────────────────────────────

export const addIndependentGameRecord = async (user: ServiceUser, gameData: Doc) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  await addDoc(collection(db, 'independent_games'), {
    referee_id: user.id, date: gameData.date, time: gameData.time || '',
    location: gameData.location || '', organization: gameData.organization || '',
    game_type: gameData.game_type || 'other', fee: Number(gameData.fee) || 0,
    notes: gameData.notes || '', created_at: new Date().toISOString(),
  });
});

export const updateIndependentGameRecord = async (user: ServiceUser, gameId: string, gameData: Doc) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  await updateDoc(doc(db, 'independent_games', gameId), {
    date: gameData.date, time: gameData.time || '', location: gameData.location || '',
    organization: gameData.organization || '', game_type: gameData.game_type || 'other',
    fee: Number(gameData.fee) || 0, notes: gameData.notes || '',
  });
});

export const deleteIndependentGameRecord = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'independent_games', gameId));
});

// ── Batch Import: Referee Schedule ────────────────────────────────────────────

interface ImportedGame { date: string; time: string; location: string; organization: string; fee: number; level: string; }
interface ImportResult { gamesAdded: number; availabilityAdded: number; errors: string[]; importId: string }

export const batchImportRefereeSchedule = async (
  user: ServiceUser,
  pastGames: ImportedGame[],
  futureDates: { date: string; time: string }[],
  fileName: string,
): Promise<SafeResult<ImportResult>> => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('permission-denied');
  const errors: string[] = [];
  let gamesAdded = 0;
  let availabilityAdded = 0;
  const createdIds: string[] = [];

  // Batch add past games as independent games (max 400 per batch)
  const gameChunks = chunkArray(pastGames, 400);
  for (const chunk of gameChunks) {
    const batch = writeBatch(db);
    for (const g of chunk) {
      const ref = doc(collection(db, 'independent_games'));
      batch.set(ref, {
        referee_id: user.id,
        date: g.date,
        time: g.time || '',
        location: g.location || '',
        organization: g.organization || '',
        game_type: 'other',
        fee: Number(g.fee) || 0,
        notes: `Imported from schedule | ${g.level || ''}`.trim(),
        created_at: new Date().toISOString(),
      });
      createdIds.push(ref.id);
      gamesAdded++;
    }
    await batch.commit();
  }

  // Batch add future dates as availability records
  const availIds: string[] = [];
  const availChunks = chunkArray(futureDates, 400);
  for (const chunk of availChunks) {
    const batch = writeBatch(db);
    for (const slot of chunk) {
      const ref = doc(collection(db, 'referee_availability'));
      const dayStart = new Date(slot.date + 'T00:00:00');
      const dayEnd = new Date(slot.date + 'T23:59:59');
      batch.set(ref, {
        referee_id: user.id,
        start_time: dayStart.toISOString(),
        end_time: dayEnd.toISOString(),
      });
      availIds.push(ref.id);
      availabilityAdded++;
    }
    await batch.commit();
  }

  // Save import history (best-effort — never block the main import)
  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id,
      import_type: 'referee_schedule',
      file_name: fileName,
      games_added: gamesAdded,
      availability_added: availabilityAdded,
      game_ids: createdIds,
      availability_ids: availIds,
      created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch {
    // Import history is non-critical — log but don't fail the import
  }

  return { gamesAdded, availabilityAdded, errors, importId };
});

// ── Batch Import: Manager Games ──────────────────────────────────────────────

interface BulkGameData { homeTeam: string; awayTeam: string; date: string; time: string; venue: string; division: string; level: string; payment: number; }

export const batchImportManagerGames = async (
  user: ServiceUser,
  tournamentId: string,
  games: BulkGameData[],
  fileName: string,
): Promise<SafeResult<{ added: number; errors: string[]; importId: string }>> => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  const errors: string[] = [];
  let added = 0;
  const createdIds: string[] = [];

  const gameChunks = chunkArray(games, 400);
  for (const chunk of gameChunks) {
    const batch = writeBatch(db);
    for (const g of chunk) {
      const ref = doc(collection(db, 'games'));
      batch.set(ref, {
        tournament_id: tournamentId,
        manager_id: user.id,
        home_team: g.homeTeam,
        away_team: g.awayTeam,
        game_date: g.date,
        game_time: g.time ? (g.time.length === 5 ? `${g.time}:00` : g.time) : '',
        venue: g.venue || '',
        division: g.division || '',
        level: g.level || '',
        payment_amount: Number(g.payment) || 0,
        required_certifications: [],
        status: 'scheduled',
        home_score: null,
        away_score: null,
      });
      createdIds.push(ref.id);
      added++;
    }
    await batch.commit();
  }

  // Save import history (best-effort — never block the main import)
  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id,
      import_type: 'manager_games',
      tournament_id: tournamentId,
      file_name: fileName,
      games_added: added,
      game_ids: createdIds,
      created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch {
    // Import history is non-critical
  }

  return { added, errors, importId };
});

// ── Batch Import: League Schedule ─────────────────────────────────────────────

export interface LeagueImportGame {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  division: string;
  payment: number;
  refereeIds: string[];    // IDs of referees to assign
}

export const batchImportLeagueSchedule = async (
  user: ServiceUser,
  tournamentId: string,
  games: LeagueImportGame[],
  fileName: string,
): Promise<SafeResult<{ gamesAdded: number; assignmentsAdded: number; importId: string }>> => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');
  let gamesAdded = 0;
  let assignmentsAdded = 0;
  const createdGameIds: string[] = [];

  const gameChunks = chunkArray(games, 200);
  for (const chunk of gameChunks) {
    const batch = writeBatch(db);
    for (const g of chunk) {
      const gameRef = doc(collection(db, 'games'));
      batch.set(gameRef, {
        tournament_id: tournamentId,
        manager_id: user.id,
        home_team: g.homeTeam || 'TBD',
        away_team: g.awayTeam || 'TBD',
        game_date: g.date,
        game_time: g.time ? (g.time.length === 5 ? `${g.time}:00` : g.time) : '',
        venue: g.venue || '',
        division: g.division || '',
        level: '',
        payment_amount: Number(g.payment) || 0,
        required_certifications: [],
        status: 'scheduled',
        home_score: null,
        away_score: null,
      });
      createdGameIds.push(gameRef.id);
      gamesAdded++;

      // Create assignments for each referee
      for (const refId of g.refereeIds) {
        if (!refId) continue;
        const assignRef = doc(collection(db, 'game_assignments'));
        batch.set(assignRef, {
          game_id: gameRef.id,
          referee_id: refId,
          manager_id: user.id,
          status: 'assigned',
          decline_reason: null,
        });
        assignmentsAdded++;
      }
    }
    await batch.commit();
  }

  // Save import history
  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id,
      import_type: 'league_schedule',
      tournament_id: tournamentId,
      file_name: fileName,
      games_added: gamesAdded,
      assignments_added: assignmentsAdded,
      game_ids: createdGameIds,
      created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch {
    // Non-critical
  }

  return { gamesAdded, assignmentsAdded, importId };
});

// ── Duplicate Detection ──────────────────────────────────────────────────────

/** Check for existing independent games matching date + organization. */
export const checkRefereeDuplicates = async (
  userId: string,
  rows: { date: string; organization: string }[],
): Promise<SafeResult<Set<string>>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'independent_games'),
    where('referee_id', '==', userId),
  ));
  const existing = new Set<string>();
  snap.docs.forEach(d => {
    const data = d.data();
    existing.add(`${data.date}|${(data.organization || '').toLowerCase()}`);
  });
  const dupeKeys = new Set<string>();
  rows.forEach((r, i) => {
    const key = `${r.date}|${(r.organization || '').toLowerCase()}`;
    if (existing.has(key)) dupeKeys.add(String(i));
  });
  return dupeKeys;
});

/** Check for existing games in a tournament matching date + home_team + away_team. */
export const checkManagerDuplicates = async (
  tournamentId: string,
  rows: { date: string; homeTeam: string; awayTeam: string }[],
): Promise<SafeResult<Set<string>>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'games'),
    where('tournament_id', '==', tournamentId),
  ));
  const existing = new Set<string>();
  snap.docs.forEach(d => {
    const data = d.data();
    existing.add(`${data.game_date}|${(data.home_team || '').toLowerCase()}|${(data.away_team || '').toLowerCase()}`);
  });
  const dupeKeys = new Set<string>();
  rows.forEach((r, i) => {
    const key = `${r.date}|${(r.homeTeam || '').toLowerCase()}|${(r.awayTeam || '').toLowerCase()}`;
    if (existing.has(key)) dupeKeys.add(String(i));
  });
  return dupeKeys;
});

// ── Import History ───────────────────────────────────────────────────────────

export interface ImportHistoryRecord {
  id: string;
  importType: string;
  fileName: string;
  gamesAdded: number;
  availabilityAdded: number;
  createdAt: string;
  tournamentId?: string;
}

export const fetchImportHistory = async (userId: string): Promise<SafeResult<ImportHistoryRecord[]>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, '_import_history'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(20),
  ));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      importType: data.import_type,
      fileName: data.file_name,
      gamesAdded: data.games_added || 0,
      availabilityAdded: data.availability_added || 0,
      createdAt: data.created_at,
      tournamentId: data.tournament_id,
    };
  });
});

export const undoImport = async (user: ServiceUser, importId: string): Promise<SafeResult> => safeHandle(async () => {
  const historyDoc = await getDoc(doc(db, '_import_history', importId));
  if (!historyDoc.exists()) throw new Error('Import record not found.');
  const data = historyDoc.data();
  if (data.user_id !== user.id) throw new Error('Not authorized to undo this import.');

  // Delete game records
  const gameIds: string[] = data.game_ids || [];
  if (gameIds.length > 0) {
    const collectionName = data.import_type === 'manager_games' ? 'games' : 'independent_games';
    const chunks = chunkArray(gameIds, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(id => batch.delete(doc(db, collectionName, id)));
      await batch.commit();
    }
  }

  // Delete availability records (referee imports only)
  const availIds: string[] = data.availability_ids || [];
  if (availIds.length > 0) {
    const chunks = chunkArray(availIds, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(id => batch.delete(doc(db, 'referee_availability', id)));
      await batch.commit();
    }
  }

  // Delete the history record itself
  await deleteDoc(doc(db, '_import_history', importId));
});



// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

/**
 * Fetch the next page of messages (cursor-based by created_at).
 */
export const fetchMoreMessages = async (
  user: ServiceUser,
  afterTimestamp: string,
  allUsers: MappedProfile[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'messages'),
    where('participants', 'array-contains', user.id),
    orderBy('created_at', 'desc'),
    startAfter(afterTimestamp),
    limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs.map(m => mapMessage(m, allUsers)), hasMore: docs.length === PAGE_SIZE };
});

/**
 * Fetch the next page of games for a manager (cursor-based by game_date).
 */
export const fetchMoreGames = async (
  managerId: string,
  afterDatetime: string,
  assignmentsRaw: Doc[],
  allUsers: MappedProfile[],
  tournamentsRaw: Doc[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'games'),
    where('manager_id', '==', managerId),
    orderBy('game_date', 'desc'),
    startAfter(afterDatetime),
    limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return {
    items: docs.map(g => mapGame(g.id, g, assignmentsRaw, allUsers, tournamentsRaw)),
    hasMore: docs.length === PAGE_SIZE,
  };
});

/**
 * Fetch the next page of tournaments for a manager (cursor-based by name).
 */
export const fetchMoreTournaments = async (
  managerId: string,
  afterName: string,
  gamesRaw: Doc[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'tournaments'),
    where('manager_id', '==', managerId),
    orderBy('name'),
    startAfter(afterName),
    limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs.map(t => mapTournament(t, gamesRaw)), hasMore: docs.length === PAGE_SIZE };
});

/**
 * Fetch the next page of notifications (cursor-based by created_at).
 */
export const fetchMoreNotifications = async (
  userId: string,
  afterTimestamp: string,
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'notifications'),
    where('recipient_id', '==', userId),
    orderBy('created_at', 'desc'),
    startAfter(afterTimestamp),
    limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs, hasMore: docs.length === PAGE_SIZE };
});


// ── Public Profile ────────────────────────────────────────────────────────────

/**
 * Fetch a referee's public profile (no auth required).
 * Returns only safe-to-share fields — no email, phone, or FCM token.
 */
export const fetchPublicRefereeProfile = async (refereeId: string) => safeHandle(async () => {
  const userSnap = await getDoc(doc(db, 'users', refereeId));
  if (!userSnap.exists()) throw new Error('Referee not found.');
  const data = userSnap.data();
  if (data.role !== 'referee') throw new Error('Profile not available.');

  // Fetch ratings for this referee
  const ratingsSnap = await getDocs(query(
    collection(db, 'referee_ratings'),
    where('referee_id', '==', refereeId),
  ));
  const ratings = docsToArr(ratingsSnap);
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.stars || 0), 0) / ratings.length
    : data.rating || 0;

  return {
    id: refereeId,
    name: data.name,
    avatarUrl: data.avatar_url || '',
    bio: data.bio || '',
    location: data.location || '',
    certifications: data.certifications || [],
    gamesOfficiated: data.games_officiated || 0,
    rating: Math.round(avgRating * 10) / 10,
    totalRatings: ratings.length,
    experience: data.experience || '',
    createdAt: data.created_at || '',
  };
});

// ── Audit Logging ─────────────────────────────────────────────────────────────

export const writeAuditLog = async (
  userId: string, action: string, target: string, details: string = '',
) => {
  try {
    await addDoc(collection(db, '_audit_log'), {
      user_id: userId,
      action,
      target,
      details,
      timestamp: serverTimestamp(),
    });
  } catch {
    // Audit logging is best-effort — never block the main operation
  }
};

// ── GDPR Data Export ──────────────────────────────────────────────────────────

export const exportUserData = async (user: ServiceUser) => safeHandle(async () => {
  const [
    profileSnap, messagesSnap, assignmentsSnap, reportsSnap,
    ratingsSnap, availabilitySnap, connectionsSnap, indGamesSnap, paymentsSnap,
  ] = await Promise.all([
    getDoc(doc(db, 'users', user.id)),
    getDocs(query(collection(db, 'messages'), where('participants', 'array-contains', user.id))),
    getDocs(query(collection(db, 'game_assignments'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'game_reports'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'referee_ratings'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'referee_availability'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'manager_connections'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'independent_games'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'payments'), where('referee_id', '==', user.id))),
  ]);

  return {
    profile: profileSnap.exists() ? { id: profileSnap.id, ...profileSnap.data() } : null,
    messages: docsToArr(messagesSnap),
    assignments: docsToArr(assignmentsSnap),
    gameReports: docsToArr(reportsSnap),
    ratings: docsToArr(ratingsSnap),
    availability: docsToArr(availabilitySnap),
    connections: docsToArr(connectionsSnap),
    independentGames: docsToArr(indGamesSnap),
    payments: docsToArr(paymentsSnap),
    exportedAt: new Date().toISOString(),
  };
});

/** Delete all user data across collections (GDPR right to erasure). */
export const deleteUserData = async (user: ServiceUser) => safeHandle(async () => {
  const collections = [
    { name: 'messages', field: 'participants', op: 'array-contains' as const },
    { name: 'game_assignments', field: 'referee_id', op: '==' as const },
    { name: 'game_reports', field: 'referee_id', op: '==' as const },
    { name: 'referee_ratings', field: 'referee_id', op: '==' as const },
    { name: 'referee_availability', field: 'referee_id', op: '==' as const },
    { name: 'manager_connections', field: 'referee_id', op: '==' as const },
    { name: 'independent_games', field: 'referee_id', op: '==' as const },
    { name: 'notifications', field: 'recipient_id', op: '==' as const },
  ];

  for (const col of collections) {
    const snap = await getDocs(query(collection(db, col.name), where(col.field, col.op, user.id)));
    const chunks = chunkArray(snap.docs, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Delete user profile last
  await deleteDoc(doc(db, 'users', user.id));
});

// ── AI Chat History ───────────────────────────────────────────────────────────

export const saveAIChatHistory = async (userId: string, messages: Doc[]): Promise<SafeResult> => safeHandle(async () => {
  await setDoc(doc(db, '_ai_chat_history', userId), {
    user_id: userId,
    messages: messages.slice(-50), // Keep last 50 messages
    updated_at: new Date().toISOString(),
  });
});

export const loadAIChatHistory = async (userId: string): Promise<SafeResult<Doc[]>> => safeHandle(async () => {
  const snap = await getDoc(doc(db, '_ai_chat_history', userId));
  if (!snap.exists()) return [];
  return snap.data().messages || [];
});

export const clearAIChatHistory = async (userId: string): Promise<SafeResult> => safeHandle(async () => {
  await deleteDoc(doc(db, '_ai_chat_history', userId));
});

// ── Auto-Assign Referees ──────────────────────────────────────────────────────

interface AutoAssignSuggestion {
  gameId: string;
  gameLabel: string;
  refereeId: string;
  refereeName: string;
  reason: string;
}

/**
 * Generate auto-assign suggestions for unassigned games in a tournament.
 * Matches referees based on: availability > no conflicts > rating.
 */
export const generateAutoAssignSuggestions = async (
  user: ServiceUser,
  tournamentId: string,
): Promise<SafeResult<AutoAssignSuggestion[]>> => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');

  // Fetch tournament games
  const gamesSnap = await getDocs(query(
    collection(db, 'games'),
    where('tournament_id', '==', tournamentId),
    where('status', '==', 'scheduled'),
  ));
  const games = docsToArr(gamesSnap);

  // Fetch existing assignments for these games
  const gameIds = games.map(g => g.id);
  if (gameIds.length === 0) return [];

  const assignChunks = chunkArray(gameIds, 30);
  const assignSnaps = await Promise.all(
    assignChunks.map(chunk =>
      getDocs(query(collection(db, 'game_assignments'), where('game_id', 'in', chunk)))
    )
  );
  const existingAssignments = assignSnaps.flatMap(docsToArr);

  // Find unassigned games
  const assignedGameIds = new Set(existingAssignments.map(a => a.game_id));
  const unassignedGames = games.filter(g => !assignedGameIds.has(g.id));
  if (unassignedGames.length === 0) return [];

  // Fetch connected referees
  const connectionsSnap = await getDocs(query(
    collection(db, 'manager_connections'),
    where('manager_id', '==', user.id),
    where('status', '==', 'connected'),
  ));
  const connectedRefereeIds = docsToArr(connectionsSnap).map(c => c.referee_id);
  if (connectedRefereeIds.length === 0) return [];

  // Fetch referee profiles + availability
  const refChunks = chunkArray(connectedRefereeIds, 30);
  const [refSnaps, availSnap] = await Promise.all([
    Promise.all(refChunks.map(chunk =>
      getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk)))
    )),
    getDocs(query(collection(db, 'referee_availability'))),
  ]);
  const referees = refSnaps.flatMap(docsToArr);
  const allAvailability = docsToArr(availSnap);

  // Build availability map: refereeId → Set<date strings>
  const availMap = new Map<string, Set<string>>();
  allAvailability.forEach(a => {
    const dates = availMap.get(a.referee_id) || new Set();
    if (a.start_time) {
      const d = new Date(a.start_time).toISOString().slice(0, 10);
      dates.add(d);
    }
    availMap.set(a.referee_id, dates);
  });

  // Build conflict map: refereeId → Set<game_date> (already assigned dates)
  const conflictMap = new Map<string, Set<string>>();
  existingAssignments.forEach(a => {
    const game = games.find(g => g.id === a.game_id);
    if (game) {
      const dates = conflictMap.get(a.referee_id) || new Set();
      dates.add(game.game_date);
      conflictMap.set(a.referee_id, dates);
    }
  });

  // Score and assign
  const suggestions: AutoAssignSuggestion[] = [];
  const assignedCounts = new Map<string, number>();

  for (const game of unassignedGames) {
    const gameDate = game.game_date;
    let bestRef: { id: string; name: string; score: number; reason: string } | null = null;

    for (const ref of referees) {
      const refAvail = availMap.get(ref.id);
      const refConflicts = conflictMap.get(ref.id);
      const count = assignedCounts.get(ref.id) || 0;

      // Skip if already assigned on this date
      if (refConflicts?.has(gameDate)) continue;

      let score = 0;
      let reason = '';

      // Available on this date
      if (refAvail?.has(gameDate)) {
        score += 50;
        reason = 'Available on game date';
      } else {
        score += 10;
        reason = 'No availability data';
      }

      // Higher rated = better
      score += (ref.rating || 0) * 5;

      // Prefer less-loaded referees (fairness)
      score -= count * 15;

      if (!bestRef || score > bestRef.score) {
        bestRef = { id: ref.id, name: ref.name, score, reason };
      }
    }

    if (bestRef) {
      suggestions.push({
        gameId: game.id,
        gameLabel: `${game.home_team} vs ${game.away_team} (${game.game_date})`,
        refereeId: bestRef.id,
        refereeName: bestRef.name,
        reason: bestRef.reason,
      });
      // Track assignment to prevent overloading one referee
      assignedCounts.set(bestRef.id, (assignedCounts.get(bestRef.id) || 0) + 1);
      // Mark conflict for this date
      const conflicts = conflictMap.get(bestRef.id) || new Set();
      conflicts.add(gameDate);
      conflictMap.set(bestRef.id, conflicts);
    }
  }

  return suggestions;
});


// ── Tournament Brackets ───────────────────────────────────────────────────────

import type { BracketData, BracketRound, BracketFormat } from './bracketUtils';

export const saveBracket = async (bracket: BracketData, managerId: string): Promise<SafeResult<string>> => safeHandle(async () => {
  if (!managerId) throw new Error('permission-denied');
  const data: Doc = {
    tournament_id: bracket.tournamentId,
    format: bracket.format,
    teams: bracket.teams,
    rounds: JSON.parse(JSON.stringify(bracket.rounds)),
    updated_at: new Date().toISOString(),
    manager_id: managerId,
  };
  if (bracket.id) {
    await updateDoc(doc(db, 'tournament_brackets', bracket.id), data);
    return bracket.id;
  } else {
    const ref = await addDoc(collection(db, 'tournament_brackets'), data);
    return ref.id;
  }
});

export const loadBracket = async (tournamentId: string): Promise<SafeResult<BracketData | null>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'tournament_brackets'),
    where('tournament_id', '==', tournamentId),
    limit(1),
  ));
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    tournamentId: data.tournament_id,
    format: data.format as BracketFormat,
    teams: data.teams || [],
    rounds: (data.rounds || []) as BracketRound[],
    updatedAt: data.updated_at || '',
  };
});

export const deleteBracket = async (bracketId: string): Promise<SafeResult> => safeHandle(async () => {
  await deleteDoc(doc(db, 'tournament_brackets', bracketId));
});

// ── Login History ──────────────────────────────────────────────────────────

export interface LoginEvent {
  id: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export const fetchLoginHistory = async (userId: string): Promise<SafeResult<LoginEvent[]>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, '_audit_log'),
    where('user_id', '==', userId),
    where('action', 'in', ['login', 'login_mfa']),
    orderBy('timestamp', 'desc'),
    limit(15),
  ));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      action: data.action || '',
      target: data.target || '',
      details: data.details || '',
      timestamp: toISOString(data.timestamp),
    };
  });
});

// ── Feedback ───────────────────────────────────────────────────────────────

export const saveFeedback = async (
  userId: string, category: string, message: string,
): Promise<SafeResult> => safeHandle(async () => {
  await addDoc(collection(db, '_feedback'), {
    user_id: userId,
    category,
    message: message.slice(0, 2000),
    created_at: serverTimestamp(),
  });
});

// ── Payment Info ───────────────────────────────────────────────────────────

export interface PaymentInfo {
  preferredMethod: string;
  bankName: string;
  routingLast4: string;
  accountLast4: string;
  accountType: string;
  venmoHandle: string;
  zellePhone: string;
  paypalEmail: string;
  updatedAt: string;
}

export const fetchPaymentInfo = async (userId: string): Promise<SafeResult<PaymentInfo | null>> => safeHandle(async () => {
  const snap = await getDoc(doc(db, '_payment_info', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    preferredMethod: d.preferred_method || '',
    bankName: d.bank_name || '',
    routingLast4: d.routing_last4 || '',
    accountLast4: d.account_last4 || '',
    accountType: d.account_type || 'checking',
    venmoHandle: d.venmo_handle || '',
    zellePhone: d.zelle_phone || '',
    paypalEmail: d.paypal_email || '',
    updatedAt: toISOString(d.updated_at),
  };
});

export const savePaymentInfo = async (
  userId: string, info: Partial<PaymentInfo>,
): Promise<SafeResult> => safeHandle(async () => {
  await setDoc(doc(db, '_payment_info', userId), {
    preferred_method: info.preferredMethod || '',
    bank_name: info.bankName || '',
    routing_last4: info.routingLast4 || '',
    account_last4: info.accountLast4 || '',
    account_type: info.accountType || 'checking',
    venmo_handle: info.venmoHandle || '',
    zelle_phone: info.zellePhone || '',
    paypal_email: info.paypalEmail || '',
    updated_at: serverTimestamp(),
  }, { merge: true });
});
