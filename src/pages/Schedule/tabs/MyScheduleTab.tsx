import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useSearchParams } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, DollarSign, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import ScheduleFilter from '../components/ScheduleFilter';
import GameCard from '../components/GameCard';
import NoGamesFound from '../components/NoGamesFound';
import AssignRefereeDialog from '../components/AssignRefereeDialog';
import GameDetailSheet from '@/components/GameDetailSheet';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';

const GAME_TYPE_STYLES = {
  league: 'bg-blue-100 text-blue-700 border-blue-200',
  tournament: 'bg-purple-100 text-purple-700 border-purple-200',
  scrimmage: 'bg-green-100 text-green-700 border-green-200',
  playoff: 'bg-orange-100 text-orange-700 border-orange-200',
  other: 'bg-slate-100 text-slate-600 border-slate-200',
};
const GAME_TYPE_LABELS = { league: 'League', tournament: 'Tournament', scrimmage: 'Scrimmage', playoff: 'Playoff', other: 'Other' };

const MyScheduleTab = ({ games, referees, independentGames = [] }) => {
  // Hooks at the top
  const { user } = useAuth();
  const { fetchData } = useData();
  const { assignRefereeToGame, unassignRefereeFromGame, updateAssignmentStatus } = useAssignmentActions(user, fetchData);

  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filter, setFilter] = useState('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailGame, setDetailGame] = useState(null);

  useEffect(() => {
    const term = searchParams.get('search');
    if (term) setSearchTerm(term);
  }, [searchParams]);

  const filteredGames = useMemo(() => {
    return games
      .filter(game => {
        if (filter === 'all') return true;
        return game.status === filter;
      })
      .filter(game => {
        const searchLower = searchTerm.toLowerCase();
        return (
          game.homeTeam.toLowerCase().includes(searchLower) ||
          game.awayTeam.toLowerCase().includes(searchLower) ||
          game.venue.toLowerCase().includes(searchLower)
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date) || a.time.localeCompare(b.time));
  }, [games, filter, searchTerm]);

  const handleAssignClick = (game) => {
    setSelectedGame(game);
    setAssignDialogOpen(true);
  };

  const handleViewDetails = (game) => {
    setDetailGame(game);
    setDetailDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-6 mt-6">
        <ScheduleFilter
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filter={filter}
          setFilter={setFilter}
        />
        <div className="space-y-4">
          {filteredGames.length > 0 ? (
            filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <GameCard
                  game={game}
                  user={user}
                  onViewDetails={handleViewDetails}
                  onAssignClick={handleAssignClick}
                  onUnassignReferee={unassignRefereeFromGame}
                  onUpdateAssignmentStatus={updateAssignmentStatus}
                />
              </motion.div>
            ))
          ) : (
            <NoGamesFound hasFilter={searchTerm !== '' || filter !== 'all'} userRole={user.role} />
          )}
        </div>
      </div>
      {selectedGame && (
        <AssignRefereeDialog
          open={assignDialogOpen}
          setOpen={setAssignDialogOpen}
          game={selectedGame}
          referees={referees}
          games={games}
          onAssign={assignRefereeToGame}
        />
      )}
      <GameDetailSheet
        open={detailDialogOpen}
        setOpen={setDetailDialogOpen}
        game={detailGame}
      />

      {/* Independent Games section — referee only */}
      {user?.role === 'referee' && independentGames.length > 0 && (
        <div className="mt-10" data-testid="schedule-independent-section">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">
              Independent Games
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <p className="text-slate-500 text-sm mb-4">
            Games you referee outside of this platform — for your records only.
          </p>
          <div className="space-y-3">
            {independentGames
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((game, index) => {
                const typeStyle = GAME_TYPE_STYLES[game.game_type] || GAME_TYPE_STYLES.other;
                const typeLabel = GAME_TYPE_LABELS[game.game_type] || 'Other';
                const isUpcoming = game.date >= new Date().toISOString().slice(0, 10);
                let formattedDate = game.date;
                try { formattedDate = format(parseISO(game.date), 'EEE, MMM d, yyyy'); } catch { /* ignore */ }
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    data-testid={`schedule-ind-game-${game.id}`}
                  >
                    <Card className={`border-slate-200 bg-white/80 shadow-xs hover:shadow-md transition-shadow ${isUpcoming ? 'ring-1 ring-brand-blue/20' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-slate-900 truncate">
                                {game.organization || 'Independent Game'}
                              </span>
                              <Badge className={`border text-xs ${typeStyle}`}>{typeLabel}</Badge>
                              {isUpcoming && (
                                <Badge className="bg-blue-50 text-brand-blue border-blue-200 text-xs">Upcoming</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-brand-orange" />
                                {formattedDate}{game.time ? ` · ${game.time}` : ''}
                              </span>
                              {game.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-brand-blue" />
                                  {game.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <DollarSign className="h-3.5 w-3.5 text-green-500" />
                            <span className="font-bold text-green-600">${Number(game.fee).toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}
    </>
  );
};

export default MyScheduleTab;