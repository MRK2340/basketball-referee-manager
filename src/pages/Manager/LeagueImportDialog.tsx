import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2,
  Loader2, ArrowRight, ArrowLeft, X, Calendar as CalendarIcon, Users, DollarSign,
} from 'lucide-react';
import { parseLeagueScheduleFile, type LeagueGameNight, type FlatGameRow } from '@/lib/leagueScheduleParser';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { addTournament as addTournamentRecord, batchImportLeagueSchedule } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type Step = 'upload' | 'league-setup' | 'map-refs' | 'edit-games' | 'importing' | 'done';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameEdit {
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  ref1MappedId: string;
  ref2MappedId: string;
  isTournament: boolean;
}

export const LeagueImportDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { referees, fetchData } = useData();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  // Parsed data
  const [leagueName, setLeagueName] = useState('');
  const [gameNights, setGameNights] = useState<LeagueGameNight[]>([]);
  const [flatGames, setFlatGames] = useState<FlatGameRow[]>([]);
  const [parseFormat, setParseFormat] = useState<'grouped' | 'flat'>('grouped');
  const [refNames, setRefNames] = useState<string[]>([]);

  // League setup
  const [leagueLocation, setLeagueLocation] = useState('');
  const [leagueCourts, setLeagueCourts] = useState('1');
  const [payPerGame, setPayPerGame] = useState('');
  const [leagueDivision, setLeagueDivision] = useState('');

  // Referee mapping: excelName → system referee ID
  const [refMap, setRefMap] = useState<Record<string, string>>({});

  // Per-game edits (flattened from game nights)
  const [gameEdits, setGameEdits] = useState<GameEdit[]>([]);

  // Result
  const [result, setResult] = useState<{ gamesAdded: number; assignmentsAdded: number } | null>(null);

  // Available referees (from DataContext)
  const availableReferees = useMemo(
    () => referees.map(r => ({ id: r.id, name: r.name })).sort((a, b) => a.name.localeCompare(b.name)),
    [referees],
  );

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setErrors([]);
    setLeagueName('');
    setGameNights([]);
    setFlatGames([]);
    setParseFormat('grouped');
    setRefNames([]);
    setLeagueLocation('');
    setLeagueCourts('1');
    setPayPerGame('');
    setLeagueDivision('');
    setRefMap({});
    setGameEdits([]);
    setResult(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback((open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  }, [onOpenChange, reset]);

  // ── Step 1: Upload ─────────────────────────────────────────────────────────

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setErrors([]);
    const result = await parseLeagueScheduleFile(f);
    if (result.errors.length > 0) {
      setErrors(result.errors);
      return;
    }
    setLeagueName(result.leagueName || f.name.replace(/\.[^.]+$/, ''));
    setGameNights(result.gameNights);
    setFlatGames(result.flatGames);
    setParseFormat(result.format);
    setRefNames(result.refereeNames);

    // Auto-match referee names by partial name match
    const autoMap: Record<string, string> = {};
    for (const excelName of result.refereeNames) {
      const lower = excelName.toLowerCase();
      const match = referees.find(r => {
        const parts = r.name.toLowerCase().split(/\s+/);
        return parts.some(p => p === lower) || r.name.toLowerCase() === lower;
      });
      if (match) autoMap[excelName] = match.id;
    }
    setRefMap(autoMap);

    setStep('league-setup');
  }, [referees]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }, [handleFile]);

  // ── Step 2→3: Move from league setup to referee mapping ────────────────────

  const canProceedFromSetup = leagueName && leagueLocation;

  // ── Step 3→4: Move from ref mapping to game editing ────────────────────────

  const buildGameEdits = useCallback(() => {
    const edits: GameEdit[] = [];
    if (parseFormat === 'flat') {
      for (const g of flatGames) {
        edits.push({
          date: g.date,
          time: g.time,
          homeTeam: g.homeTeam || '',
          awayTeam: g.awayTeam || '',
          ref1MappedId: refMap[g.ref1] || '',
          ref2MappedId: refMap[g.ref2] || '',
          isTournament: false,
        });
      }
    } else {
      for (const night of gameNights) {
        for (const time of night.times) {
          edits.push({
            date: night.date,
            time,
            homeTeam: '',
            awayTeam: '',
            ref1MappedId: refMap[night.ref1] || '',
            ref2MappedId: refMap[night.ref2] || '',
            isTournament: night.isTournament,
          });
        }
      }
    }
    setGameEdits(edits);
  }, [gameNights, flatGames, parseFormat, refMap]);

  const handleProceedToEditGames = () => {
    buildGameEdits();
    setStep('edit-games');
  };

  // ── Step 4: Edit individual games ──────────────────────────────────────────

  const updateGameEdit = (index: number, field: keyof GameEdit, value: string) => {
    setGameEdits(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!user) return;
    setStep('importing');

    // Determine date range for the league
    const dates = gameEdits.map(g => g.date).sort();
    const startDate = dates[0] || format(new Date(), 'yyyy-MM-dd');
    const endDate = dates[dates.length - 1] || startDate;

    // Create the league (as a tournament)
    const { error: tournError } = await addTournamentRecord(user, {
      name: leagueName,
      startDate,
      endDate,
      location: leagueLocation,
      numberOfCourts: parseInt(leagueCourts, 10) || 1,
    });

    if (tournError) {
      toast({ title: 'Failed to create league', description: tournError.message, variant: 'destructive' });
      setStep('edit-games');
      return;
    }

    // Find the newly created tournament
    const { getDocs, query: fsQuery, collection: fsCollection, where: fsWhere, orderBy: fsOrderBy, limit: fsLimit } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase');
    const snap = await getDocs(fsQuery(
      fsCollection(db, 'tournaments'),
      fsWhere('manager_id', '==', user.id),
      fsWhere('name', '==', leagueName),
      fsOrderBy('name'),
      fsLimit(1),
    ));

    if (snap.empty) {
      toast({ title: 'Error', description: 'League created but could not be found.', variant: 'destructive' });
      setStep('edit-games');
      return;
    }

    const tournamentId = snap.docs[0].id;
    const pay = parseFloat(payPerGame) || 0;

    const gamesToImport = gameEdits.map(g => ({
      date: g.date,
      time: g.time,
      homeTeam: g.homeTeam || 'TBD',
      awayTeam: g.awayTeam || 'TBD',
      venue: leagueLocation,
      division: leagueDivision,
      payment: pay,
      refereeIds: [g.ref1MappedId, g.ref2MappedId].filter(Boolean),
    }));

    const { data, error } = await batchImportLeagueSchedule(user, tournamentId, gamesToImport, file?.name || 'unknown');

    if (error) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
      setStep('edit-games');
    } else if (data) {
      setResult(data);
      setStep('done');
      fetchData(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const totalGames = parseFormat === 'flat' ? flatGames.length : gameNights.reduce((sum, n) => sum + n.times.length, 0);
  const totalNights = parseFormat === 'flat'
    ? new Set(flatGames.map(g => g.date)).size
    : gameNights.length;
  const mappedRefCount = Object.values(refMap).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[90vh] flex flex-col"
        data-testid="league-import-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            Import League Schedule
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Upload a league schedule (Excel or CSV) to create a season with games and referee assignments.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        {step !== 'importing' && step !== 'done' && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1" data-testid="league-import-steps">
            {(['upload', 'league-setup', 'map-refs', 'edit-games'] as const).map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="mx-0.5">&#8250;</span>}
                <span className={step === s ? 'text-brand-blue font-semibold' : ''}>
                  {['Upload', 'League Setup', 'Map Referees', 'Review Games'][i]}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Upload ──────────────────────────── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  dragOver ? 'border-brand-blue bg-blue-50' : 'border-slate-300 hover:border-brand-blue/50'
                }`}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('league-import-file-input')?.click()}
                data-testid="league-import-dropzone"
              >
                <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-700 font-semibold mb-1">Drop your league schedule here</p>
                <p className="text-slate-500 text-sm">or click to browse</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> Excel (.xlsx)
                  </Badge>
                  <Badge variant="outline" className="border-slate-300 text-slate-500 text-xs gap-1">
                    <FileSpreadsheet className="h-3 w-3" /> CSV
                  </Badge>
                </div>
                <input
                  id="league-import-file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={onFileInput}
                  data-testid="league-import-file-input"
                />
              </div>

              {errors.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="text-sm text-red-700">
                      {errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-sm text-blue-800 font-medium mb-1">Supported formats:</p>
                <p className="text-xs text-blue-600 mb-1">
                  <strong>Grouped format:</strong> Dates in column A, times in column B, referee names in columns C & D. Multiple times per date.
                </p>
                <p className="text-xs text-blue-600">
                  <strong>Flat table:</strong> Standard columns — Date, Time, Ref 1, Ref 2, Home Team, Away Team, Venue, Fee. One row per game.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: League Setup ───────────────────────── */}
          {step === 'league-setup' && (
            <motion.div key="league-setup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline" className="text-xs border-slate-300">
                  {file?.name} — {totalGames} games across {totalNights} {totalNights === 1 ? 'date' : 'dates'}
                  {parseFormat === 'flat' && <span className="ml-1 text-slate-400">(flat table)</span>}
                </Badge>
                <Button variant="ghost" size="sm" onClick={reset} className="text-slate-500 h-8 text-xs">
                  <X className="h-3 w-3 mr-1" /> Change file
                </Button>
              </div>

              <Card className="border-slate-200">
                <CardContent className="p-4 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">League Name *</Label>
                    <Input
                      value={leagueName}
                      onChange={e => setLeagueName(e.target.value)}
                      placeholder="e.g. Adult Basketball Spring 2026"
                      className="border-slate-200"
                      data-testid="league-import-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Location *</Label>
                      <Input
                        value={leagueLocation}
                        onChange={e => setLeagueLocation(e.target.value)}
                        placeholder="e.g. Surf City Gym"
                        className="border-slate-200"
                        data-testid="league-import-location"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Courts</Label>
                      <Input
                        type="number"
                        value={leagueCourts}
                        onChange={e => setLeagueCourts(e.target.value)}
                        placeholder="1"
                        className="border-slate-200"
                        data-testid="league-import-courts"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Division</Label>
                      <Input
                        value={leagueDivision}
                        onChange={e => setLeagueDivision(e.target.value)}
                        placeholder="e.g. Adult Men's"
                        className="border-slate-200"
                        data-testid="league-import-division"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Pay Per Game
                      </Label>
                      <Input
                        type="number"
                        value={payPerGame}
                        onChange={e => setPayPerGame(e.target.value)}
                        placeholder="e.g. 75"
                        className="border-slate-200"
                        data-testid="league-import-pay"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('upload')} className="border-slate-300 text-slate-700">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={() => setStep('map-refs')}
                  disabled={!canProceedFromSetup}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="league-import-to-refs-btn"
                >
                  Map Referees <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 3: Map Referees ──────────────────────── */}
          {step === 'map-refs' && (
            <motion.div key="map-refs" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3">
                <p className="text-sm text-slate-700 font-medium mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-blue" />
                  Map referee names from the schedule to your roster
                </p>
                <p className="text-xs text-slate-500">
                  {mappedRefCount} of {refNames.length} referees mapped. Unmapped referees will be skipped.
                </p>
              </div>

              <ScrollArea className="max-h-[300px]">
                <div className="space-y-3">
                  {refNames.map(name => (
                    <div key={name} className="flex items-center gap-3" data-testid={`league-import-ref-map-${name}`}>
                      <div className="w-28 shrink-0">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs w-full justify-center',
                            refMap[name] ? 'border-green-300 text-green-700 bg-green-50' : 'border-slate-300 text-slate-600',
                          )}
                        >
                          {name}
                        </Badge>
                      </div>
                      <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      <Select
                        value={refMap[name] || 'none'}
                        onValueChange={(v) => setRefMap(prev => ({ ...prev, [name]: v === 'none' ? '' : v }))}
                      >
                        <SelectTrigger className="border-slate-200 flex-1" data-testid={`league-import-ref-select-${name}`}>
                          <SelectValue placeholder="Select referee..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-slate-400">-- Skip --</span>
                          </SelectItem>
                          {availableReferees.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  {refNames.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No referee names found in the schedule file.
                    </p>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('league-setup')} className="border-slate-300 text-slate-700">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleProceedToEditGames}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="league-import-to-games-btn"
                >
                  Review Games <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 4: Edit Games ────────────────────────── */}
          {step === 'edit-games' && (
            <motion.div key="edit-games" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-700 font-medium">
                  {gameEdits.length} games — fill in team names (or leave as TBD)
                </p>
                {payPerGame && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    <DollarSign className="h-3 w-3 mr-0.5" />{payPerGame} / game
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 max-h-[350px] border rounded-lg border-slate-200">
                <div className="p-3 space-y-2">
                  {gameEdits.map((game, i) => {
                    const isFirstOfDate = i === 0 || gameEdits[i - 1].date !== game.date;
                    return (
                      <React.Fragment key={i}>
                        {isFirstOfDate && (
                          <div className="flex items-center gap-2 pt-2 pb-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-brand-blue" />
                            <span className="text-xs font-semibold text-slate-800">
                              {format(new Date(game.date + 'T12:00:00'), 'EEEE, MMM d, yyyy')}
                            </span>
                            {game.isTournament && (
                              <Badge variant="secondary" className="text-[10px]">Tournament</Badge>
                            )}
                          </div>
                        )}
                        <div
                          className="grid grid-cols-[60px_1fr_1fr] gap-2 items-center"
                          data-testid={`league-import-game-row-${i}`}
                        >
                          <span className="text-xs text-slate-500 font-mono">{game.time}</span>
                          <Input
                            value={game.homeTeam}
                            onChange={e => updateGameEdit(i, 'homeTeam', e.target.value)}
                            placeholder="Home team"
                            className="h-8 text-xs border-slate-200"
                            data-testid={`league-import-home-${i}`}
                          />
                          <Input
                            value={game.awayTeam}
                            onChange={e => updateGameEdit(i, 'awayTeam', e.target.value)}
                            placeholder="Away team"
                            className="h-8 text-xs border-slate-200"
                            data-testid={`league-import-away-${i}`}
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('map-refs')} className="border-slate-300 text-slate-700">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={gameEdits.length === 0}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="league-import-confirm-btn"
                >
                  Import {gameEdits.length} Games <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 5: Importing ──────────────────────── */}
          {step === 'importing' && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
              <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" />
              <p className="text-slate-700 font-semibold">Creating league & games...</p>
              <p className="text-slate-500 text-sm mt-1">Importing {gameEdits.length} games with referee assignments</p>
            </motion.div>
          )}

          {/* ── STEP 6: Done ────────────────────────────── */}
          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-2">League Import Complete</p>
              <div className="flex items-center gap-4 mb-1">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-blue">{result.gamesAdded}</p>
                  <p className="text-xs text-slate-500">games created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.assignmentsAdded}</p>
                  <p className="text-xs text-slate-500">referee assignments</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 text-center max-w-sm">
                League "<strong>{leagueName}</strong>" has been created with all games and referee assignments ready to go.
              </p>
              <Button
                onClick={() => handleClose(false)}
                variant="outline"
                className="mt-5 border-slate-200 text-slate-600"
                data-testid="league-import-done-btn"
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
