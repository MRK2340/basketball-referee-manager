import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MapPin, DollarSign, ThumbsUp } from 'lucide-react';
import { format } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import NoGamesFound from '../components/NoGamesFound';

const OpenGameCard = ({ game, onRequestGame, isRequested }) => {
    return (
        <Card className="glass-effect border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{game.homeTeam} vs {game.awayTeam}</h3>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 mb-3">
                            <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800 border-slate-200">{game.division}</Badge>
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Needs Referees</Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm">
                            <div className="flex items-center space-x-2 text-slate-700">
                                <CalendarIcon className="h-4 w-4 text-blue-600" />
                                <span>{format(new Date(game.date), 'PPP')}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                                <Clock className="h-4 w-4 text-orange-600" />
                                <span>{game.time}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-slate-700">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span>{game.venue}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end mt-4 sm:mt-0">
                        <div className="flex items-baseline mb-3">
                            <DollarSign className="h-6 w-6 text-green-600" />
                            <span className="text-2xl font-bold text-green-600">{game.payment}</span>
                        </div>
                        <Button 
                            data-testid={`open-game-request-${game.id}`}
                            className={`${isRequested ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`} 
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
  // Hooks at the top
  const { user } = useAuth();
  const { requestGameAssignment } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGames = games.filter(game => {
    const searchLower = searchTerm.toLowerCase();
    const gameHasAssignments = game.assignments && game.assignments.length > 0;
    
    const isUnassigned = !gameHasAssignments;
    const hasRequested = gameHasAssignments && game.assignments.some(a => a.referee.id === user.id && a.status === 'requested');
    const searchMatch = searchTerm === '' ||
        game.homeTeam.toLowerCase().includes(searchLower) ||
        game.awayTeam.toLowerCase().includes(searchLower) ||
        game.venue.toLowerCase().includes(searchLower);

    return (isUnassigned || hasRequested) && searchMatch;
  });

  return (
    <div className="space-y-6 mt-6">
        <div className="space-y-4">
            {filteredGames.length > 0 ? (
                filteredGames.map((game, index) => {
                    const isRequested = game.assignments.some(a => a.referee.id === user.id && a.status === 'requested');
                    return (
                        <motion.div
                            key={game.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <OpenGameCard 
                                game={game} 
                                onRequestGame={requestGameAssignment} 
                                isRequested={isRequested}
                            />
                        </motion.div>
                    );
                })
            ) : (
                <NoGamesFound hasFilter={searchTerm !== ''} userRole="referee" />
            )}
        </div>
    </div>
  );
};

export default OpenGamesTab;