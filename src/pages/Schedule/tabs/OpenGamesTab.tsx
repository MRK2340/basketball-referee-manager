import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, MapPin, DollarSign, ThumbsUp, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import NoGamesFound from '../components/NoGamesFound';

const SORT_OPTIONS = [
  { value: 'date-asc', label: 'Date (Soonest First)' },
  { value: 'date-desc', label: 'Date (Latest First)' },
  { value: 'pay-desc', label: 'Pay (Highest First)' },
  { value: 'pay-asc', label: 'Pay (Lowest First)' },
  { value: 'best-match', label: 'Best Match' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'this-week', label: 'This Week' },
  { value: 'this-month', label: 'This Month' },
];

const OpenGameCard = ({ game, onRequestGame, isRequested, matchScore }) => {
  let formattedDate = game.date;
  try { formattedDate = format(new Date(game.date), 'PPP'); } catch { /* ignore */ }

  return (
    <Card className="glass-effect border-slate-200 hover:border-brand-orange hover:shadow-md transition-all duration-300 shadow-xs" data-testid={`open-game-card-${game.id}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">{game.homeTeam} vs {game.awayTeam}</h3>
              {matchScore !== undefined && matchScore > 0 && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-bold border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {matchScore >= 2 ? 'Best Match' : 'Good Match'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm mb-3 flex-wrap">
              <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800 border-slate-200">{game.division}</Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 text-xs">Needs Referees</Badge>
              {game.level && <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">{game.level}</Badge>}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-700">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="h-4 w-4 text-blue-600 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-orange-600 shrink-0" />
                <span>{game.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                <span>{game.venue}</span>
              </div>
            </div>
            {(game.requiredCertifications || []).length > 0 && (
              <div className="flex gap-1 mt-3 flex-wrap">
                {(game.requiredCertifications || []).map((cert) => (
                  <Badge key={cert} variant="outline" className="text-xs border-slate-300 text-slate-600">{cert}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-start sm:items-end gap-3">
            <div className="flex items-baseline">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-black text-green-600">{game.payment}</span>
            </div>
            <Button
              data-testid={`open-game-request-${game.id}`}
              className={`${isRequested ? 'bg-slate-300 cursor-not-allowed text-slate-600' : 'bg-green-600 hover:bg-green-700 text-white'} font-semibold`}
              onClick={() => !isRequested && onRequestGame(game.id)}
              disabled={isRequested}
            >
              <ThumbsUp className="mr-2 h-4 w-4" />
              {isRequested ? 'Requested' : 'Request Game'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const OpenGamesTab = ({ games }) => {
  const { user } = useAuth();
  const { assignmentActions } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-asc');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [minPay, setMinPay] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Unique divisions
  const divisions = useMemo(() => {
    const divSet = new Set(games.map((g) => g.division).filter(Boolean));
    return ['all', ...Array.from(divSet)];
  }, [games]);

  const getMatchScore = (game) => {
    if (!user?.certifications) return 0;
    const required = game.requiredCertifications || [];
    const userCerts = user.certifications || [];
    return required.filter((c) => userCerts.includes(c)).length;
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return games.filter((game) => {
      const hasAssignments = game.assignments && game.assignments.length > 0;
      const isUnassigned = !hasAssignments;
      const hasRequested = hasAssignments && game.assignments.some((a) => a.referee?.id === user?.id && a.status === 'pending');
      if (!isUnassigned && !hasRequested) return false;

      // Search
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!game.homeTeam.toLowerCase().includes(s) && !game.awayTeam.toLowerCase().includes(s) && !(game.venue || '').toLowerCase().includes(s) && !(game.division || '').toLowerCase().includes(s)) return false;
      }

      // Division
      if (divisionFilter !== 'all' && game.division !== divisionFilter) return false;

      // Pay
      if (minPay && (Number(game.payment) || 0) < Number(minPay)) return false;

      // Date range
      if (dateRangeFilter !== 'all') {
        const gameDate = new Date(game.date);
        if (dateRangeFilter === 'today' && !format(gameDate, 'yyyy-MM-dd').includes(format(now, 'yyyy-MM-dd'))) return false;
        if (dateRangeFilter === 'this-week' && isAfter(gameDate, addDays(now, 7))) return false;
        if (dateRangeFilter === 'this-month' && (gameDate.getMonth() !== now.getMonth() || gameDate.getFullYear() !== now.getFullYear())) return false;
      }

      return true;
    });
  }, [games, searchTerm, divisionFilter, dateRangeFilter, minPay, user]);

  const sorted = useMemo(() => {
    const matchScore = (game) => {
      if (!user?.certifications) return 0;
      const required = game.requiredCertifications || [];
      const userCerts = user.certifications || [];
      return required.filter((c) => userCerts.includes(c)).length;
    };
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
      if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'pay-desc') return (Number(b.payment) || 0) - (Number(a.payment) || 0);
      if (sortBy === 'pay-asc') return (Number(a.payment) || 0) - (Number(b.payment) || 0);
      if (sortBy === 'best-match') return matchScore(b) - matchScore(a);
      return 0;
    });
  }, [filtered, sortBy, user]);

  const hasActiveFilters = divisionFilter !== 'all' || dateRangeFilter !== 'all' || minPay !== '';

  const clearFilters = () => {
    setDivisionFilter('all');
    setDateRangeFilter('all');
    setMinPay('');
  };

  return (
    <div className="space-y-5 mt-6" data-testid="open-games-tab">
      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by teams, venue, division..."
            className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 pl-4"
            data-testid="open-games-search-input"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 bg-white border-slate-300 text-slate-900" data-testid="open-games-sort-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className={`border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 ${hasActiveFilters ? 'border-brand-orange text-brand-orange bg-orange-50' : ''}`}
            onClick={() => setShowFilters((p) => !p)}
            data-testid="open-games-filter-toggle"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-orange text-white text-[10px] font-bold">!</span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
          data-testid="open-games-filters-panel"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-700 font-semibold text-sm mb-1.5 block">Division</Label>
              <Select value={divisionFilter} onValueChange={setDivisionFilter}>
                <SelectTrigger className="bg-white border-slate-300" data-testid="open-games-division-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {divisions.map((d) => (
                    <SelectItem key={d} value={d}>{d === 'all' ? 'All Divisions' : d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-sm mb-1.5 block">Date Range</Label>
              <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                <SelectTrigger className="bg-white border-slate-300" data-testid="open-games-date-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  {DATE_RANGE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-700 font-semibold text-sm mb-1.5 block">Min. Pay ($)</Label>
              <Input
                type="number"
                value={minPay}
                onChange={(e) => setMinPay(e.target.value)}
                placeholder="e.g. 50"
                className="bg-white border-slate-300 text-slate-900"
                data-testid="open-games-pay-filter"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" className="text-slate-500 hover:text-slate-700 gap-1.5" onClick={clearFilters}>
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Button>
          )}
        </motion.div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {sorted.length > 0 ? (
          <>
            <p className="text-sm text-slate-500 font-medium">{sorted.length} game{sorted.length !== 1 ? 's' : ''} available</p>
            {sorted.map((game, index) => {
              const isRequested = (game.assignments || []).some((a) => a.referee?.id === user?.id && a.status === 'pending');
              const matchScore = sortBy === 'best-match' ? getMatchScore(game) : undefined;
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                >
                  <OpenGameCard
                    game={game}
                    onRequestGame={assignmentActions.requestGameAssignment}
                    isRequested={isRequested}
                    matchScore={matchScore}
                  />
                </motion.div>
              );
            })}
          </>
        ) : (
          <NoGamesFound hasFilter={searchTerm !== '' || hasActiveFilters} userRole="referee" />
        )}
      </div>
    </div>
  );
};

export default OpenGamesTab;
