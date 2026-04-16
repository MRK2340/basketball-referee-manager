/**
 * firestore/imports.ts
 * Batch import operations, duplicate detection, and import history management.
 */
import {
  db, collection, doc, getDoc, getDocs, addDoc, deleteDoc,
  query, where, orderBy, limit, writeBatch,
  safeHandle, chunkArray,
  type Doc, type SafeResult, type ServiceUser,
} from './helpers';

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

  const gameChunks = chunkArray(pastGames, 400);
  for (const chunk of gameChunks) {
    const batch = writeBatch(db);
    for (const g of chunk) {
      const ref = doc(collection(db, 'independent_games'));
      batch.set(ref, {
        referee_id: user.id, date: g.date, time: g.time || '',
        location: g.location || '', organization: g.organization || '',
        game_type: 'other', fee: Number(g.fee) || 0,
        notes: `Imported from schedule | ${g.level || ''}`.trim(),
        created_at: new Date().toISOString(),
      });
      createdIds.push(ref.id);
      gamesAdded++;
    }
    await batch.commit();
  }

  const availIds: string[] = [];
  const availChunks = chunkArray(futureDates, 400);
  for (const chunk of availChunks) {
    const batch = writeBatch(db);
    for (const slot of chunk) {
      const ref = doc(collection(db, 'referee_availability'));
      const dayStart = new Date(slot.date + 'T00:00:00');
      const dayEnd = new Date(slot.date + 'T23:59:59');
      batch.set(ref, { referee_id: user.id, start_time: dayStart.toISOString(), end_time: dayEnd.toISOString() });
      availIds.push(ref.id);
      availabilityAdded++;
    }
    await batch.commit();
  }

  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id, import_type: 'referee_schedule', file_name: fileName,
      games_added: gamesAdded, availability_added: availabilityAdded,
      game_ids: createdIds, availability_ids: availIds,
      created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch { /* non-critical */ }

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
        tournament_id: tournamentId, manager_id: user.id,
        home_team: g.homeTeam, away_team: g.awayTeam,
        game_date: g.date, game_time: g.time ? (g.time.length === 5 ? `${g.time}:00` : g.time) : '',
        venue: g.venue || '', division: g.division || '', level: g.level || '',
        payment_amount: Number(g.payment) || 0, required_certifications: [],
        status: 'scheduled', home_score: null, away_score: null,
      });
      createdIds.push(ref.id);
      added++;
    }
    await batch.commit();
  }

  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id, import_type: 'manager_games', tournament_id: tournamentId,
      file_name: fileName, games_added: added, game_ids: createdIds,
      created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch { /* non-critical */ }

  return { added, errors, importId };
});

// ── Batch Import: League Schedule ─────────────────────────────────────────────

export interface LeagueImportGame {
  date: string; time: string; homeTeam: string; awayTeam: string;
  venue: string; division: string; payment: number; refereeIds: string[];
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
        tournament_id: tournamentId, manager_id: user.id,
        home_team: g.homeTeam || 'TBD', away_team: g.awayTeam || 'TBD',
        game_date: g.date, game_time: g.time ? (g.time.length === 5 ? `${g.time}:00` : g.time) : '',
        venue: g.venue || '', division: g.division || '', level: '',
        payment_amount: Number(g.payment) || 0, required_certifications: [],
        status: 'scheduled', home_score: null, away_score: null,
      });
      createdGameIds.push(gameRef.id);
      gamesAdded++;
      for (const refId of g.refereeIds) {
        if (!refId) continue;
        const assignRef = doc(collection(db, 'game_assignments'));
        batch.set(assignRef, {
          game_id: gameRef.id, referee_id: refId, manager_id: user.id,
          status: 'assigned', decline_reason: null,
        });
        assignmentsAdded++;
      }
    }
    await batch.commit();
  }

  let importId = '';
  try {
    const historyRef = await addDoc(collection(db, '_import_history'), {
      user_id: user.id, import_type: 'league_schedule', tournament_id: tournamentId,
      file_name: fileName, games_added: gamesAdded, assignments_added: assignmentsAdded,
      game_ids: createdGameIds, created_at: new Date().toISOString(),
    });
    importId = historyRef.id;
  } catch { /* non-critical */ }

  return { gamesAdded, assignmentsAdded, importId };
});

// ── Duplicate Detection ──────────────────────────────────────────────────────

export const checkRefereeDuplicates = async (
  userId: string,
  rows: { date: string; organization: string }[],
): Promise<SafeResult<Set<string>>> => safeHandle(async () => {
  const snap = await getDocs(query(collection(db, 'independent_games'), where('referee_id', '==', userId)));
  const existing = new Set<string>();
  snap.docs.forEach(d => { const data = d.data(); existing.add(`${data.date}|${(data.organization || '').toLowerCase()}`); });
  const dupeKeys = new Set<string>();
  rows.forEach((r, i) => { if (existing.has(`${r.date}|${(r.organization || '').toLowerCase()}`)) dupeKeys.add(String(i)); });
  return dupeKeys;
});

export const checkManagerDuplicates = async (
  tournamentId: string,
  rows: { date: string; homeTeam: string; awayTeam: string }[],
): Promise<SafeResult<Set<string>>> => safeHandle(async () => {
  const snap = await getDocs(query(collection(db, 'games'), where('tournament_id', '==', tournamentId)));
  const existing = new Set<string>();
  snap.docs.forEach(d => { const data = d.data(); existing.add(`${data.game_date}|${(data.home_team || '').toLowerCase()}|${(data.away_team || '').toLowerCase()}`); });
  const dupeKeys = new Set<string>();
  rows.forEach((r, i) => { if (existing.has(`${r.date}|${(r.homeTeam || '').toLowerCase()}|${(r.awayTeam || '').toLowerCase()}`)) dupeKeys.add(String(i)); });
  return dupeKeys;
});

// ── Import History ───────────────────────────────────────────────────────────

export interface ImportHistoryRecord {
  id: string; importType: string; fileName: string;
  gamesAdded: number; availabilityAdded: number;
  createdAt: string; tournamentId?: string;
}

export const fetchImportHistory = async (userId: string): Promise<SafeResult<ImportHistoryRecord[]>> => safeHandle(async () => {
  const snap = await getDocs(query(
    collection(db, '_import_history'), where('user_id', '==', userId), orderBy('created_at', 'desc'), limit(20),
  ));
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id, importType: data.import_type, fileName: data.file_name,
      gamesAdded: data.games_added || 0, availabilityAdded: data.availability_added || 0,
      createdAt: data.created_at, tournamentId: data.tournament_id,
    };
  });
});

export const undoImport = async (user: ServiceUser, importId: string): Promise<SafeResult> => safeHandle(async () => {
  const historyDoc = await getDoc(doc(db, '_import_history', importId));
  if (!historyDoc.exists()) throw new Error('Import record not found.');
  const data = historyDoc.data();
  if (data.user_id !== user.id) throw new Error('Not authorized to undo this import.');

  const gameIds: string[] = (data.game_ids as string[]) || [];
  if (gameIds.length > 0) {
    const collectionName = data.import_type === 'manager_games' ? 'games' : 'independent_games';
    const chunks = chunkArray(gameIds, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(id => batch.delete(doc(db, collectionName, id)));
      await batch.commit();
    }
  }

  const availIds: string[] = (data.availability_ids as string[]) || [];
  if (availIds.length > 0) {
    const chunks = chunkArray(availIds, 400);
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach(id => batch.delete(doc(db, 'referee_availability', id)));
      await batch.commit();
    }
  }

  await deleteDoc(doc(db, '_import_history', importId));
});
