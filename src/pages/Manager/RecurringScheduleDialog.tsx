import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, addWeeks, startOfWeek, getDay, setDay, isAfter, isBefore, isSameDay } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  CalendarClock, ArrowRight, ArrowLeft, CheckCircle2,
  Loader2, Plus, Trash2, Users, DollarSign, Calendar as CalendarIcon, MapPin,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { addTournament as addTournamentRecord, batchImportLeagueSchedule } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

type Step = 'configure' | 'referees' | 'preview' | 'importing' | 'done';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimeSlot {
  id: string;
  time: string; // HH:MM
}

interface GeneratedGame {
  date: string;
  time: string;
  ref1Id: string;
  ref2Id: string;
  court: number;
}

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

let slotIdCounter = 0;

export const RecurringScheduleDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const { referees, fetchData } = useData();
  const [step, setStep] = useState<Step>('configure');

  // Configure
  const [leagueName, setLeagueName] = useState('');
  const [location, setLocation] = useState('');
  const [division, setDivision] = useState('');
  const [payPerGame, setPayPerGame] = useState('');
  const [courts, setCourts] = useState('1');
  const [dayOfWeek, setDayOfWeek] = useState('3'); // Wednesday default
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { id: `ts-${++slotIdCounter}`, time: '19:00' },
    { id: `ts-${++slotIdCounter}`, time: '20:00' },
    { id: `ts-${++slotIdCounter}`, time: '21:00' },
  ]);

  // Referees
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);

  // Preview
  const [generatedGames, setGeneratedGames] = useState<GeneratedGame[]>([]);

  // Result
  const [result, setResult] = useState<{ gamesAdded: number; assignmentsAdded: number } | null>(null);

  const availableReferees = useMemo(
    () => referees.map(r => ({ id: r.id, name: r.name })).sort((a, b) => a.name.localeCompare(b.name)),
    [referees],
  );

  const reset = useCallback(() => {
    setStep('configure');
    setLeagueName('');
    setLocation('');
    setDivision('');
    setPayPerGame('');
    setCourts('1');
    setDayOfWeek('3');
    setDateRange({});
    setTimeSlots([
      { id: `ts-${++slotIdCounter}`, time: '19:00' },
      { id: `ts-${++slotIdCounter}`, time: '20:00' },
      { id: `ts-${++slotIdCounter}`, time: '21:00' },
    ]);
    setSelectedRefereeIds([]);
    setGeneratedGames([]);
    setResult(null);
  }, []);

  const handleClose = useCallback((v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  }, [onOpenChange, reset]);

  // ── Time Slot Management ───────────────────────────────────────────────────

  const addTimeSlot = () => {
    setTimeSlots(prev => [...prev, { id: `ts-${++slotIdCounter}`, time: '' }]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(s => s.id !== id));
  };

  const updateTimeSlot = (id: string, time: string) => {
    setTimeSlots(prev => prev.map(s => s.id === id ? { ...s, time } : s));
  };

  // ── Referee Selection ──────────────────────────────────────────────────────

  const toggleReferee = (refId: string) => {
    setSelectedRefereeIds(prev =>
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId],
    );
  };

  // ── Generate Games ─────────────────────────────────────────────────────────

  const generateDates = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return [];
    const dayNum = parseInt(dayOfWeek, 10);
    const dates: Date[] = [];
    // Find the first occurrence of dayOfWeek on or after from
    let current = new Date(dateRange.from);
    const currentDow = getDay(current);
    if (currentDow !== dayNum) {
      const diff = (dayNum - currentDow + 7) % 7;
      current = addDays(current, diff === 0 ? 7 : diff);
    }
    // But if from IS the right day, include it
    if (getDay(dateRange.from) === dayNum) {
      current = new Date(dateRange.from);
    }

    while (!isAfter(current, dateRange.to)) {
      dates.push(new Date(current));
      current = addWeeks(current, 1);
    }
    return dates;
  }, [dateRange, dayOfWeek]);

  const numCourts = Math.max(1, parseInt(courts, 10) || 1);
  const validTimeSlots = timeSlots.filter(s => s.time);
  const totalGamesPerNight = validTimeSlots.length * numCourts;
  const totalGames = generateDates.length * totalGamesPerNight;

  const canProceedFromConfig = leagueName && location && dateRange.from && dateRange.to && validTimeSlots.length > 0;

  const buildGames = useCallback(() => {
    const games: GeneratedGame[] = [];
    const refPool = selectedRefereeIds.length > 0 ? [...selectedRefereeIds] : [];
    let refIndex = 0;

    for (const date of generateDates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      for (const slot of validTimeSlots) {
        for (let c = 1; c <= numCourts; c++) {
          let ref1Id = '';
          let ref2Id = '';
          if (refPool.length >= 2) {
            ref1Id = refPool[refIndex % refPool.length];
            ref2Id = refPool[(refIndex + 1) % refPool.length];
            refIndex += 2;
          } else if (refPool.length === 1) {
            ref1Id = refPool[0];
            refIndex++;
          }
          games.push({ date: dateStr, time: slot.time, ref1Id, ref2Id, court: c });
        }
      }
    }
    setGeneratedGames(games);
  }, [generateDates, validTimeSlots, numCourts, selectedRefereeIds]);

  const handleProceedToPreview = () => {
    buildGames();
    setStep('preview');
  };

  // ── Import ─────────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!user || !dateRange.from || !dateRange.to) return;
    setStep('importing');

    const startDate = format(dateRange.from, 'yyyy-MM-dd');
    const endDate = format(dateRange.to, 'yyyy-MM-dd');

    const { error: tournError } = await addTournamentRecord(user, {
      name: leagueName,
      startDate,
      endDate,
      location,
      numberOfCourts: numCourts,
    });

    if (tournError) {
      toast({ title: 'Failed to create league', description: tournError.message, variant: 'destructive' });
      setStep('preview');
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
      setStep('preview');
      return;
    }

    const tournamentId = snap.docs[0].id;
    const pay = parseFloat(payPerGame) || 0;

    const gamesToImport = generatedGames.map(g => ({
      date: g.date,
      time: g.time,
      homeTeam: 'TBD',
      awayTeam: 'TBD',
      venue: numCourts > 1 ? `${location} - Court ${g.court}` : location,
      division,
      payment: pay,
      refereeIds: [g.ref1Id, g.ref2Id].filter(Boolean),
    }));

    const { data, error } = await batchImportLeagueSchedule(user, tournamentId, gamesToImport, `recurring-${leagueName}`);

    if (error) {
      toast({ title: 'Import Failed', description: error.message, variant: 'destructive' });
      setStep('preview');
    } else if (data) {
      setResult(data);
      setStep('done');
      fetchData(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  const getRefName = (id: string) => availableReferees.find(r => r.id === id)?.name || '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl bg-white border-slate-200 text-slate-900 max-h-[90vh] flex flex-col"
        data-testid="recurring-schedule-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-brand-blue" />
            Recurring Schedule Generator
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Auto-generate a full league season — set the day, times, and date range.
          </DialogDescription>
        </DialogHeader>

        {step !== 'importing' && step !== 'done' && (
          <div className="flex items-center gap-1 text-xs text-slate-400 mb-1" data-testid="recurring-schedule-steps">
            {(['configure', 'referees', 'preview'] as const).map((s, i) => (
              <React.Fragment key={s}>
                {i > 0 && <span className="mx-0.5">&#8250;</span>}
                <span className={step === s ? 'text-brand-blue font-semibold' : ''}>
                  {['Configure', 'Assign Referees', 'Preview & Create'][i]}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1: Configure ──────────────────────── */}
          {step === 'configure' && (
            <motion.div key="configure" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ScrollArea className="max-h-[55vh]">
                <div className="space-y-4 pr-2">
                  {/* League info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs text-slate-600">League Name *</Label>
                      <Input
                        value={leagueName}
                        onChange={e => setLeagueName(e.target.value)}
                        placeholder="e.g. Adult Basketball Spring 2026"
                        className="border-slate-200"
                        data-testid="recurring-league-name"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Location *
                      </Label>
                      <Input
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Surf City Gym"
                        className="border-slate-200"
                        data-testid="recurring-location"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Division</Label>
                      <Input
                        value={division}
                        onChange={e => setDivision(e.target.value)}
                        placeholder="e.g. Adult Men's"
                        className="border-slate-200"
                        data-testid="recurring-division"
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
                        placeholder="75"
                        className="border-slate-200"
                        data-testid="recurring-pay"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Courts</Label>
                      <Input
                        type="number"
                        value={courts}
                        onChange={e => setCourts(e.target.value)}
                        placeholder="1"
                        min={1}
                        className="border-slate-200"
                        data-testid="recurring-courts"
                      />
                    </div>
                  </div>

                  {/* Day of week */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Day of Week *</Label>
                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                      <SelectTrigger className="border-slate-200" data-testid="recurring-day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map(d => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date range */}
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Season Date Range *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal border-slate-200',
                            !dateRange.from && 'text-muted-foreground',
                          )}
                          data-testid="recurring-date-range-btn"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange.from ? (
                            dateRange.to
                              ? `${format(dateRange.from, 'LLL dd')} - ${format(dateRange.to, 'LLL dd, y')}`
                              : format(dateRange.from, 'LLL dd, y')
                          ) : 'Pick season dates'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white border-slate-200" align="start">
                        <Calendar
                          mode="range"
                          selected={{ from: dateRange.from, to: dateRange.to }}
                          onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                          numberOfMonths={2}
                          className="text-slate-900"
                        />
                      </PopoverContent>
                    </Popover>
                    {generateDates.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        {generateDates.length} {DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label}s in this range
                      </p>
                    )}
                  </div>

                  {/* Time slots */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-600">Game Times *</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={addTimeSlot}
                        className="h-7 text-xs text-brand-blue hover:bg-blue-50"
                        data-testid="recurring-add-time-btn"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Time
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {timeSlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={slot.time}
                            onChange={e => updateTimeSlot(slot.id, e.target.value)}
                            className="border-slate-200 flex-1"
                            data-testid={`recurring-time-${slot.id}`}
                          />
                          {timeSlots.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTimeSlot(slot.id)}
                              className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  {generateDates.length > 0 && validTimeSlots.length > 0 && (
                    <Card className="border-blue-100 bg-blue-50/50">
                      <CardContent className="p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Season Summary</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-brand-blue">{generateDates.length}</p>
                            <p className="text-[10px] text-slate-500">game nights</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-brand-blue">{totalGames}</p>
                            <p className="text-[10px] text-slate-500">total games</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-brand-blue">{numCourts}</p>
                            <p className="text-[10px] text-slate-500">{numCourts === 1 ? 'court' : 'courts'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setStep('referees')}
                  disabled={!canProceedFromConfig}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="recurring-to-refs-btn"
                >
                  Assign Referees <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 2: Assign Referees ────────────────── */}
          {step === 'referees' && (
            <motion.div key="referees" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-3">
                <p className="text-sm text-slate-700 font-medium mb-1 flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-blue" />
                  Select referees for rotation
                </p>
                <p className="text-xs text-slate-500">
                  Selected referees will be auto-rotated across game nights. {selectedRefereeIds.length} selected.
                  {selectedRefereeIds.length >= 2 && ` Each night will get 2 refs, rotating through the pool.`}
                </p>
              </div>

              <ScrollArea className="max-h-[350px]">
                <div className="space-y-1.5">
                  {availableReferees.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">
                      No referees in your system yet. You can skip this step and assign refs later.
                    </p>
                  ) : (
                    availableReferees.map(ref => (
                      <div
                        key={ref.id}
                        className={cn(
                          'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                          selectedRefereeIds.includes(ref.id)
                            ? 'border-brand-blue bg-blue-50'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                        onClick={() => toggleReferee(ref.id)}
                        data-testid={`recurring-ref-${ref.id}`}
                      >
                        <Checkbox
                          checked={selectedRefereeIds.includes(ref.id)}
                          onCheckedChange={() => toggleReferee(ref.id)}
                        />
                        <span className="text-sm text-slate-800 font-medium">{ref.name}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('configure')} className="border-slate-300 text-slate-700">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleProceedToPreview}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="recurring-to-preview-btn"
                >
                  Preview Schedule <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 3: Preview ────────────────────────── */}
          {step === 'preview' && (
            <motion.div key="preview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-800 font-semibold">{leagueName}</p>
                  <p className="text-xs text-slate-500">
                    {generateDates.length} nights, {generatedGames.length} games
                    {selectedRefereeIds.length > 0 && `, ${selectedRefereeIds.length} refs rotating`}
                  </p>
                </div>
                {payPerGame && (
                  <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                    <DollarSign className="h-3 w-3 mr-0.5" />{payPerGame} / game
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 max-h-[350px] border rounded-lg border-slate-200">
                <div className="p-3 space-y-1">
                  {generatedGames.map((game, i) => {
                    const isFirstOfDate = i === 0 || generatedGames[i - 1].date !== game.date;
                    return (
                      <React.Fragment key={i}>
                        {isFirstOfDate && (
                          <div className="flex items-center gap-2 pt-2 pb-1">
                            <CalendarIcon className="h-3.5 w-3.5 text-brand-blue" />
                            <span className="text-xs font-semibold text-slate-800">
                              {format(new Date(game.date + 'T12:00:00'), 'EEEE, MMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="text-slate-500 font-mono">{game.time}</span>
                          <span className="text-slate-600">
                            {numCourts > 1 && <Badge variant="secondary" className="text-[10px] mr-1">Ct {game.court}</Badge>}
                            TBD vs TBD
                          </span>
                          <span className="text-slate-500 text-right">
                            {game.ref1Id ? getRefName(game.ref1Id) : '—'}
                            {game.ref2Id ? `, ${getRefName(game.ref2Id)}` : ''}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </ScrollArea>

              <DialogFooter className="mt-4 gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setStep('referees')} className="border-slate-300 text-slate-700">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={generatedGames.length === 0}
                  className="basketball-gradient text-white hover:opacity-90 gap-2"
                  data-testid="recurring-create-btn"
                >
                  Create {generatedGames.length} Games <ArrowRight className="h-4 w-4" />
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* ── STEP 4: Importing ──────────────────────── */}
          {step === 'importing' && (
            <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10">
              <Loader2 className="h-10 w-10 text-brand-blue animate-spin mb-4" />
              <p className="text-slate-700 font-semibold">Creating league & games...</p>
              <p className="text-slate-500 text-sm mt-1">
                Generating {generatedGames.length} games with referee rotation
              </p>
            </motion.div>
          )}

          {/* ── STEP 5: Done ────────────────────────────── */}
          {step === 'done' && result && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <p className="text-slate-900 font-bold text-lg mb-2">Season Created</p>
              <div className="flex items-center gap-4 mb-1">
                <div className="text-center">
                  <p className="text-2xl font-bold text-brand-blue">{result.gamesAdded}</p>
                  <p className="text-xs text-slate-500">games created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{result.assignmentsAdded}</p>
                  <p className="text-xs text-slate-500">ref assignments</p>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-3 text-center max-w-sm">
                "<strong>{leagueName}</strong>" is ready! Referees have been auto-rotated across all game nights.
              </p>
              <Button
                onClick={() => handleClose(false)}
                variant="outline"
                className="mt-5 border-slate-200 text-slate-600"
                data-testid="recurring-done-btn"
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
