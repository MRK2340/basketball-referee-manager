import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft, ChevronRight, CalendarCheck, CheckCircle,
  XCircle, Clock, Trophy, Users, Zap, Star
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { useData } from '@/contexts/DataContext';

// ── Cell status helpers ──────────────────────────────────────────────────────
const isAvailableOnDay = (availabilitySlots, day) => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(day);
  dayEnd.setHours(23, 59, 59, 999);

  return availabilitySlots.some((slot) => {
    try {
      const start = parseISO(slot.start_time || slot.startTime);
      const end = parseISO(slot.end_time || slot.endTime);
      return start <= dayEnd && end >= dayStart;
    } catch {
      return false;
    }
  });
};

const getGamesOnDay = (games, day) =>
  games.filter((g) => {
    try {
      return isSameDay(parseISO(g.date), day) && g.status !== 'completed';
    } catch {
      return false;
    }
  });

const getRefereeGamesOnDay = (games, refereeId, day) =>
  getGamesOnDay(games, day).filter((g) =>
    (g.assignments || []).some((a) => a.referee?.id === refereeId || a.refereeId === refereeId)
  );

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  available:     { bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300',  icon: CheckCircle, iconColor: 'text-emerald-600', label: 'Available',       dot: 'bg-emerald-500' },
  busy:          { bg: 'bg-amber-50 hover:bg-amber-100 border-amber-300',         icon: Trophy,      iconColor: 'text-amber-600',   label: 'Has Game',        dot: 'bg-amber-500' },
  unavailable:   { bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200',         icon: XCircle,     iconColor: 'text-slate-400',   label: 'Unavailable',     dot: 'bg-slate-400' },
  today_avail:   { bg: 'bg-blue-50 hover:bg-blue-100 border-blue-300',            icon: CheckCircle, iconColor: 'text-brand-blue',    label: 'Available Today', dot: 'bg-blue-500' },
};

// ── Quick-assign popover ─────────────────────────────────────────────────────
const QuickAssignPopover = ({ referee, day, openGames, onAssign }) => {
  const [open, setOpen] = useState(false);
  const games = openGames.filter((g) => {
    const assigned = (g.assignments || []).some(
      (a) => (a.referee?.id === referee.id || a.refereeId === referee.id) && a.status !== 'declined'
    );
    return !assigned;
  });

  if (games.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="absolute bottom-1 right-1 p-0.5 rounded-full bg-white border border-emerald-400 shadow hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
          title={`Assign ${referee.name} to a game on ${format(day, 'MMM d')}`}
          data-testid={`avail-assign-trigger-${referee.id}-${format(day, 'yyyy-MM-dd')}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Zap className="h-3 w-3 text-emerald-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 bg-white border-slate-200 shadow-xl p-3" side="bottom" align="start">
        <p className="font-bold text-slate-900 text-sm mb-2">
          Assign {referee.name} — {format(day, 'MMM d')}
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => { onAssign(game.id, referee.id); setOpen(false); }}
              className="w-full text-left p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-brand-orange hover:bg-orange-50 transition-all"
              data-testid={`avail-assign-game-${game.id}-${referee.id}`}
            >
              <p className="font-semibold text-slate-900 text-xs">{game.homeTeam} vs {game.awayTeam}</p>
              <p className="text-slate-500 text-xs mt-0.5">{game.time} · {game.venue}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const AvailabilityCalendarTab = ({ referees, games }) => {
  const { assignRefereeToGame } = useData();
  const [weekOffset, setWeekOffset] = useState(0);
  const [certFilter, setCertFilter] = useState('all');

  const weekStart = useMemo(() => {
    const base = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);
    return base;
  }, [weekOffset]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const today = useMemo(() => new Date(), []);

  // All unique certifications across referees
  const allCerts = useMemo(() => {
    const certSet = new Set();
    referees.forEach((r) => (r.certifications || []).forEach((c) => certSet.add(c)));
    return ['all', ...Array.from(certSet)];
  }, [referees]);

  // Filtered referees
  const filteredReferees = useMemo(() => {
    const refs = referees.filter((r) => r.role === 'referee');
    if (certFilter === 'all') return refs;
    return refs.filter((r) => (r.certifications || []).includes(certFilter));
  }, [referees, certFilter]);

  // Cell status for a referee on a day
  const getCellStatus = useCallback(
    (referee, day) => {
      const avail = isAvailableOnDay(referee.referee_availability || [], day);
      const hasGame = getRefereeGamesOnDay(games, referee.id, day).length > 0;
      const isToday = isSameDay(day, today);

      if (avail && hasGame) return 'busy';
      if (avail && isToday) return 'today_avail';
      if (avail) return 'available';
      return 'unavailable';
    },
    [games, today]
  );

  // Open (unassigned) games on a specific day
  const openGamesOnDay = useCallback(
    (day) =>
      getGamesOnDay(games, day).filter(
        (g) =>
          (g.assignments || []).length === 0 ||
          (g.assignments || []).every((a) => a.status === 'declined')
      ),
    [games]
  );

  // Summary stats
  const totalAvailable = useMemo(() => {
    let count = 0;
    filteredReferees.forEach((ref) => {
      weekDays.forEach((day) => {
        if (getCellStatus(ref, day) !== 'unavailable') count++;
      });
    });
    return count;
  }, [filteredReferees, weekDays, getCellStatus]);

  const totalOpenGames = useMemo(
    () => weekDays.reduce((sum, day) => sum + openGamesOnDay(day).length, 0),
    [weekDays, openGamesOnDay]
  );

  return (
    <div className="space-y-6 mt-4" data-testid="manager-availability-tab">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Referee Availability Calendar</h3>
          <p className="text-sm text-slate-600">
            See who&apos;s free for the week — click a cell to quickly assign to an open game.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={certFilter} onValueChange={setCertFilter}>
            <SelectTrigger className="w-48 bg-white border-slate-300 text-slate-900 text-sm" data-testid="avail-cert-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {allCerts.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Certifications' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w - 1)} className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg" data-testid="avail-prev-week">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)} className="h-7 px-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg" data-testid="avail-today-btn">
              Today
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w + 1)} className="h-7 w-7 p-0 hover:bg-slate-100 rounded-lg" data-testid="avail-next-week">
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week label */}
      <div className="flex items-center gap-3">
        <p className="font-bold text-slate-900 text-base">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </p>
        <Badge variant="outline" className="border-slate-300 text-slate-600 text-xs">
          <CalendarCheck className="h-3 w-3 mr-1" />
          {totalAvailable} availability slots this week
        </Badge>
        {totalOpenGames > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            {totalOpenGames} open game{totalOpenGames !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Referees', value: filteredReferees.length, icon: Users, color: 'text-brand-blue', bg: 'bg-blue-100' },
          { label: 'Available Slots', value: totalAvailable, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Open Games', value: totalOpenGames, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Top Rated', value: filteredReferees.reduce((best, r) => !best || (r.rating || 0) > (best.rating || 0) ? r : best, null)?.name?.split(' ')[0] || '—', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-100' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="glass-effect border-slate-200 shadow-sm">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0`}><Icon className={`h-4 w-4 ${s.color}`} /></div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide truncate">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900 truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {Object.entries(STATUS).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`inline-block w-3 h-3 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Zap className="h-3 w-3 text-emerald-600" />
          Hover green cell → quick assign
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="glass-effect border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 720 }}>
            {/* Header row */}
            <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}>
              <div className="p-3 border-r border-slate-200 bg-slate-50">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Referee</p>
              </div>
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today);
                const openCount = openGamesOnDay(day).length;
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r border-slate-200 ${isToday ? 'bg-blue-50' : 'bg-slate-50'}`}
                    data-testid={`avail-day-header-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-brand-blue' : 'text-slate-500'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-lg font-black mt-0.5 ${isToday ? 'text-brand-blue' : 'text-slate-900'}`}>
                      {format(day, 'd')}
                    </p>
                    {openCount > 0 && (
                      <Badge className="basketball-gradient text-white text-[10px] border-0 px-1.5 py-0 mt-1">
                        {openCount} open
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Referee rows */}
            {filteredReferees.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No referees match this filter</p>
              </div>
            ) : (
              filteredReferees.map((referee, rowIndex) => (
                <motion.div
                  key={referee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIndex * 0.06 }}
                  className="grid border-b border-slate-100 last:border-0"
                  style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}
                  data-testid={`avail-row-${referee.id}`}
                >
                  {/* Referee name cell */}
                  <div className="p-3 border-r border-slate-200 bg-white flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                        {referee.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{referee.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs text-slate-500">{referee.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day) => {
                    const status = getCellStatus(referee, day);
                    const cfg = STATUS[status];
                    const Icon = cfg.icon;
                    const refGames = getRefereeGamesOnDay(games, referee.id, day);
                    const dayOpenGames = openGamesOnDay(day);
                    const canAssign = status === 'available' || status === 'today_avail';
                    const isToday = isSameDay(day, today);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative group border-r border-slate-100 last:border-0 p-2 flex flex-col items-center justify-center gap-1 min-h-[70px] cursor-default transition-all ${cfg.bg} border ${isToday && status === 'unavailable' ? 'bg-slate-100 border-slate-200' : ''}`}
                        data-testid={`avail-cell-${referee.id}-${format(day, 'yyyy-MM-dd')}`}
                      >
                        <Icon className={`h-5 w-5 ${cfg.iconColor} flex-shrink-0`} />
                        <span className={`text-[10px] font-semibold ${cfg.iconColor} leading-none`}>
                          {cfg.label}
                        </span>

                        {/* Game count badge */}
                        {refGames.length > 0 && (
                          <Badge className="basketball-gradient text-white text-[9px] border-0 px-1 py-0">
                            {refGames.length} game{refGames.length > 1 ? 's' : ''}
                          </Badge>
                        )}

                        {/* Quick-assign button (only when available + open games exist) */}
                        {canAssign && dayOpenGames.length > 0 && (
                          <QuickAssignPopover
                            referee={referee}
                            day={day}
                            openGames={dayOpenGames}
                            onAssign={assignRefereeToGame}
                          />
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Info tip */}
      <p className="text-xs text-slate-400 text-center">
        Availability data is set by referees in their Calendar page. Hover a green cell on a day with open games to quick-assign.
      </p>
    </div>
  );
};

export default AvailabilityCalendarTab;
