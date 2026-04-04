import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useSearchParams } from 'react-router-dom';
import ScheduleFilter from '../components/ScheduleFilter';
import GameCard from '../components/GameCard';
import NoGamesFound from '../components/NoGamesFound';
import AssignRefereeDialog from '../components/AssignRefereeDialog';
import GameDetailSheet from '@/components/GameDetailSheet';
import { useAssignmentActions } from '@/hooks/useAssignmentActions';

const MyScheduleTab = ({ games, referees }) => {
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
    </>
  );
};

export default MyScheduleTab;