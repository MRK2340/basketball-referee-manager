import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, CheckCircle, HelpCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import AssignRefereeDialog from '@/pages/Manager/components/AssignRefereeDialog';

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
        return <Badge className="bg-green-100 text-green-700 border-green-200 text-xs ml-2">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-700 border-red-200 text-xs ml-2">Declined</Badge>;
      case 'assigned':
         return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs ml-2">Pending</Badge>;
      case 'requested':
         return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs ml-2 flex items-center">
            <HelpCircle className="h-3 w-3 mr-1" /> Requested
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-xs ml-2">{status}</Badge>;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const date = new Date(`1970-01-01T${timeString}`);
      return format(date, "p");
    } catch (error) {
      console.error('Invalid time value for formatting:', timeString, error);
      return 'Invalid Time';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = parseISO(dateString);
        return format(date, "MMM dd, yyyy");
    } catch (error) {
        try {
            const date = new Date(dateString);
            return format(date, "MMM dd, yyyy");
        } catch(e) {
            console.error('Invalid date value for formatting:', dateString, e);
            return 'Invalid Date';
        }
    }
  };


  return (
    <>
      <Card className="glass-effect border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Game Assignments</CardTitle>
          <CardDescription className="text-slate-600">Assign referees to upcoming games and mark games as completed.</CardDescription>
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
                {games.map((game) => (
                  <TableRow key={game.id} className="border-b-slate-100 hover:bg-slate-50/80 transition-colors">
                    <TableCell>
                      <p className="font-bold text-slate-900">{game.home_team} vs {game.away_team}</p>
                      <p className="text-sm text-slate-600 font-medium">{game.tournament?.name} - {game.venue}</p>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium">
                       {formatDate(game.game_date)} at {formatTime(game.game_time)}
                    </TableCell>
                    <TableCell>{getStatusBadge(game.status)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {game.game_assignments && game.game_assignments.length > 0 ? game.game_assignments.map(assignment => (
                          <div key={assignment.id} className="flex items-center bg-slate-100 text-slate-800 border border-slate-200 rounded-full px-2 py-1 text-xs font-bold shadow-sm">
                            <span>{assignment.profiles?.name || '...'}</span>
                            {getAssignmentStatusBadge(assignment.status)}
                            {game.status !== 'completed' && (
                              <button onClick={() => unassignRefereeFromGame(assignment.id)} className="ml-2 rounded-full hover:bg-red-100 hover:text-red-600 text-slate-400 p-0.5 transition-colors">
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )) : <span className="text-slate-400 italic text-sm">None Assigned</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {game.status !== 'completed' && (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" className="basketball-gradient hover:opacity-90 text-white shadow-sm font-semibold" onClick={() => handleOpenAssignDialog(game)}>
                            Assign
                          </Button>
                          <Button size="sm" variant="outline" className="border-green-300 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 font-semibold" onClick={() => markGameAsCompleted(game.id)}>
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Complete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
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