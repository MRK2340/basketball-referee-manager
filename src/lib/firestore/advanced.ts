/**
 * firestore/advanced.ts
 * Pagination, public profiles, audit logging, GDPR, AI chat,
 * auto-assign, tournament brackets, login history, feedback, payment info.
 */
import {
  db, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, documentId, serverTimestamp, writeBatch,
  safeHandle, docsToArr, chunkArray, toISOString,
  type Doc, type SafeResult, type ServiceUser,
} from './helpers';
import {
  mapGame, mapTournament, mapMessage,
  type MappedProfile,
} from '../mappers';
import type { BracketData, BracketRound, BracketFormat } from '../bracketUtils';

// ── Pagination ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export const fetchMoreMessages = async (
  user: ServiceUser, afterTimestamp: string, allUsers: MappedProfile[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'messages'), where('participants', 'array-contains', user.id),
    orderBy('created_at', 'desc'), startAfter(afterTimestamp), limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs.map(m => mapMessage(m, allUsers)), hasMore: docs.length === PAGE_SIZE };
});

export const fetchMoreGames = async (
  managerId: string, afterDatetime: string,
  assignmentsRaw: Doc[], allUsers: MappedProfile[], tournamentsRaw: Doc[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'games'), where('manager_id', '==', managerId),
    orderBy('game_date', 'desc'), startAfter(afterDatetime), limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return {
    items: docs.map(g => mapGame(g.id as string, g, assignmentsRaw, allUsers, tournamentsRaw)),
    hasMore: docs.length === PAGE_SIZE,
  };
});

export const fetchMoreTournaments = async (
  managerId: string, afterName: string, gamesRaw: Doc[],
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'tournaments'), where('manager_id', '==', managerId),
    orderBy('name'), startAfter(afterName), limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs.map(t => mapTournament(t, gamesRaw)), hasMore: docs.length === PAGE_SIZE };
});

export const fetchMoreNotifications = async (
  userId: string, afterTimestamp: string,
) => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, 'notifications'), where('recipient_id', '==', userId),
    orderBy('created_at', 'desc'), startAfter(afterTimestamp), limit(PAGE_SIZE),
  ));
  const docs = docsToArr(snap);
  return { items: docs, hasMore: docs.length === PAGE_SIZE };
});

// ── Public Profile ────────────────────────────────────────────────────────────

export const fetchPublicRefereeProfile = async (refereeId: string) => safeHandle(async () => {
  const userSnap = await getDoc(doc(db, 'users', refereeId));
  if (!userSnap.exists()) throw new Error('Referee not found.');
  const data = userSnap.data();
  if (data.role !== 'referee') throw new Error('Profile not available.');

  const ratingsSnap = await getDocs(query(collection(db, 'referee_ratings'), where('referee_id', '==', refereeId)));
  const ratings = docsToArr(ratingsSnap);
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (Number(r.stars) || 0), 0) / ratings.length
    : (Number(data.rating) || 0);

  return {
    id: refereeId, name: data.name, avatarUrl: data.avatar_url || '',
    bio: data.bio || '', location: data.location || '',
    certifications: data.certifications || [],
    gamesOfficiated: data.games_officiated || 0,
    rating: Math.round(avgRating * 10) / 10,
    totalRatings: ratings.length,
    experience: data.experience || '', createdAt: data.created_at || '',
  };
});

// ── Audit Logging ─────────────────────────────────────────────────────────────

export const writeAuditLog = async (
  userId: string, action: string, target: string, details: string = '',
) => {
  try {
    await addDoc(collection(db, '_audit_log'), {
      user_id: userId, action, target, details, timestamp: serverTimestamp(),
    });
  } catch { /* best-effort */ }
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
    messages: docsToArr(messagesSnap), assignments: docsToArr(assignmentsSnap),
    gameReports: docsToArr(reportsSnap), ratings: docsToArr(ratingsSnap),
    availability: docsToArr(availabilitySnap), connections: docsToArr(connectionsSnap),
    independentGames: docsToArr(indGamesSnap), payments: docsToArr(paymentsSnap),
    exportedAt: new Date().toISOString(),
  };
});

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
  await deleteDoc(doc(db, 'users', user.id));
});

// ── AI Chat History ───────────────────────────────────────────────────────────

