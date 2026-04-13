const GAME_LEVEL_HOURS = { varsity: 2, jv: 1.5, recreational: 1 };
const CERT_SCORE = { gold: 3, silver: 2, bronze: 1 };

const overlapMinutes = (s1, e1, s2, e2) => {
  const start = Math.max(s1, s2);
  const end   = Math.min(e1, e2);
  return Math.max(0, (end - start) / 60000);
};

export const getScheduleConflicts = (targetGame, allGames, allAssignments, targetRefereeId) => {
  const gStart = new Date(`${targetGame.date}T${targetGame.time}`);
  const bufferHours = GAME_LEVEL_HOURS[targetGame.level?.toLowerCase()] ?? 1.5;
  const gEnd = new Date(gStart.getTime() + bufferHours * 3600000);

  return allAssignments
    .filter(a => a.refereeId === targetRefereeId && a.game_id !== targetGame.id)
    .map(a => allGames.find(g => g.id === a.game_id))
    .filter(Boolean)
    .filter(g => {
      const s = new Date(`${g.date}T${g.time}`);
      const hrs = GAME_LEVEL_HOURS[g.level?.toLowerCase()] ?? 1.5;
      const e   = new Date(s.getTime() + hrs * 3600000);
      return overlapMinutes(gStart, gEnd, s, e) > 0;
    });
};

export const checkAvailabilitySlots = (referee, targetGame) => {
  const slots = referee.availability || [];
  if (!slots.length) return null;

  const gStart = new Date(`${targetGame.date}T${targetGame.time}`);
  const bufferHours = GAME_LEVEL_HOURS[targetGame.level?.toLowerCase()] ?? 1.5;
  const gEnd = new Date(gStart.getTime() + bufferHours * 3600000);

  for (const slot of slots) {
    const sStart = new Date(slot.startTime);
    const sEnd   = new Date(slot.endTime);
    if (sStart <= gStart && sEnd >= gEnd) return 'available';
  }

  for (const slot of slots) {
    const sStart = new Date(slot.startTime);
    const sEnd   = new Date(slot.endTime);
    if (overlapMinutes(gStart, gEnd, sStart, sEnd) > 0) return 'partial';
  }

  return 'unavailable';
};

/**
 * getRefereeStatus - returns { status, conflicts } for a single referee + game.
 * Consumers: GameAssignmentsTab, Schedule/GameCard
 */
export const getRefereeStatus = (referee, targetGame, allGames) => {
  if (!targetGame || !referee) return { status: 'no-data', conflicts: [] };

  // Build all assignments across all games (add game_id for conflict lookup)
  const allAssignments = (allGames || []).flatMap(g =>
    (g.assignments || []).map(a => ({ ...a, game_id: g.id }))
  );

  // 1. Schedule conflicts take highest priority
  const conflicts = getScheduleConflicts(targetGame, allGames || [], allAssignments, referee.id);
  if (conflicts.length > 0) {
    return { status: 'conflict', conflicts };
  }

  // 2. Missing required certifications
  const gameRequired = targetGame.requiredCertifications || [];
  const refCerts = referee.certifications || [];
  if (gameRequired.length > 0 && !gameRequired.every(c => refCerts.includes(c))) {
    return { status: 'missing-certs', conflicts: [] };
  }

  // 3. Availability
  const avail = checkAvailabilitySlots(referee, targetGame);
  if (avail === 'available') return { status: 'available', conflicts: [] };
  if (avail === 'partial')   return { status: 'partial',   conflicts: [] };
  if (avail === 'unavailable') return { status: 'unavailable', conflicts: [] };

  return { status: 'no-data', conflicts: [] };
};

export const rankReferees = (referees, targetGame, allGames) => {
  if (!targetGame) return referees;

  const allAssignments = allGames.flatMap(g => (g.assignments || []).map(a => ({ ...a, game_id: g.id })));

  return referees
    .map(referee => {
      const conflicts = getScheduleConflicts(targetGame, allGames, allAssignments, referee.id);
      const availStatus = checkAvailabilitySlots(referee, targetGame);

      let fitScore = 50;
      if (availStatus === 'available')   fitScore += 30;
      if (availStatus === 'partial')     fitScore += 10;
      if (availStatus === 'unavailable') fitScore -= 20;
      if (conflicts.length > 0)          fitScore -= 40;

      const certLevel = (referee.certifications || []).reduce((best, c) => {
        const s = CERT_SCORE[c?.toLowerCase()] ?? 0;
        return s > best ? s : best;
      }, 0);
      fitScore += certLevel * 5;

      const gameRequired = targetGame.requiredCertifications || [];
      const refCerts     = referee.certifications || [];
      const certsMet = gameRequired.every(c => refCerts.includes(c));
      if (!certsMet && gameRequired.length > 0) fitScore -= 25;

      const expScore = (referee.gamesOfficiated || 0) * 0.02;
      fitScore += Math.min(expScore, 10);
      fitScore += (referee.rating || 0) * 2;
      fitScore = Math.max(0, Math.min(100, fitScore));

      return {
        ...referee,
        fitScore,
        fitStatus: { availStatus, conflicts, certsMet, certLevel },
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
};
