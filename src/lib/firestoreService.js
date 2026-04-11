/**
 * firestoreService.js
 * Async Firestore replacement for demoDataService.js.
 * Exports the same function signatures so no action-hook changes are needed.
 */
import { db } from './firebase';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, documentId, serverTimestamp, writeBatch,
} from 'firebase/firestore';

// ── Helpers ─────────────────────────────────────────────────────────────────

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createError = (message) => ({ message });

const safeHandle = async (fn) => {
  try {
    const result = await fn();
    return { data: result ?? true };
  } catch (err) {
    console.error('[Firestore]', err);
    return { error: createError(err.message || 'An unexpected error occurred.') };
  }
};

const docToObj = (snap) => snap.exists() ? { id: snap.id, ...snap.data() } : null;
const docsToArr = (snap) => snap.docs.map(d => ({ id: d.id, ...d.data() }));

// Split an array into chunks of `size` — needed for Firestore `in` queries (30-item limit)
const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

// ── Profile + Connection mappers ──────────────────────────────────────────────

const mapProfile = (p) => ({
  id: p.id, name: p.name, role: p.role,
  email: p.email, phone: p.phone || '',
  avatarUrl: p.avatar_url || '',
  bio: p.bio || '', location: p.location || '',
  certifications: p.certifications || [],
  gamesOfficiated: p.games_officiated || 0,
  rating: p.rating || 0,
  experience: p.experience || '',
  leagueName: p.league_name || '',
  activeTournaments: p.active_tournaments || 0,
  createdAt: p.created_at || '',
});

const mapConnection = (c) => ({
  id: c.id,
  managerId: c.manager_id,
  refereeId: c.referee_id,
  status: c.status,
  note: c.note || '',
  createdAt: c.created_at || '',
});

// ── Map helpers (same shape as demoDataService mappers) ──────────────────────

const mapGame = (gameId, gameData, allAssignments, allUsers, allTournaments) => {
  const tournament = allTournaments.find(t => t.id === gameData.tournament_id);
  const gameAssignments = allAssignments
    .filter(a => a.game_id === gameId)
    .map(a => {
      const ref = allUsers.find(u => u.id === a.referee_id) || {};
      const refObj = { id: ref.id, name: ref.name || 'Unassigned Referee', avatarUrl: ref.avatarUrl || '', email: ref.email };
      return { id: a.id, status: a.status, declineReason: a.decline_reason, refereeId: a.referee_id, referee: refObj };
    });

  return {
    id: gameId,
    homeTeam: gameData.home_team, awayTeam: gameData.away_team,
    date: gameData.game_date, time: gameData.game_time?.slice(0, 5) || gameData.game_time,
    venue: gameData.venue, status: gameData.status,
    payment: gameData.payment_amount,
    division: gameData.division, level: gameData.level,
    requiredCertifications: gameData.required_certifications || [],
    homeScore: gameData.home_score ?? null, awayScore: gameData.away_score ?? null,
    tournamentId: gameData.tournament_id,
    tournamentName: tournament?.name || 'Independent Game',
    managerId: gameData.manager_id || tournament?.manager_id || null,
    tournament: tournament ? { id: tournament.id, name: tournament.name, managerId: tournament.manager_id } : null,
    assignments: gameAssignments,
  };
};

const mapTournament = (t, gamesArr) => ({
  id: t.id, name: t.name,
  startDate: t.start_date, endDate: t.end_date,
  location: t.location,
  numberOfCourts: t.number_of_courts,
  managerId: t.manager_id,
  games: (gamesArr || []).filter(g => g.tournament_id === t.id).length,
  refereesNeeded: 0,
});

const mapPayment = (p) => ({
  id: p.id, gameId: p.game_id,
  amount: p.amount, status: p.status,
  date: p.payment_date,
  method: p.payment_method,
  refereeId: p.referee_id,
});

const mapMessage = (m, allUsers) => {
  const sender = allUsers.find(u => u.id === m.sender_id) || { name: 'System' };
  return {
    id: m.id, from: sender.name, fromAvatar: sender.avatarUrl || '',
    subject: m.subject, content: m.content,
    timestamp: m.created_at,
    read: m.is_read,
    senderId: m.sender_id, recipientId: m.recipient_id,
  };
};

const mapAvailability = (a) => ({
  id: a.id, startTime: a.start_time, endTime: a.end_time,
});

