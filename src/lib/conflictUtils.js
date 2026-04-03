const GAME_DURATION_MINS = 90;

const toDate = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  return new Date(`${dateStr}T${timeStr}`);
};

/**
 * Returns games where the referee is already assigned that overlap with the target game.
 */
export const getScheduleConflicts = (refereeId, targetGame, allGames) => {
  const targetStart = toDate(
    targetGame.game_date || targetGame.date,
    targetGame.game_time || targetGame.time
  );
  if (!targetStart) return [];
  const targetEnd = new Date(targetStart.getTime() + GAME_DURATION_MINS * 60000);

  return allGames.filter((g) => {
    if (g.id === targetGame.id) return false;
    const assignments = g.game_assignments || g.assignments || [];
    if (!assignments.some((a) => a.referee_id === refereeId)) return false;
    const gStart = toDate(g.game_date || g.date, g.game_time || g.time);
    if (!gStart) return false;
    const gEnd = new Date(gStart.getTime() + GAME_DURATION_MINS * 60000);
    return targetStart < gEnd && targetEnd > gStart;
  });
};

/**
 * Checks if the referee has a logged availability window covering the full game slot.
 * Returns true (available), false (unavailable during that window), or null (no data logged).
 */
export const isRefereeAvailable = (referee, targetGame) => {
  const slots = referee.referee_availability || [];
  if (slots.length === 0) return null; // no data

  const gameStart = toDate(
    targetGame.game_date || targetGame.date,
    targetGame.game_time || targetGame.time
  );
  if (!gameStart) return null;
  const gameEnd = new Date(gameStart.getTime() + GAME_DURATION_MINS * 60000);

  return slots.some((slot) => {
    const slotStart = new Date(slot.start_time || slot.startTime);
    const slotEnd = new Date(slot.end_time || slot.endTime);
    return slotStart <= gameStart && slotEnd >= gameEnd;
  });
};

/**
 * Returns true if the referee holds all certifications required for the game.
 */
export const hasCertifications = (referee, game) => {
  const required = game.required_certifications || game.requiredCertifications || [];
  if (required.length === 0) return true;
  const refCerts = new Set(referee.certifications || []);
  return required.every((c) => refCerts.has(c));
};

/**
 * Returns a status object for a referee relative to a specific game.
 * status: 'conflict' | 'unavailable' | 'missing-certs' | 'no-data' | 'available'
 */
export const getRefereeStatus = (referee, game, allGames) => {
  const conflicts = getScheduleConflicts(referee.id, game, allGames);
  if (conflicts.length > 0) return { status: 'conflict', conflicts };

  const available = isRefereeAvailable(referee, game);
  if (available === false) return { status: 'unavailable', conflicts: [] };

  if (!hasCertifications(referee, game)) {
    return { status: 'missing-certs', conflicts: [] };
  }

  if (available === null) return { status: 'no-data', conflicts: [] };

  return { status: 'available', conflicts: [] };
};

const STATUS_SCORE = {
  available: 100,
  'no-data': 60,
  'missing-certs': 30,
  unavailable: 10,
  conflict: 0,
};

/**
 * Assigns a numeric fit score to a referee for ranking purposes.
 */
export const scoreReferee = (referee, game, allGames) => {
  const { status } = getRefereeStatus(referee, game, allGames);
  const statusScore = STATUS_SCORE[status] ?? 0;
  const ratingScore = (referee.rating || 0) * 5;
  const expScore = (referee.games_officiated || 0) * 0.02;
  return statusScore + ratingScore + expScore;
};

/**
 * Returns a copy of the referees array sorted from best fit to worst,
 * each decorated with `fitStatus` and `fitScore`.
 */
export const rankReferees = (referees, game, allGames) =>
  referees
    .map((ref) => ({
      ...ref,
      fitStatus: getRefereeStatus(ref, game, allGames),
      fitScore: scoreReferee(ref, game, allGames),
    }))
    .sort((a, b) => b.fitScore - a.fitScore);
