/**
 * mappers.ts
 * Pure Firestore-document → app-model transformers.
 * No Firestore SDK calls — easily unit-testable in isolation.
 */
import { toISOString } from './timestampUtils';

/** Raw Firestore document — typed as Record<string, unknown> for safety. */
type Doc = Record<string, unknown>;

/** Safely retrieve a string field from a raw Firestore doc. */
const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' ? v : fallback);
const arr = (v: unknown): string[] => (Array.isArray(v) ? v : []);
const bool = (v: unknown): boolean => !!v;

export interface MappedProfile {
  id: string; name: string; role: string;
  email: string; phone: string; avatarUrl: string;
  bio: string; location: string; certifications: string[];
  gamesOfficiated: number; rating: number; experience: string;
  leagueName: string; activeTournaments: number; createdAt: string;
}

export const mapProfile = (p: Doc): MappedProfile => ({
  id: str(p.id), name: str(p.name), role: str(p.role),
  email: str(p.email), phone: str(p.phone),
  avatarUrl: str(p.avatar_url),
  bio: str(p.bio), location: str(p.location),
  certifications: arr(p.certifications),
  gamesOfficiated: num(p.games_officiated),
  rating: num(p.rating),
  experience: str(p.experience),
  leagueName: str(p.league_name),
  activeTournaments: num(p.active_tournaments),
  createdAt: str(p.created_at),
});

export interface MappedConnection {
  id: string; managerId: string; refereeId: string;
  status: string; note: string; createdAt: string;
}

export const mapConnection = (c: Doc): MappedConnection => ({
  id: str(c.id), managerId: str(c.manager_id), refereeId: str(c.referee_id),
  status: str(c.status), note: str(c.note), createdAt: str(c.created_at),
});

export interface MappedAssignment {
  id: string; status: string; declineReason: string | null;
  refereeId: string;
  referee: { id: string; name: string; avatarUrl: string; email: string };
}

export interface MappedGame {
  id: string; homeTeam: string; awayTeam: string;
  date: string; time: string; venue: string; status: string;
  payment: number; division: string; level: string;
  requiredCertifications: string[];
  homeScore: number | null; awayScore: number | null;
  tournamentId: string; tournamentName: string;
  managerId: string | null;
  tournament: { id: string; name: string; managerId: string } | null;
  assignments: MappedAssignment[];
}

export const mapGame = (
  gameId: string, gameData: Doc, allAssignments: Doc[], allUsers: MappedProfile[], allTournaments: Doc[],
): MappedGame => {
  const tournament = allTournaments.find(t => t.id === gameData.tournament_id);
  const gameAssignments = allAssignments
    .filter(a => a.game_id === gameId)
    .map(a => {
      const ref = allUsers.find(u => u.id === str(a.referee_id)) || {} as Partial<MappedProfile>;
      return {
        id: str(a.id), status: str(a.status), declineReason: a.decline_reason as string | null,
        refereeId: str(a.referee_id),
        referee: { id: ref.id || '', name: ref.name || 'Unassigned Referee', avatarUrl: ref.avatarUrl || '', email: ref.email || '' },
      };
    });

  const gameTime = str(gameData.game_time);
  return {
    id: gameId,
    homeTeam: str(gameData.home_team), awayTeam: str(gameData.away_team),
    date: str(gameData.game_date), time: gameTime.slice(0, 5) || gameTime,
    venue: str(gameData.venue), status: str(gameData.status),
    payment: num(gameData.payment_amount),
    division: str(gameData.division), level: str(gameData.level),
    requiredCertifications: arr(gameData.required_certifications),
    homeScore: gameData.home_score != null ? num(gameData.home_score) : null,
    awayScore: gameData.away_score != null ? num(gameData.away_score) : null,
    tournamentId: str(gameData.tournament_id),
    tournamentName: str(tournament?.name) || 'Independent Game',
    managerId: str(gameData.manager_id) || str(tournament?.manager_id) || null,
    tournament: tournament ? { id: str(tournament.id), name: str(tournament.name), managerId: str(tournament.manager_id) } : null,
    assignments: gameAssignments,
  };
};

