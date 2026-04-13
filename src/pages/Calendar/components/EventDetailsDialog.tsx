import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  MapPin,
  Users,
  DollarSign,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';

const getStatusInfo = (status) => {
  switch (status) {
    case 'scheduled':
    case 'assigned':
      return { color: 'bg-blue-500/20 text-blue-300', text: 'Scheduled' };
    case 'accepted':
      return { color: 'bg-teal-500/20 text-teal-300', text: 'Accepted' };
    case 'completed':
      return { color: 'bg-green-500/20 text-green-300', text: 'Completed' };
    case 'declined':
      return { color: 'bg-red-500/20 text-red-300', text: 'Declined' };
    default:
      return { color: 'bg-slate-500/20 text-slate-300', text: 'Unknown' };
  }
};

const EventDetailsDialog = ({ isOpen, onOpenChange, selectedDate, games, isAvailable }) => {
  if (!selectedDate) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-orange-400" />
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            A summary of your events for the selected day.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2 scrollbar-hide">
          {games.length === 0 && !isAvailable && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No scheduled events for this day.</p>
            </div>
          )}

          {isAvailable && games.length === 0 && (
             <div className="flex items-center p-4 rounded-lg bg-green-900/30 border border-green-700">
                <CheckCircle className="h-8 w-8 text-green-400 mr-4" />
                <div>
                  <h4 className="font-semibold text-white">You are available!</h4>
                  <p className="text-sm text-green-300">You've marked this day as available for assignments.</p>
                </div>
            </div>
          )}
          
          {games.length > 0 && (
            <div className="space-y-4">
              {games.map(game => {
                const statusInfo = getStatusInfo(game.status);
                return (
                  <div key={game.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex justify-between items-start">
                      <h4 className="text-white font-semibold flex-1 pr-2">
                        {game.homeTeam} vs {game.awayTeam}
                      </h4>
                      <Badge className={`${statusInfo.color} border-0`}>{statusInfo.text}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300 mt-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-400" />
                        <span>{game.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-orange-400" />
                        <span>{game.venue}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-orange-400" />
                        <span>{game.division}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-green-400" />
                        <span className="font-semibold text-green-400">${game.payment}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsDialog;