import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X, CheckCircle, HelpCircle, AlertTriangle, XCircle, Award } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import AssignRefereeDialog from '@/pages/Manager/components/AssignRefereeDialog';
import { getRefereeStatus } from '@/lib/conflictUtils';

const CONFLICT_BADGE = {
  available: {
    icon: CheckCircle,
    label: 'Ready',
    className: 'bg-green-100 text-green-700 border-green-200',
    tip: 'Referee is available and has no conflicts',
  },
  'no-data': {
    icon: HelpCircle,
    label: 'No Avail. Data',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
    tip: 'Referee has not logged availability for this period',
  },
  'missing-certs': {
    icon: Award,
    label: 'Missing Cert',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    tip: 'Referee does not hold required certifications',
  },
  unavailable: {
    icon: XCircle,
    label: 'Unavailable',
    className: 'bg-red-100 text-red-700 border-red-200',
    tip: 'Referee marked unavailable during this time',
  },
  conflict: {
    icon: AlertTriangle,
    label: 'Conflict',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    tip: 'Referee has a schedule conflict with another game',
  },
};

const GameAssignmentsTab = ({ games, referees, assignRefereeToGame, unassignRefereeFromGame }) => {
  const { markGameAsCompleted } = useData();
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const handleOpenAssignDialog = (game) => {
    setSelectedGame(game);
    setAssignmentDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Scheduled</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case 'in-progress':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">In Progress</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">{status}</Badge>;
    }
  };

  const getAssignmentStatusBadge = (status) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs ml-1">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs ml-1">Declined</Badge>;
      case 'assigned':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs ml-1">Pending</Badge>;
      case 'requested':
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs ml-1 flex items-center">
            <HelpCircle className="h-3 w-3 mr-1" /> Requested
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs ml-1">{status}</Badge>;
    }
  };

  const getConflictBadge = (assignment, game) => {
    // Don't show conflict badges on completed games — history is read-only
    if (game.status === 'completed') return null;
    const referee = referees?.find((r) => r.id === assignment.referee_id);
    if (!referee) return null;
    const { status } = getRefereeStatus(referee, game, games);
    const cfg = CONFLICT_BADGE[status];
    if (!cfg) return null;
    const Icon = cfg.icon;
    return (
      <TooltipProvider delayDuration={300} key={`conflict-${assignment.id}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              data-testid={`conflict-badge-${assignment.id}`}
              className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-semibold cursor-default ml-1 ${cfg.className}`}
            >
              <Icon className="h-3 w-3" />
              {cfg.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {cfg.tip}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Check if ANY assignment in a game has a conflict or issue (for row highlight)
  // Only show conflict indicators for active (non-completed) games
  const getGameConflictLevel = (game) => {
    if (!game.game_assignments || !referees || game.status === 'completed') return null;
    const statuses = game.game_assignments.map((a) => {
      const ref = referees.find((r) => r.id === a.referee_id);
      if (!ref) return 'no-data';
      return getRefereeStatus(ref, game, games).status;
    });
    if (statuses.includes('conflict')) return 'conflict';
    if (statuses.includes('unavailable')) return 'unavailable';
    if (statuses.includes('missing-certs')) return 'missing-certs';
    return null;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return format(new Date(`1970-01-01T${timeString}`), 'p');
    } catch {
      return 'Invalid Time';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      try {
        return format(new Date(dateString), 'MMM dd, yyyy');
      } catch {
        return 'Invalid Date';
      }
    }
  };

  return (
    <>
      <Card className="glass-effect border-slate-200 shadow-sm" data-testid="manager-game-assignments-card">
        <CardHeader>
          <CardTitle className="text-slate-900">Game Assignments</CardTitle>
          <CardDescription className="text-slate-600">
            Assign referees to upcoming games. Referees are ranked by availability, certifications, and rating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b-slate-200 hover:bg-slate-50">
                  <TableHead className="text-slate-900 font-bold">Game</TableHead>
                  <TableHead className="text-slate-900 font-bold">Date & Time</TableHead>
                  <TableHead className="text-slate-900 font-bold">Status</TableHead>
                  <TableHead className="text-slate-900 font-bold">Assigned Referees</TableHead>
                  <TableHead className="text-right text-slate-900 font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => {
                  const conflictLevel = getGameConflictLevel(game);
                  const rowHighlight =
                    conflictLevel === 'conflict'
                      ? 'border-l-4 border-l-orange-400'
                      : conflictLevel === 'unavailable'
                      ? 'border-l-4 border-l-red-400'
                      : '';

                  return (
                    <TableRow
                      key={game.id}
                      className={`border-b-slate-100 hover:bg-slate-50/80 transition-colors ${rowHighlight}`}
                      data-testid={`manager-assignment-row-${game.id}`}
                    >
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div>
                            <p className="font-bold text-slate-900">{game.home_team} vs {game.away_team}</p>
                            <p className="text-sm text-slate-600 font-medium">
                              {game.tournament?.name} — {game.venue}
                            </p>
                          </div>
                          {conflictLevel && (
                            <span
                              data-testid={`game-conflict-indicator-${game.id}`}
                              className={`flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold mt-0.5 ${
                                conflictLevel === 'conflict'
                                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}
                            >
                              <AlertTriangle className="h-3 w-3" />
                              {conflictLevel === 'conflict' ? 'Conflict' : 'Issue'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 font-medium">
                        {formatDate(game.game_date)} at {formatTime(game.game_time)}
                      </TableCell>
                      <TableCell>{getStatusBadge(game.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {game.game_assignments && game.game_assignments.length > 0
                            ? game.game_assignments.map((assignment) => (
                                <div
                                  key={assignment.id}
                                  className="flex items-center flex-wrap bg-slate-100 text-slate-800 border border-slate-200 rounded-full px-2 py-1 text-xs font-bold shadow-sm gap-0.5"
                                >
                                  <span>{assignment.profiles?.name || '...'}</span>
                                  {getAssignmentStatusBadge(assignment.status)}
                                  {getConflictBadge(assignment, game)}
                                  {game.status !== 'completed' && (
                                    <button
                                      data-testid={`manager-unassign-referee-${assignment.id}`}
                                      onClick={() => unassignRefereeFromGame(assignment.id)}
                                      className="ml-1 rounded-full hover:bg-red-100 hover:text-red-600 text-slate-400 p-0.5 transition-colors"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))
                            : <span className="text-slate-400 italic text-sm">None Assigned</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {game.status !== 'completed' && (
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              data-testid={`manager-assign-referee-${game.id}`}
                              className="basketball-gradient hover:opacity-90 text-white shadow-sm font-semibold"
                              onClick={() => handleOpenAssignDialog(game)}
                            >
                              Assign
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`manager-complete-game-${game.id}`}
                              className="border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 font-semibold"
                              onClick={() => markGameAsCompleted(game.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1.5" />
                              Complete
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AssignRefereeDialog
        open={assignmentDialogOpen}
        setOpen={setAssignmentDialogOpen}
        game={selectedGame}
        referees={referees}
        games={games}
        onAssign={assignRefereeToGame}
      />
    </>
  );
};

export default GameAssignmentsTab;
