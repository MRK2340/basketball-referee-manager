/**
 * mappers.js
 * Pure Firestore-document → app-model transformers.
 * No Firestore SDK calls — easily unit-testable in isolation.
 */

export const mapProfile = (p) => ({
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

export const mapConnection = (c) => ({
  id: c.id,
  managerId: c.manager_id,
  refereeId: c.referee_id,
  status: c.status,
  note: c.note || '',
  createdAt: c.created_at || '',
});

export const mapGame = (gameId, gameData, allAssignments, allUsers, allTournaments) => {
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

export const mapTournament = (t, gamesArr) => ({
  id: t.id, name: t.name,
  startDate: t.start_date, endDate: t.end_date,
  location: t.location,
  numberOfCourts: t.number_of_courts,
  managerId: t.manager_id,
  games: (gamesArr || []).filter(g => g.tournament_id === t.id).length,
  refereesNeeded: 0,
});

export const mapPayment = (p) => ({
  id: p.id, gameId: p.game_id,
  amount: p.amount, status: p.status,
  date: p.payment_date,
  method: p.payment_method,
  refereeId: p.referee_id,
});

export const mapMessage = (m, allUsers) => {
  const sender = allUsers.find(u => u.id === m.sender_id) || { name: 'System' };
  return {
    id: m.id, from: sender.name, fromAvatar: sender.avatarUrl || '',
    subject: m.subject, content: m.content,
    timestamp: m.created_at,
    read: m.is_read,
    senderId: m.sender_id, recipientId: m.recipient_id,
  };
};

export const mapAvailability = (a) => ({
  id: a.id, startTime: a.start_time, endTime: a.end_time,
});

export const mapGameReport = (r, gamesArr, allUsers) => {
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