export const saveAIChatHistory = async (userId: string, messages: Doc[]): Promise<SafeResult> => safeHandle(async () => {
  await setDoc(doc(db, '_ai_chat_history', userId), {
    user_id: userId, messages: messages.slice(-50), updated_at: new Date().toISOString(),
  });
});

export const loadAIChatHistory = async (userId: string): Promise<SafeResult<Doc[]>> => safeHandle(async () => {
  const snap = await getDoc(doc(db, '_ai_chat_history', userId));
  if (!snap.exists()) return [];
  return (snap.data().messages || []) as Doc[];
});

export const clearAIChatHistory = async (userId: string): Promise<SafeResult> => safeHandle(async () => {
  await deleteDoc(doc(db, '_ai_chat_history', userId));
});

// ── Auto-Assign Referees ──────────────────────────────────────────────────────

interface AutoAssignSuggestion {
  gameId: string; gameLabel: string; refereeId: string; refereeName: string; reason: string;
}

export const generateAutoAssignSuggestions = async (
  user: ServiceUser, tournamentId: string,
): Promise<SafeResult<AutoAssignSuggestion[]>> => safeHandle(async () => {
  if (user?.role !== 'manager') throw new Error('permission-denied');

  const gamesSnap = await getDocs(query(
    collection(db, 'games'), where('tournament_id', '==', tournamentId), where('status', '==', 'scheduled'),
  ));
  const games = docsToArr(gamesSnap);
  const gameIds = games.map(g => g.id as string);
  if (gameIds.length === 0) return [];

  const assignChunks = chunkArray(gameIds, 30);
  const assignSnaps = await Promise.all(
    assignChunks.map(chunk => getDocs(query(collection(db, 'game_assignments'), where('game_id', 'in', chunk))))
  );
  const existingAssignments = assignSnaps.flatMap(docsToArr);
  const assignedGameIds = new Set(existingAssignments.map(a => a.game_id));
  const unassignedGames = games.filter(g => !assignedGameIds.has(g.id));
  if (unassignedGames.length === 0) return [];

  const connectionsSnap = await getDocs(query(
    collection(db, 'manager_connections'), where('manager_id', '==', user.id), where('status', '==', 'connected'),
  ));
  const connectedRefereeIds = docsToArr(connectionsSnap).map(c => c.referee_id as string);
  if (connectedRefereeIds.length === 0) return [];

  const refChunks = chunkArray(connectedRefereeIds, 30);
  const [refSnaps, availSnap] = await Promise.all([
    Promise.all(refChunks.map(chunk => getDocs(query(collection(db, 'users'), where(documentId(), 'in', chunk))))),
    getDocs(query(collection(db, 'referee_availability'))),
  ]);
  const referees = refSnaps.flatMap(docsToArr);
  const allAvailability = docsToArr(availSnap);

  const availMap = new Map<string, Set<string>>();
  allAvailability.forEach(a => {
    const dates = availMap.get(a.referee_id as string) || new Set();
    if (a.start_time) dates.add(new Date(a.start_time as string).toISOString().slice(0, 10));
    availMap.set(a.referee_id as string, dates);
  });

  const conflictMap = new Map<string, Set<string>>();
  existingAssignments.forEach(a => {
    const game = games.find(g => g.id === a.game_id);
    if (game) {
      const dates = conflictMap.get(a.referee_id as string) || new Set();
      dates.add(game.game_date as string);
      conflictMap.set(a.referee_id as string, dates);
    }
  });

  const suggestions: AutoAssignSuggestion[] = [];
  const assignedCounts = new Map<string, number>();

  for (const game of unassignedGames) {
    const gameDate = game.game_date as string;
    let bestRef: { id: string; name: string; score: number; reason: string } | null = null;

    for (const ref of referees) {
      const refId = ref.id as string;
      const refConflicts = conflictMap.get(refId);
      if (refConflicts?.has(gameDate)) continue;
      const refAvail = availMap.get(refId);
      const count = assignedCounts.get(refId) || 0;
      let score = 0;
      let reason = '';
      if (refAvail?.has(gameDate)) { score += 50; reason = 'Available on game date'; }
      else { score += 10; reason = 'No availability data'; }
      score += (Number(ref.rating) || 0) * 5;
      score -= count * 15;
      if (!bestRef || score > bestRef.score) {
        bestRef = { id: refId, name: ref.name as string, score, reason };
      }
    }

    if (bestRef) {
      suggestions.push({
        gameId: game.id as string,
        gameLabel: `${game.home_team} vs ${game.away_team} (${game.game_date})`,
        refereeId: bestRef.id, refereeName: bestRef.name, reason: bestRef.reason,
      });
      assignedCounts.set(bestRef.id, (assignedCounts.get(bestRef.id) || 0) + 1);
      const conflicts = conflictMap.get(bestRef.id) || new Set();
      conflicts.add(gameDate);
      conflictMap.set(bestRef.id, conflicts);
    }
  }

  return suggestions;
});

