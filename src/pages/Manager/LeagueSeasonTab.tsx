import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths,
  startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth,
  parseISO, isWithinInterval, getDay,
} from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ChevronLeft, ChevronRight, CalendarDays, CalendarRange,
  Clock, Users, MapPin, DollarSign, Trophy,
} from 'lucide-react';
import type { MappedGame, MappedTournament } from '@/lib/mappers';
import type { RefereeWithAvailability } from '@/lib/types';

interface Props {
  tournaments: MappedTournament[];
  games: MappedGame[];
  referees: RefereeWithAvailability[];
}

const LeagueSeasonTab = ({ tournaments, games, referees }: Props) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);
  const tournamentGames = useMemo(
    () => games.filter(g => g.tournamentId === selectedTournamentId)
      .sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        return dc !== 0 ? dc : (a.time || '').localeCompare(b.time || '');
      }),
    [games, selectedTournamentId],
  );

  // ── Calendar helpers ───────────────────────────────────────────────────────

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getGamesOnDay = (day: Date) =>
    tournamentGames.filter(g => {
      try { return isSameDay(parseISO(g.date), day); }
      catch { return false; }
    });

  // ── Weekly helpers ─────────────────────────────────────────────────────────

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weekGames = useMemo(
    () => tournamentGames.filter(g => {
      try {
        const d = parseISO(g.date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      } catch { return false; }
    }),
    [tournamentGames, weekStart, weekEnd],
  );

  // ── Season stats ───────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const total = tournamentGames.length;
    const completed = tournamentGames.filter(g => g.status === 'completed').length;
    const upcoming = tournamentGames.filter(g => g.status === 'scheduled').length;
    const totalPay = tournamentGames.reduce((s, g) => s + (g.payment || 0), 0);
    const uniqueDates = new Set(tournamentGames.map(g => g.date)).size;
    const assignedGames = tournamentGames.filter(g => g.assignments?.length > 0).length;
    return { total, completed, upcoming, totalPay, uniqueDates, assignedGames };
  }, [tournamentGames]);

  const getRefName = (id: string) => referees.find(r => r.id === id)?.name || 'Unassigned';

  if (tournaments.length === 0) {
    return (
      <Card className="glass-effect border-slate-200 shadow-xs">
        <CardContent className="py-12 text-center">
          <CalendarRange className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No leagues or tournaments yet. Create one in the Tournaments tab.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="league-season-tab">
      {/* Tournament selector + stats */}
      <Card className="glass-effect border-slate-200 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-slate-900 flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-brand-blue" />
                League Season View
              </CardTitle>
              <CardDescription className="text-slate-600">
                Calendar and weekly schedule for your league seasons.
              </CardDescription>
            </div>
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger className="w-64 border-slate-200" data-testid="league-season-tournament-select">
                <SelectValue placeholder="Select league" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Game Nights', value: stats.uniqueDates, icon: CalendarDays, color: 'text-brand-blue', bg: 'bg-blue-50' },
              { label: 'Total Games', value: stats.total, icon: Trophy, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Completed', value: stats.completed, icon: Trophy, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Upcoming', value: stats.upcoming, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
              { label: 'Refs Assigned', value: stats.assignedGames, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Total Pay', value: `$${stats.totalPay}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-lg p-3 text-center`}>
                <stat.icon className={`h-4 w-4 ${stat.color} mx-auto mb-1`} />
                <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar + Weekly Tabs */}
      <Tabs defaultValue="calendar" data-testid="league-season-view-tabs">
        <TabsList className="mb-3">
          <TabsTrigger value="calendar" data-testid="league-season-calendar-tab">
            <CalendarDays className="h-4 w-4 mr-1.5" /> Season Calendar
          </TabsTrigger>
          <TabsTrigger value="weekly" data-testid="league-season-weekly-tab">
            <CalendarRange className="h-4 w-4 mr-1.5" /> Weekly View
          </TabsTrigger>
        </TabsList>

        {/* ── Season Calendar ─────────────────────────── */}
        <TabsContent value="calendar">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="text-slate-600 hover:bg-slate-100"
                  data-testid="league-calendar-prev-month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h3 className="text-lg font-bold text-slate-900" data-testid="league-calendar-month-title">
                  {format(currentDate, 'MMMM yyyy')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="text-slate-600 hover:bg-slate-100"
                  data-testid="league-calendar-next-month"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                {calendarDays.map(day => {
                  const dayGames = getGamesOnDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  const hasGames = dayGames.length > 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] p-1.5 ${
                        isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                      } ${isToday ? 'ring-2 ring-brand-blue ring-inset' : ''}`}
                      data-testid={`league-calendar-day-${format(day, 'yyyy-MM-dd')}`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-medium ${
                          isToday ? 'text-brand-blue font-bold' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                        }`}>
                          {format(day, 'd')}
                        </span>
                        {hasGames && (
                          <Badge
                            className="h-4 min-w-[16px] px-1 text-[10px] font-bold bg-brand-blue text-white border-0"
                          >
                            {dayGames.length}
                          </Badge>
                        )}
                      </div>
                      {dayGames.slice(0, 3).map((g, i) => (
                        <div
                          key={g.id}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded mb-0.5 truncate ${
                            g.status === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : g.status === 'in-progress'
                              ? 'bg-orange-50 text-orange-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {g.time} {g.homeTeam} v {g.awayTeam}
                        </div>
                      ))}
                      {dayGames.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{dayGames.length - 3} more</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Weekly View ──────────────────────────────── */}
        <TabsContent value="weekly">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              {/* Week navigation */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(subWeeks(weekStart, 1))}
                  className="text-slate-600 hover:bg-slate-100"
                  data-testid="league-weekly-prev"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h3 className="text-sm font-bold text-slate-900" data-testid="league-weekly-title">
                  {format(weekStart, 'MMM d')} — {format(weekEnd, 'MMM d, yyyy')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setWeekStart(addWeeks(weekStart, 1))}
                  className="text-slate-600 hover:bg-slate-100"
                  data-testid="league-weekly-next"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {weekGames.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No games scheduled this week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {weekDays.map(day => {
                    const dayGames = getGamesOnDay(day);
                    if (dayGames.length === 0) return null;
                    const isToday = isSameDay(day, new Date());

                    return (
                      <div key={day.toISOString()} data-testid={`league-weekly-day-${format(day, 'yyyy-MM-dd')}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm font-bold ${isToday ? 'text-brand-blue' : 'text-slate-800'}`}>
                            {format(day, 'EEEE, MMM d')}
                          </span>
                          {isToday && <Badge className="bg-brand-blue text-white text-[10px] border-0">Today</Badge>}
                          <Badge variant="outline" className="text-[10px] border-slate-300 text-slate-500">
                            {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                          </Badge>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="text-slate-700 text-xs font-bold w-16">Time</TableHead>
                                <TableHead className="text-slate-700 text-xs font-bold">Matchup</TableHead>
                                <TableHead className="text-slate-700 text-xs font-bold">Venue</TableHead>
                                <TableHead className="text-slate-700 text-xs font-bold">Referees</TableHead>
                                <TableHead className="text-slate-700 text-xs font-bold text-center">Status</TableHead>
                                <TableHead className="text-slate-700 text-xs font-bold text-right">Pay</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {dayGames.map(game => (
                                <TableRow key={game.id} className="hover:bg-slate-50/50">
                                  <TableCell className="text-xs font-mono text-slate-600">{game.time || '—'}</TableCell>
                                  <TableCell className="text-xs font-semibold text-slate-900">
                                    {game.homeTeam} vs {game.awayTeam}
                                    {game.division && <span className="text-slate-400 font-normal ml-1">({game.division})</span>}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3 text-slate-400" />
                                      {game.venue || '—'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-600">
                                    {(game.assignments || []).length > 0
                                      ? game.assignments.map(a => a.referee?.name || 'Unassigned').join(', ')
                                      : <span className="text-slate-400">Unassigned</span>
                                    }
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge className={`text-[10px] border ${
                                      game.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200'
                                        : game.status === 'in-progress' ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      {game.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-right font-semibold text-slate-800">
                                    ${game.payment || 0}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeagueSeasonTab;
