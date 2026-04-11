/**
 * mappers.test.js
 * Unit tests for all 8 pure mapper functions in src/lib/mappers.js
 */
import { describe, it, expect } from 'vitest';
import {
  mapProfile,
  mapConnection,
  mapGame,
  mapTournament,
  mapPayment,
  mapMessage,
  mapAvailability,
  mapGameReport,
} from '../lib/mappers';

// ── mapProfile ───────────────────────────────────────────────────────────────
describe('mapProfile', () => {
  it('maps all present fields correctly', () => {
    const raw = {
      id: 'u1', name: 'Alice', role: 'referee', email: 'a@test.com',
      phone: '555-0100', avatar_url: 'https://img.com/a.png',
      bio: 'My bio', location: 'LA',
      certifications: ['Level 1'], games_officiated: 42,
      rating: 4.8, experience: '3 years',
      league_name: 'AAU West', active_tournaments: 2,
      created_at: '2024-01-01',
    };
    const p = mapProfile(raw);
    expect(p.id).toBe('u1');
    expect(p.name).toBe('Alice');
    expect(p.role).toBe('referee');
    expect(p.email).toBe('a@test.com');
    expect(p.phone).toBe('555-0100');
    expect(p.avatarUrl).toBe('https://img.com/a.png');
    expect(p.bio).toBe('My bio');
    expect(p.location).toBe('LA');
    expect(p.certifications).toEqual(['Level 1']);
    expect(p.gamesOfficiated).toBe(42);
    expect(p.rating).toBe(4.8);
    expect(p.experience).toBe('3 years');
    expect(p.leagueName).toBe('AAU West');
    expect(p.activeTournaments).toBe(2);
    expect(p.createdAt).toBe('2024-01-01');
  });

  it('uses safe defaults for missing optional fields', () => {
    const raw = { id: 'u2', name: 'Bob', role: 'manager', email: 'b@test.com' };
    const p = mapProfile(raw);
    expect(p.phone).toBe('');
    expect(p.avatarUrl).toBe('');
    expect(p.bio).toBe('');
    expect(p.location).toBe('');
    expect(p.certifications).toEqual([]);
    expect(p.gamesOfficiated).toBe(0);
    expect(p.rating).toBe(0);
    expect(p.experience).toBe('');
    expect(p.leagueName).toBe('');
    expect(p.activeTournaments).toBe(0);
    expect(p.createdAt).toBe('');
  });
});

// ── mapConnection ────────────────────────────────────────────────────────────
describe('mapConnection', () => {
  it('maps all fields', () => {
    const raw = {
      id: 'c1', manager_id: 'm1', referee_id: 'r1',
      status: 'connected', note: 'Great ref', created_at: '2024-02-01',
    };
    const c = mapConnection(raw);
    expect(c.id).toBe('c1');
    expect(c.managerId).toBe('m1');
    expect(c.refereeId).toBe('r1');
    expect(c.status).toBe('connected');
    expect(c.note).toBe('Great ref');
    expect(c.createdAt).toBe('2024-02-01');
  });

  it('defaults note to empty string', () => {
    const raw = { id: 'c2', manager_id: 'm2', referee_id: 'r2', status: 'pending' };
    expect(mapConnection(raw).note).toBe('');
    expect(mapConnection(raw).createdAt).toBe('');
  });
});

// ── mapGame ──────────────────────────────────────────────────────────────────
describe('mapGame', () => {
  const gameId = 'g1';
  const tournament = { id: 't1', name: 'Spring Cup', manager_id: 'mgr1' };
  const refUser = { id: 'ref1', name: 'Dan', avatarUrl: 'img.png', email: 'd@test.com' };
  const allUsers = [refUser];
  const allTournaments = [tournament];
  const assignment = { id: 'a1', game_id: 'g1', referee_id: 'ref1', status: 'assigned', decline_reason: null };
  const allAssignments = [assignment];

  const rawGame = {
    home_team: 'Bulls', away_team: 'Hawks', game_date: '2024-03-10',
    game_time: '14:00:00', venue: 'Arena', status: 'scheduled',
    payment_amount: 75, division: 'U14', level: 'Regional',
    required_certifications: ['Level 1'], tournament_id: 't1',
    home_score: null, away_score: null, manager_id: null,
  };

  it('maps basic game fields', () => {
    const g = mapGame(gameId, rawGame, allAssignments, allUsers, allTournaments);
    expect(g.id).toBe('g1');
    expect(g.homeTeam).toBe('Bulls');
    expect(g.awayTeam).toBe('Hawks');
    expect(g.date).toBe('2024-03-10');
    expect(g.time).toBe('14:00');
    expect(g.venue).toBe('Arena');
    expect(g.status).toBe('scheduled');
    expect(g.payment).toBe(75);
    expect(g.division).toBe('U14');
    expect(g.level).toBe('Regional');
    expect(g.requiredCertifications).toEqual(['Level 1']);
  });

  it('resolves tournament correctly', () => {
    const g = mapGame(gameId, rawGame, allAssignments, allUsers, allTournaments);
    expect(g.tournamentId).toBe('t1');
    expect(g.tournamentName).toBe('Spring Cup');
    expect(g.tournament).toMatchObject({ id: 't1', name: 'Spring Cup' });
  });

  it('resolves assignments with referee names', () => {
    const g = mapGame(gameId, rawGame, allAssignments, allUsers, allTournaments);
    expect(g.assignments).toHaveLength(1);
    expect(g.assignments[0].refereeId).toBe('ref1');
    expect(g.assignments[0].referee.name).toBe('Dan');
  });

  it('shows fallback tournament name for standalone games', () => {
    const g = mapGame(gameId, { ...rawGame, tournament_id: null }, [], [], []);
    expect(g.tournamentName).toBe('Independent Game');
    expect(g.tournament).toBeNull();
  });

  it('slices HH:MM:SS time to HH:MM', () => {
    const g = mapGame(gameId, { ...rawGame, game_time: '09:30:00' }, [], allUsers, allTournaments);
    expect(g.time).toBe('09:30');
  });
});

