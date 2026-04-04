import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, MapPin, Users, X, Check, XCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import DeclineAssignmentDialog from './DeclineAssignmentDialog';
import AcceptConflictWarningDialog from './AcceptConflictWarningDialog';
import { getRefereeStatus } from '@/lib/conflictUtils';

const GameCard = ({ game, user, onViewDetails, onAssignClick, onUnassignReferee, onUpdateAssignmentStatus }) => {
  const { referees, games } = useData();
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null);
  const [pendingAcceptAssignment, setPendingAcceptAssignment] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':    return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in-progress':  return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'completed':    return 'bg-green-100 text-green-700 border-green-200';
      default:             return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getAssignmentStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 ml-2">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive" className="ml-2">Declined</Badge>;
      default:
        return null;
    }
  };

  const handleDeclineClick = (assignment) => {
    setSelectedAssignment(assignment);
    setDeclineDialogOpen(true);
  };

  const handleAcceptClick = (assignment) => {
    const refereeProfile = referees?.find((r) => r.id === user.id);
    if (!refereeProfile) {
      onUpdateAssignmentStatus(assignment.id, 'accepted');
      return;
    }
    const fitStatus = getRefereeStatus(refereeProfile, game, games || []);
    if (fitStatus.status === 'conflict' || fitStatus.status === 'unavailable') {
      setConflictInfo(fitStatus);
      setPendingAcceptAssignment(assignment);
      setConflictDialogOpen(true);
    } else {
      onUpdateAssignmentStatus(assignment.id, 'accepted');
    }
  };

  const handleAcceptAnyway = () => {
    if (pendingAcceptAssignment) {
      onUpdateAssignmentStatus(pendingAcceptAssignment.id, 'accepted');
    }
    setConflictDialogOpen(false);
    setPendingAcceptAssignment(null);
    setConflictInfo(null);
  };

  const userAssignment = user.role === 'referee'
    ? game.assignments.find((a) => a.referee.id === user.id)
    : null;

  return (
    <>
      <Card className="glass-effect border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3 flex-wrap gap-y-1">
                <h3 className="text-xl font-bold text-slate-900">
                  {game.homeTeam} vs {game.awayTeam}
                </h3>
                <Badge className={`border ${getStatusColor(game.status)}`}>
                  {game.status.replace('-', ' ')}
                </Badge>
                <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-800">
                  {game.division}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-slate-700">
                  <CalendarIcon className="h-4 w-4 text-brand-blue" />
                  <span>{format(new Date(game.date), 'PPP')}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Clock className="h-4 w-4 text-brand-orange" />
                  <span>{game.time}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span>{game.venue}</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-slate-800 text-sm font-semibold">Assigned Referees:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {game.assignments.length > 0
                    ? game.assignments.map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="bg-slate-100 text-slate-800 border border-slate-200">
                          {assignment.referee.name}
                          {getAssignmentStatusBadge(assignment.status)}
                          {user?.role === 'manager' && (
                            <button
                              onClick={() => onUnassignReferee(assignment.id)}
                              className="ml-2 rounded-full hover:bg-slate-200 p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </Badge>
                      ))
                    : <span className="text-slate-500 text-sm">None</span>}
                </div>
              </div>

              {game.status === 'completed' && game.homeScore !== undefined && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-slate-900 font-semibold">
                    Final Score: {game.homeTeam} {game.homeScore} - {game.awayScore} {game.awayTeam}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end space-y-2 lg:ml-6">
              <div className="text-right mb-2">
                <p className="text-2xl font-bold text-green-600">${game.payment}</p>
                <p className="text-slate-600 text-sm">Payment</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  size="sm"
                  variant="outline"
                  data-testid={`game-card-view-details-${game.id}`}
                  className="border-slate-300 text-slate-800 hover:bg-slate-100 w-full"
                  onClick={() => onViewDetails(game)}
                >
                  View Details
                </Button>
                {user?.role === 'referee' && userAssignment && userAssignment.status === 'assigned' && (
                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      data-testid={`game-card-decline-${game.id}`}
                      className="bg-red-600 hover:bg-red-700 text-white flex-1"
                      onClick={() => handleDeclineClick(userAssignment)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      data-testid={`game-card-accept-${game.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1"
                      onClick={() => handleAcceptClick(userAssignment)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                  </div>
                )}
                {user?.role === 'manager' && (
                  <Button
                    size="sm"
                    data-testid={`game-card-assign-${game.id}`}
                    className="basketball-gradient hover:opacity-90 text-white w-full"
                    onClick={() => onAssignClick(game)}
                  >
                    Assign
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && (
        <DeclineAssignmentDialog
          open={declineDialogOpen}
          setOpen={setDeclineDialogOpen}
          assignment={selectedAssignment}
          onDecline={onUpdateAssignmentStatus}
        />
      )}
      <AcceptConflictWarningDialog
        open={conflictDialogOpen}
        onOpenChange={setConflictDialogOpen}
        conflictInfo={conflictInfo}
        onAcceptAnyway={handleAcceptAnyway}
      />
    </>
  );
};

export default GameCard;
