/**
 * firestore/crud.ts
 * CRUD operations for all core Firestore collections.
 */
import {
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, writeBatch,
  safeHandle, chunkArray,
  type Doc, type ServiceUser,
} from './helpers';
import {
  validate, validateRequired, validateOptional, validateDate, validateTime, validateNumber,
  MAX_TEAM_NAME, MAX_VENUE_NAME, MAX_TOURNAMENT_NAME, MAX_MESSAGE_LENGTH, MAX_FEE, MAX_COURTS,
} from '../validation';

// ── Tournaments ───────────────────────────────────────────────────────────────

export const addTournament = async (user: ServiceUser, tournamentData: Doc) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  const err = validate(
    validateRequired(tournamentData.name, 'Tournament name', MAX_TOURNAMENT_NAME),
    validateRequired(tournamentData.location, 'Location', MAX_VENUE_NAME),
    validateDate(tournamentData.startDate, 'Start date'),
    validateDate(tournamentData.endDate, 'End date'),
    validateNumber(Number(tournamentData.numberOfCourts), 'Courts', 1, MAX_COURTS),
  );
  if (err) throw new Error(`invalid-argument: ${err}`);
  await addDoc(collection(db, 'tournaments'), {
    name: (tournamentData.name as string).trim(),
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: (tournamentData.location as string).trim(),
    number_of_courts: Number(tournamentData.numberOfCourts),
    manager_id: user.id,
  });
});

export const updateTournamentRecord = async (user: ServiceUser, tournamentId: string, tournamentData: Doc) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    name: tournamentData.name,
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location,
    number_of_courts: Number(tournamentData.numberOfCourts),
  });
});

export const deleteTournamentRecord = async (user: ServiceUser, tournamentId: string) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'tournaments', tournamentId));
});

export const archiveTournamentRecord = async (user: ServiceUser, tournamentId: string, archived: boolean) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    archived,
    archived_at: archived ? new Date().toISOString() : null,
  });
});

// ── Games ─────────────────────────────────────────────────────────────────────

export const addGameRecord = async (user: ServiceUser, gameData: Doc) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
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
    game_time: (gameData.game_time as string)?.length === 5 ? `${gameData.game_time}:00` : gameData.game_time,
  });
});

export const markGameCompleted = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'games', gameId), { status: 'completed' });
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
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
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
  await addDoc(collection(db, 'notifications'), {
    type: 'assignment', title: 'New game assignment',
    body: 'You have been assigned to a new game. Check your schedule.',
    link: '/schedule', read: false, created_at: serverTimestamp(),
    recipient_id: refereeId,
  });
});

export const unassignReferee = async (user: ServiceUser, assignmentId: string) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'game_assignments', assignmentId));
});

export const updateAssignment = async (user: ServiceUser, assignmentId: string, status: string, reason: string | null = null) => safeHandle(async () => {
  await updateDoc(doc(db, 'game_assignments', assignmentId), { status, decline_reason: reason });
});

export const assignCourtSchedule = async (user: ServiceUser, assignments: {gameId: string; refereeId: string}[]) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  const batch = writeBatch(db);
  assignments.forEach(({ gameId, refereeId }) => {
    const ref = doc(collection(db, 'game_assignments'));
    batch.set(ref, { game_id: gameId, referee_id: refereeId, manager_id: user.id, status: 'assigned', decline_reason: null });
  });
  await batch.commit();
});

export const requestAssignment = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('Only referees can request assignments.');
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
  const recipientId = (messageData.recipientId || messageData.recipient_id) as string;
  if (!recipientId || typeof recipientId !== 'string' || recipientId.trim().length === 0) {
    throw new Error('invalid-argument: Recipient ID is required.');
  }
  if (recipientId === user.id) throw new Error('invalid-argument: Cannot send a message to yourself.');
  const contentErr = validateOptional(messageData.content, 'Message content', MAX_MESSAGE_LENGTH);
  if (contentErr) throw new Error(`invalid-argument: ${contentErr}`);
  const recipientSnap = await getDoc(doc(db, 'users', recipientId));
  if (!recipientSnap.exists()) throw new Error('not-found: Recipient not found.');
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
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
  await addDoc(collection(db, 'referee_availability'), { referee_id: user.id, start_time: startDate, end_time: endDate });
});

// Alias used by RefereeAIPanel
export const addAvailability = addAvailabilityRecord;

// ── Game Reports ──────────────────────────────────────────────────────────────

export const submitGameReportRecord = async (user: ServiceUser, reportData: Doc) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
  const existing = await getDocs(query(
    collection(db, 'game_reports'),
    where('game_id', '==', reportData.gameId),
    where('referee_id', '==', user.id)
  ));
  if (!existing.empty) throw new Error('A report for this game has already been submitted.');
  await addDoc(collection(db, 'game_reports'), {
    game_id: reportData.gameId, referee_id: user.id,
    manager_id: reportData.managerId || null,
    home_score: reportData.homeScore, away_score: reportData.awayScore,
    professionalism_rating: reportData.professionalismRating,
    incidents: reportData.incidents || '', notes: reportData.notes || '',
    technical_fouls: reportData.technicalFouls ?? null, personal_fouls: reportData.personalFouls ?? null,
    ejections: reportData.ejections ?? null, mvp_player: reportData.mvpPlayer || null,
    status: 'submitted', created_at: new Date().toISOString(),
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
  const chunks = chunkArray(snap.docs, 400);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const batchMarkPaymentsPaidRecord = async (user: ServiceUser, paymentIds: string[]) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  const batch = writeBatch(db);
  paymentIds.forEach(id => batch.update(doc(db, 'payments', id), { status: 'paid', payment_date: new Date().toISOString().slice(0, 10) }));
  await batch.commit();
});

// ── Batch Unassign ────────────────────────────────────────────────────────────

export const batchUnassignRefereesRecord = async (user: ServiceUser, gameIds: string[]) => safeHandle(async () => {
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
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
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
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
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'game_reports', reportId), {
    resolution_note: note, resolved_by: user.id,
    resolved_at: new Date().toISOString(), status: 'resolved',
  });
});

// ── Manager Connections ───────────────────────────────────────────────────────

export const requestManagerConnectionRecord = async (user: ServiceUser, managerId: string, note: string) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
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
  if (!user || user.role !== 'manager') throw new Error('permission-denied');
  await updateDoc(doc(db, 'manager_connections', connectionId), { status: newStatus });
});

export const withdrawConnectionRecord = async (user: ServiceUser, managerId: string) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
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
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
  await addDoc(collection(db, 'independent_games'), {
    referee_id: user.id, date: gameData.date, time: gameData.time || '',
    location: gameData.location || '', organization: gameData.organization || '',
    game_type: gameData.game_type || 'other', fee: Number(gameData.fee) || 0,
    notes: gameData.notes || '', created_at: new Date().toISOString(),
  });
});

export const updateIndependentGameRecord = async (user: ServiceUser, gameId: string, gameData: Doc) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
  await updateDoc(doc(db, 'independent_games', gameId), {
    date: gameData.date, time: gameData.time || '', location: gameData.location || '',
    organization: gameData.organization || '', game_type: gameData.game_type || 'other',
    fee: Number(gameData.fee) || 0, notes: gameData.notes || '',
  });
});

export const deleteIndependentGameRecord = async (user: ServiceUser, gameId: string) => safeHandle(async () => {
  if (!user || user.role !== 'referee') throw new Error('permission-denied');
  await deleteDoc(doc(db, 'independent_games', gameId));
});