// ── mapTournament ────────────────────────────────────────────────────────────
describe('mapTournament', () => {
  it('maps all fields', () => {
    const raw = {
      id: 't1', name: 'Spring Cup',
      start_date: '2024-04-01', end_date: '2024-04-03',
      location: 'Chicago', number_of_courts: 4, manager_id: 'mgr1',
    };
    const gamesArr = [{ tournament_id: 't1' }, { tournament_id: 't1' }, { tournament_id: 't2' }];
    const t = mapTournament(raw, gamesArr);
    expect(t.id).toBe('t1');
    expect(t.name).toBe('Spring Cup');
    expect(t.startDate).toBe('2024-04-01');
    expect(t.endDate).toBe('2024-04-03');
    expect(t.location).toBe('Chicago');
    expect(t.numberOfCourts).toBe(4);
    expect(t.managerId).toBe('mgr1');
    expect(t.games).toBe(2); // only 2 belong to t1
  });
});

// ── mapPayment ───────────────────────────────────────────────────────────────
describe('mapPayment', () => {
  it('maps all fields', () => {
    const raw = {
      id: 'pay1', game_id: 'g1', amount: 80, status: 'pending',
      payment_date: '2024-03-15', payment_method: 'Venmo', referee_id: 'r1',
    };
    const p = mapPayment(raw);
    expect(p.id).toBe('pay1');
    expect(p.gameId).toBe('g1');
    expect(p.amount).toBe(80);
    expect(p.status).toBe('pending');
    expect(p.date).toBe('2024-03-15');
    expect(p.method).toBe('Venmo');
    expect(p.refereeId).toBe('r1');
  });
});

// ── mapMessage ───────────────────────────────────────────────────────────────
describe('mapMessage', () => {
  const allUsers = [{ id: 'u1', name: 'Alice', avatarUrl: 'alice.png' }];

  it('resolves sender name from allUsers', () => {
    const raw = {
      id: 'msg1', sender_id: 'u1', recipient_id: 'u2',
      subject: 'Hello', content: 'Hi there',
      created_at: '2024-03-10T12:00:00Z', is_read: false,
    };
    const m = mapMessage(raw, allUsers);
    expect(m.id).toBe('msg1');
    expect(m.from).toBe('Alice');
    expect(m.fromAvatar).toBe('alice.png');
    expect(m.subject).toBe('Hello');
    expect(m.content).toBe('Hi there');
    expect(m.timestamp).toBe('2024-03-10T12:00:00Z');
    expect(m.read).toBe(false);
    expect(m.senderId).toBe('u1');
    expect(m.recipientId).toBe('u2');
  });

  it('falls back to "System" for unknown sender', () => {
    const raw = {
      id: 'msg2', sender_id: 'unknown', recipient_id: 'u1',
      subject: 'Sys', content: 'Note', created_at: '2024-01-01', is_read: true,
    };
    const m = mapMessage(raw, allUsers);
    expect(m.from).toBe('System');
    expect(m.fromAvatar).toBe('');
  });
});

// ── mapAvailability ──────────────────────────────────────────────────────────
describe('mapAvailability', () => {
  it('maps id, start_time, end_time', () => {
    const raw = { id: 'av1', start_time: '09:00', end_time: '17:00' };
    const a = mapAvailability(raw);
    expect(a.id).toBe('av1');
    expect(a.startTime).toBe('09:00');
    expect(a.endTime).toBe('17:00');
  });
});

// ── mapGameReport ─────────────────────────────────────────────────────────────
describe('mapGameReport', () => {
  const gamesArr = [{ id: 'g1', home_team: 'Bulls', away_team: 'Hawks' }];
  const allUsers = [{ id: 'r1', name: 'Dan' }];

  it('maps all fields and resolves game title + referee name', () => {
    const raw = {
      id: 'rep1', game_id: 'g1', referee_id: 'r1', manager_id: 'mgr1',
      home_score: 54, away_score: 48, professionalism_rating: 5,
      incidents: 'None', notes: 'Good game', technical_fouls: 0,
      personal_fouls: 10, ejections: 0, mvp_player: 'Player A',
      status: 'reviewed', created_at: '2024-03-10',
      resolution_note: 'All good', resolved_by: 'mgr1', resolved_at: '2024-03-11',
    };
    const r = mapGameReport(raw, gamesArr, allUsers);
    expect(r.id).toBe('rep1');
    expect(r.gameTitle).toBe('Bulls vs Hawks');
    expect(r.refereeName).toBe('Dan');
    expect(r.homeScore).toBe(54);
    expect(r.awayScore).toBe(48);
    expect(r.professionalismRating).toBe(5);
    expect(r.status).toBe('reviewed');
    expect(r.resolutionNote).toBe('All good');
    expect(r.mvpPlayer).toBe('Player A');
  });

  it('uses fallback title when game not found', () => {
    const raw = { id: 'rep2', game_id: 'missing', referee_id: 'r1', status: 'pending', created_at: '' };
    const r = mapGameReport(raw, [], allUsers);
    expect(r.gameTitle).toBe('Game Report');
    expect(r.refereeName).toBe('Dan');
  });

  it('uses "Referee" fallback when user not found', () => {
    const raw = { id: 'rep3', game_id: 'g1', referee_id: 'unknown', status: 'pending', created_at: '' };
    const r = mapGameReport(raw, gamesArr, []);
    expect(r.refereeName).toBe('Referee');
  });
});