const mapGameReport = (r, gamesArr, allUsers) => {
  const game = gamesArr.find(g => g.id === r.game_id);
  const referee = allUsers.find(u => u.id === r.referee_id);
  return {
    id: r.id, gameId: r.game_id,
    gameTitle: game ? `${game.home_team} vs ${game.away_team}` : 'Game Report',
    refereeId: r.referee_id,
    refereeName: referee?.name || 'Referee',
    managerId: r.manager_id,
    homeScore: r.home_score, awayScore: r.away_score,
    professionalismRating: r.professionalism_rating,
    incidents: r.incidents, notes: r.notes,
    technicalFouls: r.technical_fouls ?? null, personalFouls: r.personal_fouls ?? null,
    ejections: r.ejections ?? null, mvpPlayer: r.mvp_player || null,
    status: r.status, createdAt: r.created_at,
    resolutionNote: r.resolution_note || null,
    resolvedBy: r.resolved_by || null, resolvedAt: r.resolved_at || null,
  };
};

// ── fetchAppData (replaces synchronous demoDataService version) ───────────────

export const fetchAppData = async (user) => {
  if (!user) return {};
  const isManager = user.role === 'manager';

  // 1. Fetch ALL users in one read, then split by role in JS.
  //    Eliminates 2 redundant getDocs calls (role=referee + all users + role=manager).
  const allUserSnap = await getDocs(collection(db, 'users'));
  const allUsers = docsToArr(allUserSnap).map(mapProfile);
  const allReferees = allUsers.filter(u => u.role === 'referee');
  const managerProfilesRaw = allUsers.filter(u => u.role === 'manager');

  // 2. Fetch games + assignments (based on role)
  let gamesRaw = [], assignmentsRaw = [];
  if (isManager) {
    const [gSnap, aSnap] = await Promise.all([
      getDocs(query(collection(db, 'games'), where('manager_id', '==', user.id))),
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
      ? getDocs(query(collection(db, 'tournaments'), where('manager_id', '==', user.id)))
      : getDocs(collection(db, 'tournaments')),
    getDocs(isManager
      ? query(collection(db, 'payments'), where('manager_id', '==', user.id))
      : query(collection(db, 'payments'), where('referee_id', '==', user.id))),
    getDocs(query(collection(db, 'messages'), where('participants', 'array-contains', user.id))),
    getDocs(query(collection(db, 'notifications'), where('recipient_id', '==', user.id))),
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
  const currentUserDoc = allUserSnap.docs.find(d => d.id === user.id);
  const savedPrefs = currentUserDoc?.data()?.notification_preferences || {};
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
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .map(m => mapMessage(m, allUsers)),
    notifications: notificationsRaw.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
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
  };
};

// ── Tournaments ───────────────────────────────────────────────────────────────

export const addTournament = async (user, tournamentData) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can add tournaments.');
  await addDoc(collection(db, 'tournaments'), {
    name: tournamentData.name,
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location,
    number_of_courts: Number(tournamentData.numberOfCourts),
    manager_id: user.id,
  });
});

export const updateTournamentRecord = async (user, tournamentId, tournamentData) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can update tournaments.');
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    name: tournamentData.name,
    start_date: tournamentData.startDate,
    end_date: tournamentData.endDate,
    location: tournamentData.location,
    number_of_courts: Number(tournamentData.numberOfCourts),
  });
});

export const deleteTournamentRecord = async (user, tournamentId) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can delete tournaments.');
  await deleteDoc(doc(db, 'tournaments', tournamentId));
});

// ── Games ─────────────────────────────────────────────────────────────────────

export const addGameRecord = async (user, gameData) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can schedule games.');
  await addDoc(collection(db, 'games'), {
    ...gameData,
    manager_id: user.id,
    game_time: gameData.game_time?.length === 5 ? `${gameData.game_time}:00` : gameData.game_time,
  });
});

export const markGameCompleted = async (user, gameId) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can complete games.');
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

export const assignReferee = async (user, gameId, refereeId) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can assign referees.');
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
    link: '/schedule', read: false, created_at: new Date().toISOString(),
    recipient_id: refereeId,
  });
});

export const unassignReferee = async (user, assignmentId) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can unassign referees.');
  await deleteDoc(doc(db, 'game_assignments', assignmentId));
});

export const updateAssignment = async (user, assignmentId, status, reason = null) => safeHandle(async () => {
  await updateDoc(doc(db, 'game_assignments', assignmentId), {
    status,
    decline_reason: reason,
  });
});

export const assignCourtSchedule = async (user, assignments) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can assign court schedules.');
  const batch = writeBatch(db);
  assignments.forEach(({ gameId, refereeId }) => {
    const ref = doc(collection(db, 'game_assignments'));
    batch.set(ref, { game_id: gameId, referee_id: refereeId, manager_id: user.id, status: 'assigned', decline_reason: null });
  });
  await batch.commit();
});