// ── Tournament Brackets ───────────────────────────────────────────────────────

export const saveBracket = async (bracket: BracketData, managerId: string): Promise<SafeResult<string>> => safeHandle(async () => {
  if (!managerId) throw new Error('permission-denied');
  const data: Doc = {
    tournament_id: bracket.tournamentId, format: bracket.format,
    teams: bracket.teams, rounds: JSON.parse(JSON.stringify(bracket.rounds)),
    updated_at: new Date().toISOString(), manager_id: managerId,
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
  const snap = await getDocs(query(collection(db, 'tournament_brackets'), where('tournament_id', '==', tournamentId), limit(1)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id, tournamentId: data.tournament_id,
    format: data.format as BracketFormat, teams: data.teams || [],
    rounds: (data.rounds || []) as BracketRound[], updatedAt: data.updated_at || '',
  };
});

export const deleteBracket = async (bracketId: string): Promise<SafeResult> => safeHandle(async () => {
  await deleteDoc(doc(db, 'tournament_brackets', bracketId));
});

// ── Login History ──────────────────────────────────────────────────────────

export interface LoginEvent {
  id: string; action: string; target: string; details: string; timestamp: string;
}

export const fetchLoginHistory = async (userId: string): Promise<SafeResult<LoginEvent[]>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, '_audit_log'), where('user_id', '==', userId),
    where('action', 'in', ['login', 'login_mfa']), orderBy('timestamp', 'desc'), limit(15),
  ));
  return snap.docs.map(d => {
    const data = d.data();
    return { id: d.id, action: data.action || '', target: data.target || '', details: data.details || '', timestamp: toISOString(data.timestamp) };
  });
});

// ── Feedback ───────────────────────────────────────────────────────────────

export const saveFeedback = async (
  userId: string, category: string, message: string,
): Promise<SafeResult> => safeHandle(async () => {
  await addDoc(collection(db, '_feedback'), {
    user_id: userId, category, message: message.slice(0, 2000), created_at: serverTimestamp(),
  });
});

// ── Payment Info ───────────────────────────────────────────────────────────

export interface PaymentInfo {
  preferredMethod: string; bankName: string; routingLast4: string;
  accountLast4: string; accountType: string; venmoHandle: string;
  zellePhone: string; paypalEmail: string; updatedAt: string;
}

export const fetchPaymentInfo = async (userId: string): Promise<SafeResult<PaymentInfo | null>> => safeHandle(async () => {
  const snap = await getDoc(doc(db, '_payment_info', userId));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    preferredMethod: d.preferred_method || '', bankName: d.bank_name || '',
    routingLast4: d.routing_last4 || '', accountLast4: d.account_last4 || '',
    accountType: d.account_type || 'checking', venmoHandle: d.venmo_handle || '',
    zellePhone: d.zelle_phone || '', paypalEmail: d.paypal_email || '',
    updatedAt: toISOString(d.updated_at),
  };
});

export const savePaymentInfo = async (
  userId: string, info: Partial<PaymentInfo>,
): Promise<SafeResult> => safeHandle(async () => {
  await setDoc(doc(db, '_payment_info', userId), {
    preferred_method: info.preferredMethod || '', bank_name: info.bankName || '',
    routing_last4: info.routingLast4 || '', account_last4: info.accountLast4 || '',
    account_type: info.accountType || 'checking', venmo_handle: info.venmoHandle || '',
    zelle_phone: info.zellePhone || '', paypal_email: info.paypalEmail || '',
    updated_at: serverTimestamp(),
  }, { merge: true });
});
