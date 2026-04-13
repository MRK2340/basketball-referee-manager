import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Trophy, DollarSign } from 'lucide-react';

const GameDetailsDialog = ({ open, setOpen, game }) => {
  if (!game) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl">{game.homeTeam} vs {game.awayTeam}</DialogTitle>
          <DialogDescription>
            Game details for the match in the {game.tournamentName}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={`border ${getStatusColor(game.status)}`}>
              {game.status.replace('-', ' ')}
            </Badge>
            <Badge variant="secondary" className="text-xs bg-slate-700 text-slate-200">
              {game.division}
            </Badge>
          </div>

          {game.status === 'completed' && game.homeScore !== undefined && (
            <div className="p-3 bg-slate-800/50 rounded-lg text-center">
              <p className="text-white font-semibold text-lg">
                Final Score: {game.homeTeam} {game.homeScore} - {game.awayScore} {game.awayTeam}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-semibold">Date</p>
                <p className="text-slate-300">{format(new Date(game.date), 'PPP')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-orange-400 mt-0.5" />
              <div>
                <p className="font-semibold">Time</p>
                <p className="text-slate-300">{game.time}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold">Venue</p>
                <p className="text-slate-300">{game.venue}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Trophy className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-semibold">Tournament</p>
                <p className="text-slate-300">{game.tournamentName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-semibold">Payment</p>
                <p className="text-slate-300">${game.payment}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <p className="font-semibold">Assigned Referees</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {game.assignments.length > 0 ? game.assignments.map(assignment => (
                    <Badge key={assignment.id} variant="secondary" className="bg-slate-700 text-slate-200">
                      {assignment.referee.name}
                    </Badge>
                  )) : <span className="text-slate-500 text-sm">None assigned</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameDetailsDialog;