import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { MappedGame } from '@/lib/mappers';

interface LiveGamePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: MappedGame | null;
}

interface QuarterScore { home: number; away: number; }

const QUARTER_DURATION = 10 * 60; // 10 minutes in seconds

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const LiveGamePanel: React.FC<LiveGamePanelProps> = ({ open, onOpenChange, game }) => {
  const [quarters, setQuarters] = useState<QuarterScore[]>([
    { home: 0, away: 0 }, { home: 0, away: 0 },
    { home: 0, away: 0 }, { home: 0, away: 0 },
  ]);
  const [currentQ, setCurrentQ]   = useState(0);
  const [timeLeft, setTimeLeft]   = useState(QUARTER_DURATION);
  const [running, setRunning]     = useState(false);
  const [homeFouls, setHomeFouls] = useState(0);
  const [awayFouls, setAwayFouls] = useState(0);
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset on new game
  useEffect(() => {
    if (open && game) {
      setQuarters([
        { home: 0, away: 0 }, { home: 0, away: 0 },
        { home: 0, away: 0 }, { home: 0, away: 0 },
      ]);
      setCurrentQ(0);
      setTimeLeft(QUARTER_DURATION);
      setRunning(false);
      setHomeFouls(0);
      setAwayFouls(0);
      setNotes('');
    }
  }, [open, game]);

  // Timer
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            setRunning(false);
            toast({ title: `Quarter ${currentQ + 1} ended` });
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, currentQ]);

  const adjustScore = (teamKey: 'home' | 'away', delta: number) => {
    setQuarters(prev => prev.map((q, i) =>
      i === currentQ ? { ...q, [teamKey]: Math.max(0, q[teamKey] + delta) } : q,
    ));
  };

  const totalScore = (team: 'home' | 'away') =>
    quarters.reduce((s, q) => s + q[team], 0);

  const nextQuarter = () => {
    if (currentQ < 3) {
      setCurrentQ(q => q + 1);
      setTimeLeft(QUARTER_DURATION);
      setRunning(false);
    }
  };

  const handleSave = async () => {
    if (!game) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'live_game_sessions', game.id), {
        game_id: game.id,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        quarter_scores: quarters,
        home_total: totalScore('home'),
        away_total: totalScore('away'),
        home_fouls: homeFouls,
        away_fouls: awayFouls,
        current_quarter: currentQ + 1,
        notes,
        updated_at: serverTimestamp(),
      }, { merge: true });
      toast({ title: 'Game data saved', description: 'Live scoring data has been recorded.' });
    } catch {
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!game) return null;
  const homeTotal = totalScore('home');
  const awayTotal = totalScore('away');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto" data-testid="live-game-panel">
        <SheetHeader className="pb-4 border-b border-slate-200">
          <SheetTitle className="flex items-center gap-2 text-slate-900">
            <Timer className="h-5 w-5 text-orange-500" />
            Live Game
          </SheetTitle>
          <SheetDescription className="text-slate-600">
            {game.homeTeam} vs {game.awayTeam} · {game.division}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Scoreboard */}
          <div className="bg-brand-deep-blue rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-4">
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                Q{currentQ + 1}
              </Badge>
              <div className="flex items-center gap-2 text-xl font-mono font-bold">
                <Timer className="h-4 w-4 text-blue-300" />
                {fmt(timeLeft)}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center text-center">
              <div>
                <p className="text-blue-200 text-xs mb-1 truncate">{game.homeTeam}</p>
                <p className="text-4xl font-black" data-testid="live-home-score">{homeTotal}</p>
              </div>
              <div className="text-slate-400 text-2xl font-light">vs</div>
              <div>
                <p className="text-blue-200 text-xs mb-1 truncate">{game.awayTeam}</p>
                <p className="text-4xl font-black" data-testid="live-away-score">{awayTotal}</p>
              </div>
            </div>
          </div>

          {/* Timer controls */}
          <div className="flex items-center gap-3">
            <Button
              data-testid="live-timer-toggle"
              onClick={() => setRunning(r => !r)}
              className={running ? 'bg-red-500 hover:bg-red-600 text-white flex-1' : 'basketball-gradient hover:opacity-90 text-white flex-1'}
            >
              {running ? <><Pause className="h-4 w-4 mr-2" />Pause</> : <><Play className="h-4 w-4 mr-2" />Start</>}
            </Button>
            <Button
              variant="outline"
              data-testid="live-timer-reset"
              onClick={() => { setTimeLeft(QUARTER_DURATION); setRunning(false); }}
              className="border-slate-300"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            {currentQ < 3 && (
              <Button
                variant="outline"
                data-testid="live-next-quarter"
                onClick={nextQuarter}
                className="border-slate-300 text-slate-700"
              >
                Q{currentQ + 2} &rarr;
              </Button>
            )}
          </div>

          {/* Score controls */}
          <div className="grid grid-cols-2 gap-4">
            {(['home', 'away'] as const).map(team => (
              <div key={team} className="space-y-2">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {team === 'home' ? game.homeTeam : game.awayTeam}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`live-${team}-minus`}
                    onClick={() => adjustScore(team, -1)}
                    className="w-8 h-8 p-0 border-slate-300"
                  >-</Button>
                  <span className="text-lg font-bold text-slate-900 w-8 text-center" data-testid={`live-q${currentQ + 1}-${team}-score`}>
                    {quarters[currentQ][team]}
                  </span>
                  <Button
                    size="sm"
                    data-testid={`live-${team}-plus`}
                    onClick={() => adjustScore(team, 1)}
                    className="w-8 h-8 p-0 basketball-gradient hover:opacity-90 text-white"
                  >+</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Fouls */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h4 className="text-sm font-semibold text-slate-700">Team Fouls</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: game.homeTeam, count: homeFouls, set: setHomeFouls, testId: 'home-foul' },
                { label: game.awayTeam, count: awayFouls, set: setAwayFouls, testId: 'away-foul' },
              ].map(t => (
                <div key={t.testId} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs text-slate-600 truncate mr-2">{t.label}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`${t.testId}-minus`}
                      onClick={() => t.set(v => Math.max(0, v - 1))}
                      className="w-6 h-6 p-0 text-xs border-slate-300"
                    >-</Button>
                    <span className={`font-bold text-sm w-4 text-center ${t.count >= 5 ? 'text-red-600' : 'text-slate-900'}`} data-testid={`${t.testId}-count`}>
                      {t.count}
                    </span>
                    <Button
                      size="sm"
                      data-testid={`${t.testId}-plus`}
                      onClick={() => t.set(v => v + 1)}
                      className="w-6 h-6 p-0 basketball-gradient hover:opacity-90 text-white text-xs"
                    >+</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quarter breakdown */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700">Quarter Breakdown</h4>
            <div className="grid grid-cols-5 gap-1 text-center text-xs">
              <div className="text-slate-400">Q</div>
              {[1, 2, 3, 4].map(q => (
                <div key={q} className={`font-semibold ${q - 1 === currentQ ? 'text-brand-blue' : 'text-slate-600'}`}>
                  Q{q}
                </div>
              ))}
              <div className="text-slate-700 font-medium truncate">{game.homeTeam.split(' ')[0]}</div>
              {quarters.map((q, i) => (
                <div key={i} className="text-slate-900 font-bold">{q.home}</div>
              ))}
              <div className="text-slate-700 font-medium truncate">{game.awayTeam.split(' ')[0]}</div>
              {quarters.map((q, i) => (
                <div key={i} className="text-slate-900 font-bold">{q.away}</div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-700">Game Notes</Label>
            <Textarea
              data-testid="live-game-notes"
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 1000))}
              placeholder="Incident notes, ejections, technical fouls..."
              className="border-slate-300 resize-none text-sm"
              rows={3}
            />
          </div>

          {/* Save */}
          <Button
            data-testid="live-game-save"
            onClick={handleSave}
            disabled={saving}
            className="w-full basketball-gradient hover:opacity-90 text-white"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : <><CheckCircle className="h-4 w-4 mr-2" />Save Game Data</>}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
