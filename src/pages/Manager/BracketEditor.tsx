import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { generateBracket, advanceWinner, type BracketData, type BracketFormat, type BracketMatch, type BracketRound } from '@/lib/bracketUtils';
import { saveBracket, loadBracket } from '@/lib/firestoreService';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import {
  Trophy, Plus, X, Save, Loader2, CheckCircle2, Users, Swords, RefreshCw,
} from 'lucide-react';

// ── Match Card Component ─────────────────────────────────────────────────────

interface MatchCardProps {
  match: BracketMatch;
  onSetScore: (matchId: string, score1: number, score2: number) => void;
  isManager: boolean;
}

const MatchCard = ({ match, onSetScore, isManager }: MatchCardProps) => {
  const [editing, setEditing] = useState(false);
  const [s1, setS1] = useState(String(match.score1 ?? ''));
  const [s2, setS2] = useState(String(match.score2 ?? ''));

  const statusColor = match.status === 'completed' ? 'border-green-300 bg-green-50/50'
    : match.status === 'live' ? 'border-orange-300 bg-orange-50/50 ring-2 ring-orange-200'
    : 'border-slate-200 bg-white';

  const handleSave = () => {
    const n1 = parseInt(s1, 10) || 0;
    const n2 = parseInt(s2, 10) || 0;
    onSetScore(match.id, n1, n2);
    setEditing(false);
  };

  return (
    <div
      className={`border rounded-lg p-2 min-w-[180px] ${statusColor} transition-all`}
      data-testid={`bracket-match-${match.id}`}
    >
      {/* Team 1 */}
      <div className={`flex items-center justify-between py-1 px-2 rounded text-xs ${match.winner === match.team1?.name ? 'font-bold text-green-700 bg-green-100/50' : 'text-slate-700'}`}>
        <span className="truncate max-w-[100px]">{match.team1?.name || 'TBD'}</span>
        {editing ? (
          <Input type="number" value={s1} onChange={e => setS1(e.target.value)} className="w-10 h-6 text-xs text-center p-0 border-slate-300" />
        ) : (
          <span className="font-mono text-sm font-semibold">{match.score1 ?? '-'}</span>
        )}
      </div>

      <div className="border-t border-slate-200 my-0.5" />

      {/* Team 2 */}
      <div className={`flex items-center justify-between py-1 px-2 rounded text-xs ${match.winner === match.team2?.name ? 'font-bold text-green-700 bg-green-100/50' : 'text-slate-700'}`}>
        <span className="truncate max-w-[100px]">{match.team2?.name || 'TBD'}</span>
        {editing ? (
          <Input type="number" value={s2} onChange={e => setS2(e.target.value)} className="w-10 h-6 text-xs text-center p-0 border-slate-300" />
        ) : (
          <span className="font-mono text-sm font-semibold">{match.score2 ?? '-'}</span>
        )}
      </div>

      {/* Actions */}
      {isManager && match.team1 && match.team2 && match.status !== 'completed' && (
        <div className="mt-1.5">
          {editing ? (
            <div className="flex gap-1">
              <Button size="sm" className="h-6 text-[10px] flex-1 basketball-gradient text-white" onClick={handleSave}>
                <CheckCircle2 className="h-3 w-3 mr-0.5" /> Save
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-[10px] border-slate-200" onClick={() => setEditing(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="h-6 text-[10px] w-full border-slate-200 text-slate-500" onClick={() => setEditing(true)} data-testid={`bracket-score-btn-${match.id}`}>
              <Swords className="h-3 w-3 mr-1" /> Set Score
            </Button>
          )}
        </div>
      )}

      {match.status === 'completed' && (
        <div className="mt-1 text-center">
          <Badge variant="outline" className="text-[9px] border-green-200 text-green-600">Complete</Badge>
        </div>
      )}
    </div>
  );
};

// ── Bracket View ─────────────────────────────────────────────────────────────

interface BracketViewProps {
  rounds: BracketRound[];
  onSetScore: (matchId: string, score1: number, score2: number) => void;
  isManager: boolean;
  format: BracketFormat;
}

