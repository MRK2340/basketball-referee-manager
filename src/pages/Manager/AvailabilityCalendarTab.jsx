import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ChevronLeft, ChevronRight, CalendarCheck, CheckCircle,
  XCircle, Clock, Trophy, Users, Zap, Star, AlertTriangle, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';

// ── Cell status helpers ──────────────────────────────────────────────────────
const isAvailableOnDay = (availabilitySlots, day) => {
  const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
  const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59, 999);
  return availabilitySlots.some((slot) => {
    try {
      const start = parseISO(slot.start_time || slot.startTime);
      const end   = parseISO(slot.end_time   || slot.endTime);
      return start <= dayEnd && end >= dayStart;
    } catch { return false; }
  });
};

const getGamesOnDay = (games, day) =>
  games.filter((g) => {
    try { return isSameDay(parseISO(g.date), day) && g.status !== 'completed'; }
    catch { return false; }
  });

const getRefereeGamesOnDay = (games, refereeId, day) =>
  getGamesOnDay(games, day).filter((g) =>
    (g.assignments || []).some((a) => a.referee?.id === refereeId || a.refereeId === refereeId)
  );

// ── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  available:   { bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300',  icon: CheckCircle,    iconColor: 'text-emerald-600',  label: 'Available',       dot: 'bg-emerald-500' },
  conflict:    { bg: 'bg-red-50    hover:bg-red-100    border-red-400',         icon: AlertTriangle,  iconColor: 'text-red-600',      label: 'Conflict',        dot: 'bg-red-500' },
  unavailable: { bg: 'bg-slate-50  hover:bg-slate-100  border-slate-200',       icon: XCircle,        iconColor: 'text-slate-400',    label: 'Unavailable',     dot: 'bg-slate-400' },
  today_avail: { bg: 'bg-blue-50   hover:bg-blue-100   border-blue-300',        icon: CheckCircle,    iconColor: 'text-brand-blue',   label: 'Available Today', dot: 'bg-blue-500' },
};

