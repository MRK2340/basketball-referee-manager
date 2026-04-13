import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Star } from 'lucide-react';

const FindReplacementDialog = ({ open, setOpen, game, referees, games, onAssign }) => {
  const isRefereeAvailable = (refereeId) => {
    if (!game) return false;
    const gameTime = new Date(`${game.date}T${game.time}`);
    const gameEndTime = new Date(gameTime.getTime() + 90 * 60000);

    const hasConflict = games.some(g => {
      if (g.id === game.id) return false;
      if (!g.assignments.some(a => a.referee.id === refereeId)) return false;

      const otherGameTime = new Date(`${g.date}T${g.time}`);
      const otherGameEndTime = new Date(otherGameTime.getTime() + 90 * 60000);

      return (gameTime < otherGameEndTime && gameEndTime > otherGameTime);
    });

    return !hasConflict;
  };

  const availableReferees = useMemo(() => {
    if (!game || !referees) return [];
    const assignedRefereeIds = new Set(game.assignments.map(a => a.referee.id));
    return referees
      .filter(ref => !assignedRefereeIds.has(ref.id) && isRefereeAvailable(ref.id))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [game, referees, games]);

  const handleAssign = (refereeId) => {
    if (!game || !refereeId) {
      toast({ title: "Error", description: "Could not assign referee.", variant: "destructive" });
      return;
    }
    onAssign(game.id, refereeId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Find Replacement Referee</DialogTitle>
          <DialogDescription>
            Available and qualified referees for {game?.homeTeam} vs {game?.awayTeam}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-white">Referee</TableHead>
                <TableHead className="text-white text-center">Rating</TableHead>
                <TableHead className="text-right text-white">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableReferees.length > 0 ? availableReferees.map(ref => (
                <TableRow key={ref.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-white">{ref.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center text-slate-300">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      {ref.rating?.toFixed(1) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAssign(ref.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Assign
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan="3" className="text-center text-slate-400 py-8">
                    No available referees found for this game slot.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FindReplacementDialog;