const BracketView = ({ rounds, onSetScore, isManager, format }: BracketViewProps) => {
  if (format === 'round_robin') {
    return (
      <div className="space-y-6">
        {rounds.map((round, ri) => (
          <div key={ri}>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">{round.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {round.matches.map(match => (
                <MatchCard key={match.id} match={match} onSetScore={onSetScore} isManager={isManager} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Single / Double Elimination — horizontal bracket tree
  const winnersRounds = rounds.filter(r => !r.name.startsWith('L:') && r.name !== 'Grand Final');
  const losersRounds = rounds.filter(r => r.name.startsWith('L:'));
  const grandFinal = rounds.find(r => r.name === 'Grand Final');

  return (
    <div className="space-y-8">
      {/* Winners bracket */}
      <div>
        {format === 'double_elimination' && <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Winners Bracket</p>}
        <div className="flex gap-8 overflow-x-auto pb-4 no-scrollbar items-start" data-testid="bracket-tree">
          {winnersRounds.map((round, ri) => (
            <div key={ri} className="flex flex-col gap-4 shrink-0" style={{ paddingTop: ri * 24 }}>
              <p className="text-xs font-semibold text-slate-500 text-center mb-1">{round.name.replace('W: ', '')}</p>
              {round.matches.map(match => (
                <div key={match.id} style={{ marginBottom: ri * 16 }}>
                  <MatchCard match={match} onSetScore={onSetScore} isManager={isManager} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Losers bracket */}
      {losersRounds.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Losers Bracket</p>
          <div className="flex gap-8 overflow-x-auto pb-4 no-scrollbar items-start">
            {losersRounds.map((round, ri) => (
              <div key={ri} className="flex flex-col gap-4 shrink-0">
                <p className="text-xs font-semibold text-slate-500 text-center mb-1">{round.name.replace('L: ', '')}</p>
                {round.matches.map(match => (
                  <MatchCard key={match.id} match={match} onSetScore={onSetScore} isManager={isManager} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grand Final */}
      {grandFinal && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase mb-2 tracking-wide">Grand Final</p>
          {grandFinal.matches.map(match => (
            <MatchCard key={match.id} match={match} onSetScore={onSetScore} isManager={isManager} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Bracket Editor Component ────────────────────────────────────────────

interface Props {
  tournamentId: string;
  tournamentName: string;
}

export const BracketEditor = ({ tournamentId, tournamentName }: Props) => {
  const { user } = useAuth();
  const { games } = useData();
  const isManager = user?.role === 'manager';

  const [bracket, setBracket] = useState<BracketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  // Setup state
  const [format, setFormat] = useState<BracketFormat>('single_elimination');
  const [teamsInput, setTeamsInput] = useState('');

  // Extract team names from tournament games
  const tournamentTeams = useMemo(() => {
    const teamSet = new Set<string>();
    games.filter(g => g.tournamentId === tournamentId).forEach(g => {
      if (g.homeTeam && g.homeTeam !== 'TBD') teamSet.add(g.homeTeam);
      if (g.awayTeam && g.awayTeam !== 'TBD') teamSet.add(g.awayTeam);
    });
    return Array.from(teamSet).sort();
  }, [games, tournamentId]);

  // Load bracket
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await loadBracket(tournamentId);
        if (!cancelled) {
          if (data) setBracket(data);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [tournamentId]);

  // Real-time sync via onSnapshot
  useEffect(() => {
    let active = true;
    const q = query(
      collection(db, 'tournament_brackets'),
      where('tournament_id', '==', tournamentId),
      limit(1),
    );
    const unsub = onSnapshot(q, (snap) => {
      if (!active) return;
      if (!snap.empty) {
        const d = snap.docs[0];
        const data = d.data();
        if (data && data.format && data.rounds) {
          setBracket({
            id: d.id,
            tournamentId: data.tournament_id,
            format: data.format as BracketFormat,
            teams: data.teams || [],
            rounds: (data.rounds || []) as BracketRound[],
            updatedAt: data.updated_at || '',
          });
        }
      }
      // Ensure loading is cleared even on empty snapshots
      setLoading(false);
    }, () => {
      // Listener error (permissions/index) — ensure loading clears
      if (active) setLoading(false);
    });
    return () => { active = false; unsub(); };
  }, [tournamentId]);

  // Create bracket
  const handleCreate = useCallback(async () => {
    const teams = teamsInput.split('\n').map(t => t.trim()).filter(Boolean);
    if (teams.length < 2) {
      toast({ title: 'Need at least 2 teams', variant: 'destructive' });
      return;
    }
    const rounds = generateBracket(format, teams);
    const newBracket: BracketData = {
      id: bracket?.id || undefined, // Overwrite existing if corrupt
      tournamentId, format, teams, rounds, updatedAt: new Date().toISOString(),
    };
    setSaving(true);
    const { data: id, error } = await saveBracket(newBracket);
    if (error) toast({ title: 'Failed to create bracket', description: error.message, variant: 'destructive' });
    else {
      newBracket.id = id!;
      setBracket(newBracket);
      setShowSetup(false);
      toast({ title: 'Bracket Created' });
    }
    setSaving(false);
  }, [teamsInput, format, tournamentId]);

  // Set score + advance winner
  const handleSetScore = useCallback(async (matchId: string, score1: number, score2: number) => {
    if (!bracket) return;
    const winnerName = score1 > score2
      ? bracket.rounds.flatMap(r => r.matches).find(m => m.id === matchId)?.team1?.name
      : bracket.rounds.flatMap(r => r.matches).find(m => m.id === matchId)?.team2?.name;

    let updatedRounds = bracket.rounds.map(r => ({
      ...r,
      matches: r.matches.map(m =>
        m.id === matchId
          ? { ...m, score1, score2, winner: winnerName || null, status: 'completed' as const }
          : m
      ),
    }));

    // Advance winner to next round (single/double elim)
    if (winnerName && bracket.format !== 'round_robin') {
      updatedRounds = advanceWinner(updatedRounds, matchId, winnerName);
    }

    const updated = { ...bracket, rounds: updatedRounds, updatedAt: new Date().toISOString() };
    setBracket(updated);
    await saveBracket(updated);
    toast({ title: `${winnerName} wins!` });
  }, [bracket]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!bracket) {
    return (
      <div className="text-center py-12" data-testid="bracket-empty">
        <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-semibold mb-2">No bracket yet</p>
        <p className="text-slate-400 text-sm mb-6">Create a tournament bracket to visualize the competition.</p>
        {isManager && (
          <Button className="basketball-gradient text-white hover:opacity-90" onClick={() => {
            setTeamsInput(tournamentTeams.join('\n'));
            setShowSetup(true);
          }} data-testid="bracket-create-btn">
            <Plus className="h-4 w-4 mr-2" /> Create Bracket
          </Button>
        )}

        {/* Setup Dialog */}
        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900" data-testid="bracket-setup-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-brand-blue" /> Create Bracket</DialogTitle>
              <DialogDescription className="text-slate-500">Set up the tournament format and teams for {tournamentName}.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Format</Label>
                <Select value={format} onValueChange={v => setFormat(v as BracketFormat)}>
                  <SelectTrigger className="border-slate-200" data-testid="bracket-format-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Single Elimination</SelectItem>
                    <SelectItem value="double_elimination">Double Elimination</SelectItem>
                    <SelectItem value="round_robin">Round Robin / Pool Play</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Teams (one per line)</Label>
                <textarea
                  value={teamsInput}
                  onChange={e => setTeamsInput(e.target.value)}
                  className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder={"Team Alpha\nTeam Beta\nTeam Gamma\nTeam Delta"}
                  data-testid="bracket-teams-input"
                />
                <p className="text-[10px] text-slate-400">{teamsInput.split('\n').filter(t => t.trim()).length} teams</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetup(false)} className="border-slate-200">Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="basketball-gradient text-white hover:opacity-90" data-testid="bracket-create-confirm-btn">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                Generate Bracket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Bracket exists — show it
  if (!bracket.format || !bracket.rounds || !Array.isArray(bracket.rounds)) {
    // Bracket data is incomplete — treat as no bracket
    return (
      <div className="text-center py-12" data-testid="bracket-empty">
        <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-600 font-semibold mb-2">No bracket yet</p>
        <p className="text-slate-400 text-sm mb-6">Create a tournament bracket to visualize the competition.</p>
        {isManager && (
          <Button className="basketball-gradient text-white hover:opacity-90" onClick={() => {
            setTeamsInput(tournamentTeams.join('\n'));
            setShowSetup(true);
          }} data-testid="bracket-create-btn">
            <Plus className="h-4 w-4 mr-2" /> Create Bracket
          </Button>
        )}

        <Dialog open={showSetup} onOpenChange={setShowSetup}>
          <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900" data-testid="bracket-setup-dialog">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-brand-blue" /> Create Bracket</DialogTitle>
              <DialogDescription className="text-slate-500">Set up the tournament format and teams for {tournamentName}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Format</Label>
                <Select value={format} onValueChange={v => setFormat(v as BracketFormat)}>
                  <SelectTrigger className="border-slate-200" data-testid="bracket-format-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_elimination">Single Elimination</SelectItem>
                    <SelectItem value="double_elimination">Double Elimination</SelectItem>
                    <SelectItem value="round_robin">Round Robin / Pool Play</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-600">Teams (one per line)</Label>
                <textarea value={teamsInput} onChange={e => setTeamsInput(e.target.value)}
                  className="w-full h-40 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
                  placeholder={"Team Alpha\nTeam Beta\nTeam Gamma\nTeam Delta"} data-testid="bracket-teams-input" />
                <p className="text-[10px] text-slate-400">{teamsInput.split('\n').filter(t => t.trim()).length} teams</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSetup(false)} className="border-slate-200">Cancel</Button>
              <Button onClick={handleCreate} disabled={saving} className="basketball-gradient text-white hover:opacity-90" data-testid="bracket-create-confirm-btn">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trophy className="h-4 w-4 mr-2" />}
                Generate Bracket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="bracket-editor">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-brand-blue text-brand-blue text-xs">
            {(bracket.format || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </Badge>
          <span className="text-xs text-slate-400">{bracket.teams.length} teams</span>
          <Badge variant="outline" className="border-green-200 text-green-600 text-[10px] gap-1">
            <RefreshCw className="h-2.5 w-2.5" /> Live Sync
          </Badge>
        </div>
      </div>

      <BracketView rounds={bracket.rounds} onSetScore={handleSetScore} isManager={isManager} format={bracket.format} />
    </div>
  );
};