export interface MappedTournament {
  id: string; name: string; startDate: string; endDate: string;
  location: string; numberOfCourts: number; managerId: string;
  games: number; refereesNeeded: number;
  archived: boolean; archivedAt: string | null;
}

export const mapTournament = (t: Doc, gamesArr: Doc[]): MappedTournament => ({
  id: str(t.id), name: str(t.name),
  startDate: str(t.start_date), endDate: str(t.end_date),
  location: str(t.location), numberOfCourts: num(t.number_of_courts),
  managerId: str(t.manager_id),
  games: (gamesArr || []).filter((g: Doc) => g.tournament_id === t.id).length,
  refereesNeeded: 0,
  archived: bool(t.archived),
  archivedAt: t.archived_at ? str(t.archived_at) : null,
});

export interface MappedPayment {
  id: string; gameId: string; amount: number; status: string;
  date: string; method: string; refereeId: string;
}

export const mapPayment = (p: Doc): MappedPayment => ({
  id: str(p.id), gameId: str(p.game_id), amount: num(p.amount), status: str(p.status),
  date: str(p.payment_date), method: str(p.payment_method), refereeId: str(p.referee_id),
});

export interface MappedMessage {
  id: string; from: string; fromAvatar: string;
  subject: string; content: string; timestamp: string;
  read: boolean; senderId: string; recipientId: string;
}

export const mapMessage = (m: Doc, allUsers: MappedProfile[]): MappedMessage => {
  const sender = allUsers.find(u => u.id === str(m.sender_id)) || { name: 'System', avatarUrl: '' };
  return {
    id: str(m.id), from: sender.name, fromAvatar: sender.avatarUrl || '',
    subject: str(m.subject), content: str(m.content),
    timestamp: toISOString(m.created_at),
    read: bool(m.is_read), senderId: str(m.sender_id), recipientId: str(m.recipient_id),
  };
};

export interface MappedAvailability { id: string; startTime: string; endTime: string; }

export const mapAvailability = (a: Doc): MappedAvailability => ({
  id: str(a.id), startTime: str(a.start_time), endTime: str(a.end_time),
});

export interface MappedGameReport {
  id: string; gameId: string; gameTitle: string;
  refereeId: string; refereeName: string; managerId: string;
  homeScore: number; awayScore: number; professionalismRating: number;
  incidents: string; notes: string;
  technicalFouls: number | null; personalFouls: number | null;
  ejections: number | null; mvpPlayer: string | null;
  status: string; createdAt: string;
  resolutionNote: string | null; resolvedBy: string | null; resolvedAt: string | null;
}

export const mapGameReport = (r: Doc, gamesArr: Doc[], allUsers: MappedProfile[]): MappedGameReport => {
  const game = gamesArr.find(g => g.id === str(r.game_id));
  const referee = allUsers.find(u => u.id === str(r.referee_id));
  return {
    id: str(r.id), gameId: str(r.game_id),
    gameTitle: game ? `${str(game.home_team)} vs ${str(game.away_team)}` : 'Game Report',
    refereeId: str(r.referee_id), refereeName: referee?.name || 'Referee', managerId: str(r.manager_id),
    homeScore: num(r.home_score), awayScore: num(r.away_score),
    professionalismRating: num(r.professionalism_rating),
    incidents: str(r.incidents), notes: str(r.notes),
    technicalFouls: r.technical_fouls != null ? num(r.technical_fouls) : null,
    personalFouls: r.personal_fouls != null ? num(r.personal_fouls) : null,
    ejections: r.ejections != null ? num(r.ejections) : null,
    mvpPlayer: r.mvp_player ? str(r.mvp_player) : null,
    status: str(r.status), createdAt: str(r.created_at),
    resolutionNote: r.resolution_note ? str(r.resolution_note) : null,
    resolvedBy: r.resolved_by ? str(r.resolved_by) : null,
    resolvedAt: r.resolved_at ? str(r.resolved_at) : null,
  };
};