// ── Conflict summary panel ────────────────────────────────────────────────────
const ConflictSummaryPanel = ({ conflicts, isDark }) => {
  const [open, setOpen] = useState(true);
  if (conflicts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${
        isDark
          ? 'border-red-500/30 bg-red-900/20'
          : 'border-red-200 bg-red-50'
      }`}
      data-testid="conflict-summary-panel"
    >
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <AlertTriangle className={`h-5 w-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500" />
            </span>
          </div>
          <span className={`font-bold text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            {conflicts.length} Scheduling Conflict{conflicts.length !== 1 ? 's' : ''} Detected This Week
          </span>
          <span className={`text-xs ${isDark ? 'text-red-400/70' : 'text-red-500'}`}>
            — referee is available but already assigned to a game
          </span>
        </div>
        {open
          ? <ChevronUp   className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
          : <ChevronDown className={`h-4 w-4 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {conflicts.map((c, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 rounded-xl p-3 border ${
                    isDark
                      ? 'border-red-500/20 bg-red-900/30'
                      : 'border-red-200 bg-white'
                  }`}
                  data-testid={`conflict-item-${c.refereeId}-${format(c.day, 'yyyy-MM-dd')}`}
                >
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                      {c.refereeName} — {format(c.day, 'EEEE, MMM d')}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {c.games.map(g => (
                        <span
                          key={g.id}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium ${
                            isDark ? 'bg-red-900/50 text-red-300 border border-red-500/30' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          <Trophy className="h-3 w-3" />
                          {g.homeTeam} vs {g.awayTeam} · {g.time}
                        </span>
                      ))}
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-red-400/70' : 'text-red-500'}`}>
                      Consider removing availability or reassigning this game
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── Quick-assign popover ─────────────────────────────────────────────────────
const QuickAssignPopover = ({ referee, day, openGames, existingGames, onAssign }) => {
  const [open, setOpen] = useState(false);
  const hasConflict = existingGames.length > 0;

  const games = openGames.filter((g) => {
    const assigned = (g.assignments || []).some(
      (a) => (a.referee?.id === referee.id || a.refereeId === referee.id) && a.status !== 'declined'
    );
    return !assigned;
  });

  if (games.length === 0 && !hasConflict) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`absolute bottom-1 right-1 p-0.5 rounded-full bg-white shadow transition-all opacity-0 group-hover:opacity-100 ${
            hasConflict
              ? 'border border-red-400 hover:bg-red-50'
              : 'border border-emerald-400 hover:bg-emerald-50'
          }`}
          title={hasConflict
            ? `${referee.name} already has a game — view conflict details`
            : `Assign ${referee.name} to a game on ${format(day, 'MMM d')}`}
          data-testid={`avail-assign-trigger-${referee.id}-${format(day, 'yyyy-MM-dd')}`}
          onClick={(e) => e.stopPropagation()}
        >
          {hasConflict
            ? <AlertTriangle className="h-3 w-3 text-red-600" />
            : <Zap className="h-3 w-3 text-emerald-600" />}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-76 bg-white border-slate-200 shadow-xl p-3" side="bottom" align="start">
        <p className="font-bold text-slate-900 text-sm mb-2">
          {referee.name} — {format(day, 'MMM d')}
        </p>

        {/* Conflict warning inside popover */}
        {hasConflict && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5" data-testid={`popover-conflict-warning-${referee.id}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700">Scheduling Conflict</p>
                <p className="text-xs text-red-600 mt-0.5">Already assigned to:</p>
                {existingGames.map(g => (
                  <p key={g.id} className="text-xs font-semibold text-red-700 mt-1">
                    · {g.homeTeam} vs {g.awayTeam} at {g.time}
                  </p>
                ))}
                <p className="text-xs text-red-500 mt-1 italic">Assigning to an additional game may cause a double-booking.</p>
              </div>
            </div>
          </div>
        )}

        {games.length > 0 ? (
          <>
            <p className={`text-xs font-semibold mb-2 ${hasConflict ? 'text-amber-700' : 'text-slate-500'}`}>
              {hasConflict ? 'Open games (conflict risk):' : 'Open games to assign:'}
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => { onAssign(game.id, referee.id); setOpen(false); }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    hasConflict
                      ? 'bg-amber-50 border-amber-200 hover:border-red-300 hover:bg-red-50'
                      : 'bg-slate-50 border-slate-200 hover:border-brand-orange hover:bg-orange-50'
                  }`}
                  data-testid={`avail-assign-game-${game.id}-${referee.id}`}
                >
                  <p className="font-semibold text-slate-900 text-xs">{game.homeTeam} vs {game.awayTeam}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{game.time} · {game.venue}</p>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 text-center py-2">No open games to assign</p>
        )}
      </PopoverContent>
    </Popover>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
const AvailabilityCalendarTab = ({ referees, games }) => {
  const { assignRefereeToGame } = useData();
  const { isDark } = useTheme();
  const [weekOffset, setWeekOffset] = useState(0);
  const [certFilter, setCertFilter] = useState('all');

  const weekStart = useMemo(() => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7), [weekOffset]);
  const weekDays  = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today     = useMemo(() => new Date(), []);

  const allCerts = useMemo(() => {
    const certSet = new Set();
    referees.forEach((r) => (r.certifications || []).forEach((c) => certSet.add(c)));
    return ['all', ...Array.from(certSet)];
  }, [referees]);

  const filteredReferees = useMemo(() => {
    const refs = referees.filter((r) => r.role === 'referee');
    if (certFilter === 'all') return refs;
    return refs.filter((r) => (r.certifications || []).includes(certFilter));
  }, [referees, certFilter]);

  const getCellStatus = useCallback(
    (referee, day) => {
      const avail   = isAvailableOnDay(referee.referee_availability || [], day);
      const hasGame = getRefereeGamesOnDay(games, referee.id, day).length > 0;
      const isToday = isSameDay(day, today);
      if (avail && hasGame)  return 'conflict';
      if (avail && isToday)  return 'today_avail';
      if (avail)             return 'available';
      return 'unavailable';
    },
    [games, today]
  );

  const openGamesOnDay = useCallback(
    (day) => getGamesOnDay(games, day).filter(
      (g) => (g.assignments || []).length === 0 || (g.assignments || []).every((a) => a.status === 'declined')
    ),
    [games]
  );

  // All conflicts this week
  const weekConflicts = useMemo(() => {
    const conflicts = [];
    filteredReferees.forEach((ref) => {
      weekDays.forEach((day) => {
        if (getCellStatus(ref, day) === 'conflict') {
          conflicts.push({
            refereeId: ref.id,
            refereeName: ref.name,
            day,
            games: getRefereeGamesOnDay(games, ref.id, day),
          });
        }
      });
    });
    return conflicts;
  }, [filteredReferees, weekDays, getCellStatus, games]);

  // Per-day conflict counts (for column headers)
  const dayConflictCounts = useMemo(() => {
    const counts = {};
    weekDays.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd');
      counts[key] = filteredReferees.filter((ref) => getCellStatus(ref, day) === 'conflict').length;
    });
    return counts;
  }, [filteredReferees, weekDays, getCellStatus]);

  const totalAvailable = useMemo(() => {
    let count = 0;
    filteredReferees.forEach((ref) => {
      weekDays.forEach((day) => { if (getCellStatus(ref, day) !== 'unavailable') count++; });
    });
    return count;
  }, [filteredReferees, weekDays, getCellStatus]);

  const totalOpenGames = useMemo(
    () => weekDays.reduce((sum, day) => sum + openGamesOnDay(day).length, 0),
    [weekDays, openGamesOnDay]
  );

  const headerBg  = isDark ? 'bg-[#001e3c] border-white/10' : 'bg-slate-50 border-slate-200';
  const rowBorder = isDark ? 'border-white/5'               : 'border-slate-100';
  const nameCellBg= isDark ? 'bg-[#002849] border-white/10' : 'bg-white border-slate-200';
  const textHead  = isDark ? 'text-blue-300/70'             : 'text-slate-500';
  const textMain  = isDark ? 'text-blue-100'                : 'text-slate-900';
  const cardBg    = isDark ? 'bg-[#002849] border-white/10' : 'bg-white border-slate-200';

  return (
    <div className="space-y-6 mt-4" data-testid="manager-availability-tab">
      {/* Conflict summary panel */}
      <ConflictSummaryPanel conflicts={weekConflicts} isDark={isDark} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className={`font-bold text-lg ${textMain}`}>Referee Availability Calendar</h3>
          <p className={`text-sm ${isDark ? 'text-blue-200/60' : 'text-slate-600'}`}>
            See who&apos;s free for the week. Red cells = scheduling conflict. Hover a cell to assign or view details.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={certFilter} onValueChange={setCertFilter}>
            <SelectTrigger className={`w-48 text-sm ${isDark ? 'bg-white/5 border-white/10 text-blue-100' : 'bg-white border-slate-300 text-slate-900'}`} data-testid="avail-cert-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={isDark ? 'bg-[#002849] border-white/10' : 'bg-white border-slate-200'}>
              {allCerts.map((c) => (
                <SelectItem key={c} value={c}>{c === 'all' ? 'All Certifications' : c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className={`flex items-center gap-1 border rounded-xl p-1 shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w - 1)} className={`h-7 w-7 p-0 rounded-lg ${isDark ? 'text-blue-200 hover:bg-white/10' : 'hover:bg-slate-100'}`} data-testid="avail-prev-week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset(0)} className={`h-7 px-2 text-xs rounded-lg ${isDark ? 'text-blue-200 hover:bg-white/10' : 'text-slate-600 hover:bg-slate-100'}`} data-testid="avail-today-btn">
              Today
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setWeekOffset((w) => w + 1)} className={`h-7 w-7 p-0 rounded-lg ${isDark ? 'text-blue-200 hover:bg-white/10' : 'hover:bg-slate-100'}`} data-testid="avail-next-week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Week label */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className={`font-bold text-base ${textMain}`}>
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </p>
        <Badge variant="outline" className={`text-xs ${isDark ? 'border-white/10 text-blue-300' : 'border-slate-300 text-slate-600'}`}>
          <CalendarCheck className="h-3 w-3 mr-1" />
          {totalAvailable} availability slots
        </Badge>
        {totalOpenGames > 0 && (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 border text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            {totalOpenGames} open game{totalOpenGames !== 1 ? 's' : ''}
          </Badge>
        )}
        {weekConflicts.length > 0 && (
          <Badge className="bg-red-100 text-red-700 border-red-200 border text-xs" data-testid="conflict-count-badge">
            <AlertTriangle className="h-3 w-3 mr-1" />
            {weekConflicts.length} conflict{weekConflicts.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Referees',       value: filteredReferees.length,  icon: Users,          color: 'text-brand-blue',   bg: 'bg-blue-100' },
          { label: 'Available',      value: totalAvailable,           icon: CheckCircle,    color: 'text-emerald-600',  bg: 'bg-emerald-100' },
          { label: 'Open Games',     value: totalOpenGames,           icon: Trophy,         color: 'text-amber-600',    bg: 'bg-amber-100' },
          { label: 'Conflicts',      value: weekConflicts.length,     icon: AlertTriangle,  color: weekConflicts.length > 0 ? 'text-red-600' : 'text-slate-400', bg: weekConflicts.length > 0 ? 'bg-red-100' : 'bg-slate-100', testId: 'stat-conflicts' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border shadow-sm ${isDark ? 'bg-[#002849] border-white/10' : 'bg-white border-slate-200'}`} data-testid={s.testId}>
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0 relative`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                  {s.label === 'Conflicts' && weekConflicts.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium uppercase tracking-wide truncate ${isDark ? 'text-blue-300/50' : 'text-slate-500'}`}>{s.label}</p>
                  <p className={`text-xl font-bold truncate ${s.label === 'Conflicts' && weekConflicts.length > 0 ? 'text-red-600' : textMain}`}>{s.value}</p>
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
            <div key={key} className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-blue-200/60' : 'text-slate-600'}`}>
              <span className={`inline-block w-3 h-3 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </div>
          );
        })}
        <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-blue-300/40' : 'text-slate-500'}`}>
          <Zap className="h-3 w-3 text-emerald-600" />
          Hover green cell → quick assign
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
        <div className="overflow-x-auto">
          <div style={{ minWidth: 720 }}>
            {/* Header row */}
            <div className={`grid border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`} style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}>
              <div className={`p-3 border-r ${headerBg}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${textHead}`}>Referee</p>
              </div>
              {weekDays.map((day) => {
                const isToday    = isSameDay(day, today);
                const openCount  = openGamesOnDay(day).length;
                const confCount  = dayConflictCounts[format(day, 'yyyy-MM-dd')] || 0;
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-r ${headerBg} ${isToday ? (isDark ? '!bg-blue-900/30' : '!bg-blue-50') : ''}`}
                    data-testid={`avail-day-header-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-brand-blue' : textHead}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`text-lg font-black mt-0.5 ${isToday ? 'text-brand-blue' : textMain}`}>
                      {format(day, 'd')}
                    </p>
                    <div className="flex flex-col items-center gap-1 mt-1">
                      {openCount > 0 && (
                        <Badge className="basketball-gradient text-white text-[10px] border-0 px-1.5 py-0">
                          {openCount} open
                        </Badge>
                      )}
                      {confCount > 0 && (
                        <Badge
                          className="bg-red-100 text-red-700 border border-red-200 text-[10px] px-1.5 py-0"
                          data-testid={`day-conflict-badge-${format(day, 'yyyy-MM-dd')}`}
                        >
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                          {confCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Referee rows */}
            {filteredReferees.length === 0 ? (
              <div className={`p-12 text-center ${isDark ? 'bg-[#002849]' : 'bg-white'}`}>
                <Users className={`h-10 w-10 mx-auto mb-2 ${isDark ? 'text-blue-300/30' : 'text-slate-300'}`} />
                <p className={`font-medium ${isDark ? 'text-blue-200' : 'text-slate-600'}`}>No referees match this filter</p>
              </div>
            ) : (
              filteredReferees.map((referee, rowIndex) => (
                <motion.div
                  key={referee.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: rowIndex * 0.06 }}
                  className={`grid border-b last:border-0 ${rowBorder}`}
                  style={{ gridTemplateColumns: '200px repeat(7, 1fr)' }}
                  data-testid={`avail-row-${referee.id}`}
                >
                  {/* Referee name cell */}
                  <div className={`p-3 border-r flex items-center gap-2.5 ${nameCellBg}`}>
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={`text-xs ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-slate-200 text-slate-700'}`}>
                        {referee.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={`font-semibold text-sm truncate ${textMain}`}>{referee.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className={`text-xs ${isDark ? 'text-blue-300/60' : 'text-slate-500'}`}>{referee.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day) => {
                    const status      = getCellStatus(referee, day);
                    const cfg         = STATUS[status];
                    const Icon        = cfg.icon;
                    const refGames    = getRefereeGamesOnDay(games, referee.id, day);
                    const dayOpenGames = openGamesOnDay(day);
                    const canAssign   = status === 'available' || status === 'today_avail';
                    const isConflict  = status === 'conflict';
                    const isToday     = isSameDay(day, today);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`relative group border-r last:border-0 p-2 flex flex-col items-center justify-center gap-1 min-h-[70px] cursor-default transition-all border ${cfg.bg} ${
                          isToday && status === 'unavailable' ? (isDark ? 'bg-blue-900/10 border-blue-500/20' : 'bg-slate-100 border-slate-200') : ''
                        } ${isConflict ? 'ring-1 ring-inset ring-red-400' : ''}`}
                        data-testid={`avail-cell-${referee.id}-${format(day, 'yyyy-MM-dd')}`}
                      >
                        {/* Pulsing warning ring on conflict */}
                        {isConflict && (
                          <span className="absolute inset-0 rounded-sm">
                            <span className="absolute inset-0 animate-pulse bg-red-200/30 rounded-sm" />
                          </span>
                        )}

                        <Icon className={`h-5 w-5 ${cfg.iconColor} flex-shrink-0 relative z-10`} />
                        <span className={`text-[10px] font-semibold ${cfg.iconColor} leading-none relative z-10`}>
                          {cfg.label}
                        </span>

                        {/* Game tags in conflict cell */}
                        {refGames.length > 0 && (
                          <div className="relative z-10 flex flex-col gap-0.5 w-full px-1">
                            {refGames.slice(0, 2).map(g => (
                              <div
                                key={g.id}
                                className="text-[9px] font-semibold text-red-700 bg-red-100 border border-red-200 rounded px-1 py-0.5 truncate text-center"
                                title={`${g.homeTeam} vs ${g.awayTeam} · ${g.time}`}
                              >
                                {g.homeTeam} vs {g.awayTeam}
                              </div>
                            ))}
                            {refGames.length > 2 && (
                              <div className="text-[9px] text-red-500 text-center">+{refGames.length - 2} more</div>
                            )}
                          </div>
                        )}

                        {/* Quick-assign / conflict details button */}
                        {(canAssign && dayOpenGames.length > 0) || isConflict ? (
                          <QuickAssignPopover
                            referee={referee}
                            day={day}
                            openGames={isConflict ? dayOpenGames : dayOpenGames}
                            existingGames={refGames}
                            onAssign={assignRefereeToGame}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Info tip */}
      <p className={`text-xs text-center ${isDark ? 'text-blue-300/40' : 'text-slate-400'}`}>
        <Info className="h-3 w-3 inline mr-1" />
        Availability is set by referees in their Calendar page. Red cells indicate a referee is available but already assigned to a game on that day.
      </p>
    </div>
  );
};

export default AvailabilityCalendarTab;
