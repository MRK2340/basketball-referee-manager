/**
 * bracketUtils.ts
 * Utility functions for generating and managing tournament brackets.
 * Supports: single elimination, double elimination, and round-robin/pool play.
 */

export type BracketFormat = 'single_elimination' | 'double_elimination' | 'round_robin';

export interface BracketTeam {
  name: string;
  seed: number;
}

export interface BracketMatch {
  id: string;
  roundIndex: number;
  position: number;
  team1: BracketTeam | null;
  team2: BracketTeam | null;
  score1: number | null;
  score2: number | null;
  winner: string | null;
  status: 'upcoming' | 'live' | 'completed';
  gameId?: string;
  // For double elimination
  bracket?: 'winners' | 'losers' | 'grand_final';
}

export interface BracketRound {
  name: string;
  matches: BracketMatch[];
}

export interface BracketData {
  id?: string;
  tournamentId: string;
  format: BracketFormat;
  teams: string[];
  rounds: BracketRound[];
  updatedAt: string;
}

// ── ID Generator ─────────────────────────────────────────────────────────────

let idCounter = 0;
const genId = () => `m${Date.now()}_${++idCounter}`;

// ── Single Elimination ───────────────────────────────────────────────────────

const ROUND_NAMES_SE: Record<number, string> = {
  1: 'Round 1', 2: 'Quarter Finals', 3: 'Semi Finals', 4: 'Finals',
};

const getRoundName = (roundNum: number, totalRounds: number): string => {
  const fromFinal = totalRounds - roundNum;
  if (fromFinal === 0) return 'Finals';
  if (fromFinal === 1) return 'Semi Finals';
  if (fromFinal === 2) return 'Quarter Finals';
  return `Round ${roundNum}`;
};

export const generateSingleElimination = (teams: string[]): BracketRound[] => {
  // Pad to next power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(teams.length, 2))));
  const seeded: (BracketTeam | null)[] = [];
  for (let i = 0; i < size; i++) {
    seeded.push(i < teams.length ? { name: teams[i], seed: i + 1 } : null);
  }

  const totalRounds = Math.log2(size);
  const rounds: BracketRound[] = [];

  // First round
  const firstRoundMatches: BracketMatch[] = [];
  for (let i = 0; i < size / 2; i++) {
    const t1 = seeded[i];
    const t2 = seeded[size - 1 - i];
    const isBye = !t1 || !t2;
    firstRoundMatches.push({
      id: genId(),
      roundIndex: 0,
      position: i,
      team1: t1,
      team2: t2,
      score1: isBye ? null : null,
      score2: isBye ? null : null,
      winner: isBye ? (t1?.name || t2?.name || null) : null,
      status: isBye ? 'completed' : 'upcoming',
    });
  }
  rounds.push({ name: getRoundName(1, totalRounds), matches: firstRoundMatches });

  // Subsequent rounds
  for (let r = 1; r < totalRounds; r++) {
    const prevMatches = rounds[r - 1].matches;
    const matches: BracketMatch[] = [];
    for (let i = 0; i < prevMatches.length / 2; i++) {
      const m1 = prevMatches[i * 2];
      const m2 = prevMatches[i * 2 + 1];
      const t1 = m1.winner ? { name: m1.winner, seed: 0 } : null;
      const t2 = m2.winner ? { name: m2.winner, seed: 0 } : null;
      matches.push({
        id: genId(),
        roundIndex: r,
        position: i,
        team1: t1,
        team2: t2,
        score1: null, score2: null,
        winner: null,
        status: 'upcoming',
      });
    }
    rounds.push({ name: getRoundName(r + 1, totalRounds), matches });
  }

  return rounds;
};

// ── Double Elimination ───────────────────────────────────────────────────────

export const generateDoubleElimination = (teams: string[]): BracketRound[] => {
  // Winners bracket = standard single elimination
  const winnerRounds = generateSingleElimination(teams);
  winnerRounds.forEach(r => {
    r.name = `W: ${r.name}`;
    r.matches.forEach(m => { m.bracket = 'winners'; });
  });

  // Losers bracket rounds (simplified — each round halves losers)
  const loserRounds: BracketRound[] = [];
  const totalWinnerRounds = winnerRounds.length;
  for (let i = 0; i < totalWinnerRounds - 1; i++) {
    const matchCount = Math.max(1, Math.ceil(winnerRounds[i].matches.length / 2));
    const matches: BracketMatch[] = [];
    for (let j = 0; j < matchCount; j++) {
      matches.push({
        id: genId(), roundIndex: winnerRounds.length + i, position: j,
        team1: null, team2: null, score1: null, score2: null,
        winner: null, status: 'upcoming', bracket: 'losers',
      });
    }
    loserRounds.push({ name: `L: Round ${i + 1}`, matches });
  }

  // Grand Final
  const grandFinal: BracketRound = {
    name: 'Grand Final',
    matches: [{
      id: genId(), roundIndex: winnerRounds.length + loserRounds.length, position: 0,
      team1: null, team2: null, score1: null, score2: null,
      winner: null, status: 'upcoming', bracket: 'grand_final',
    }],
  };

  return [...winnerRounds, ...loserRounds, grandFinal];
};

// ── Round Robin / Pool Play ──────────────────────────────────────────────────

export const generateRoundRobin = (teams: string[]): BracketRound[] => {
  const n = teams.length;
  const rounds: BracketRound[] = [];
  const paddedTeams = n % 2 === 0 ? [...teams] : [...teams, 'BYE'];
  const total = paddedTeams.length;
  const numRounds = total - 1;

  for (let r = 0; r < numRounds; r++) {
    const matches: BracketMatch[] = [];
    for (let i = 0; i < total / 2; i++) {
      const t1 = paddedTeams[i];
      const t2 = paddedTeams[total - 1 - i];
      if (t1 === 'BYE' || t2 === 'BYE') continue;
      matches.push({
        id: genId(), roundIndex: r, position: matches.length,
        team1: { name: t1, seed: teams.indexOf(t1) + 1 },
        team2: { name: t2, seed: teams.indexOf(t2) + 1 },
        score1: null, score2: null, winner: null, status: 'upcoming',
      });
    }
    rounds.push({ name: `Round ${r + 1}`, matches });
    // Rotate teams (keep first fixed)
    const last = paddedTeams.pop()!;
    paddedTeams.splice(1, 0, last);
  }
  return rounds;
};

// ── Generate Bracket ─────────────────────────────────────────────────────────

export const generateBracket = (format: BracketFormat, teams: string[]): BracketRound[] => {
  switch (format) {
    case 'single_elimination': return generateSingleElimination(teams);
    case 'double_elimination': return generateDoubleElimination(teams);
    case 'round_robin': return generateRoundRobin(teams);
  }
};

// ── Advance Winner (Single Elim) ─────────────────────────────────────────────

export const advanceWinner = (rounds: BracketRound[], matchId: string, winnerName: string): BracketRound[] => {
  const updated = JSON.parse(JSON.stringify(rounds)) as BracketRound[];

  for (let r = 0; r < updated.length - 1; r++) {
    const match = updated[r].matches.find(m => m.id === matchId);
    if (!match) continue;

    match.winner = winnerName;
    match.status = 'completed';

    // Find next round match
    const nextRound = updated[r + 1];
    if (!nextRound) break;
    const nextPos = Math.floor(match.position / 2);
    const nextMatch = nextRound.matches[nextPos];
    if (!nextMatch) break;

    const slot = match.position % 2 === 0 ? 'team1' : 'team2';
    nextMatch[slot] = { name: winnerName, seed: 0 };
    break;
  }

  return updated;
};