export const requestAssignment = async (user, gameId) => safeHandle(async () => {
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

export const sendMessageRecord = async (user, messageData) => safeHandle(async () => {
  const recipientId = messageData.recipientId || messageData.recipient_id;
  await addDoc(collection(db, 'messages'), {
    sender_id: user.id, recipient_id: recipientId,
    participants: [user.id, recipientId],
    subject: messageData.subject || 'No Subject',
    content: messageData.content || messageData.message || '',
    created_at: new Date().toISOString(), is_read: false,
  });
  await addDoc(collection(db, 'notifications'), {
    type: 'message', title: `New message from ${user.name}`,
    body: messageData.subject || 'You have a new message.',
    link: '/messages', read: false,
    created_at: new Date().toISOString(), recipient_id: recipientId,
  });
});

export const markMessageRead = async (user, messageId) => safeHandle(async () => {
  await updateDoc(doc(db, 'messages', messageId), { is_read: true });
});

// ── Availability ──────────────────────────────────────────────────────────────

export const addAvailabilityRecord = async (user, startDate, endDate) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can set availability.');
  await addDoc(collection(db, 'referee_availability'), {
    referee_id: user.id, start_time: startDate, end_time: endDate,
  });
});

// ── Game Reports ──────────────────────────────────────────────────────────────

export const submitGameReportRecord = async (user, reportData) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can submit game reports.');
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

export const markNotificationReadRecord = async (user, notificationId) => safeHandle(async () => {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
});

export const markAllNotificationsReadRecord = async (user) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'notifications'),
    where('recipient_id', '==', user.id),
    where('read', '==', false)
  ));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.update(d.ref, { read: true }));
  await batch.commit();
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const batchMarkPaymentsPaidRecord = async (user, paymentIds) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can process payments.');
  const batch = writeBatch(db);
  paymentIds.forEach(id => batch.update(doc(db, 'payments', id), { status: 'paid', payment_date: new Date().toISOString().slice(0, 10) }));
  await batch.commit();
});

// ── Batch Unassign ────────────────────────────────────────────────────────────

export const batchUnassignRefereesRecord = async (user, gameIds) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can batch-unassign.');
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

export const rateRefereeRecord = async (user, gameId, refereeId, stars, feedback) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can rate referees.');
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
      stars, feedback, created_at: new Date().toISOString(),
    });
  }
});

// ── Notification Preferences ──────────────────────────────────────────────────

export const saveNotificationPreferencesRecord = async (user, prefs) => safeHandle(async () => {
  await updateDoc(doc(db, 'users', user.id), { notification_preferences: prefs });
});

// ── Report Resolution ─────────────────────────────────────────────────────────

export const addReportResolutionRecord = async (user, reportId, note) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can resolve reports.');
  await updateDoc(doc(db, 'game_reports', reportId), {
    resolution_note: note, resolved_by: user.id,
    resolved_at: new Date().toISOString(), status: 'resolved',
  });
});

// ── Manager Connections ───────────────────────────────────────────────────────

export const requestManagerConnectionRecord = async (user, managerId, note) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can request connections.');
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

export const respondToConnectionRecord = async (user, connectionId, newStatus) => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('Only managers can respond to connections.');
  await updateDoc(doc(db, 'manager_connections', connectionId), { status: newStatus });
});

export const withdrawConnectionRecord = async (user, managerId) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can withdraw requests.');
  const snap = await getDocs(query(
    collection(db, 'manager_connections'),
    where('referee_id', '==', user.id),
    where('manager_id', '==', managerId)
  ));
  if (snap.empty) throw new Error('Connection not found.');
  await deleteDoc(snap.docs[0].ref);
});

// ── Independent Games ─────────────────────────────────────────────────────────

export const addIndependentGameRecord = async (user, gameData) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can log independent games.');
  await addDoc(collection(db, 'independent_games'), {
    referee_id: user.id, date: gameData.date, time: gameData.time || '',
    location: gameData.location || '', organization: gameData.organization || '',
    game_type: gameData.game_type || 'other', fee: Number(gameData.fee) || 0,
    notes: gameData.notes || '', created_at: new Date().toISOString(),
  });
});

export const updateIndependentGameRecord = async (user, gameId, gameData) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can update independent games.');
  await updateDoc(doc(db, 'independent_games', gameId), {
    date: gameData.date, time: gameData.time || '', location: gameData.location || '',
    organization: gameData.organization || '', game_type: gameData.game_type || 'other',
    fee: Number(gameData.fee) || 0, notes: gameData.notes || '',
  });
});

export const deleteIndependentGameRecord = async (user, gameId) => safeHandle(async () => {
  if (user?.role !== 'referee') throw new Error('Only referees can delete independent games.');
  await deleteDoc(doc(db, 'independent_games', gameId));
});
