import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { AlertCircle, Star, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AssignRefereeDialog = ({ open, setOpen, game, referees, games, onAssign }) => {
  const [selectedRefereeId, setSelectedRefereeId] = useState('');
  const [conflictWarning, setConflictWarning] = useState(null);

  const selectedReferee = useMemo(() => {
    return referees.find(ref => ref.id === selectedRefereeId);
  }, [selectedRefereeId, referees]);

  const checkConflict = (refereeId) => {
    if (!refereeId || !game || !games) return null;

    if (!game.game_date || !game.game_time) return null;
    const gameTime = new Date(`${game.game_date}T${game.game_time}`);
    const gameEndTime = new Date(gameTime.getTime() + 90 * 60000); // Assuming 90 mins per game

    const conflictingGame = games.find(g => {
      if (g.id === game.id) return false;
      if (!g.game_assignments || !g.game_assignments.some(a => a.referee_id === refereeId)) return false;
      if (!g.game_date || !g.game_time) return false;

      const otherGameTime = new Date(`${g.game_date}T${g.game_time}`);
      const otherGameEndTime = new Date(otherGameTime.getTime() + 90 * 60000);

      return (gameTime < otherGameEndTime && gameEndTime > otherGameTime);
    });

    return conflictingGame ? `This referee is already assigned to "${conflictingGame.home_team} vs ${conflictingGame.away_team}" at a conflicting time.` : null;
  };

  const handleRefereeSelect = (refereeId) => {
    setSelectedRefereeId(refereeId);
    setConflictWarning(checkConflict(refereeId));
  };

  const handleAssign = () => {
    if (!game || !selectedRefereeId) {
      toast({ title: "Selection Missing", description: "Please select a referee to assign.", variant: "destructive" });
      return;
    }
    onAssign(game.id, selectedRefereeId);
    setOpen(false);
    setSelectedRefereeId('');
    setConflictWarning(null);
  };

  const availableReferees = useMemo(() => {
    if (!game || !referees || !game.game_assignments) return [];
    const assignedRefereeIds = new Set(game.game_assignments.map(a => a.referee_id));
    return referees.filter(ref => !assignedRefereeIds.has(ref.id));
  }, [game, referees]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSelectedRefereeId('');
        setConflictWarning(null);
      }
    }}>
      <DialogContent className="sm:max-w-md bg-white border-slate-200 text-slate-900" data-testid="assign-referee-dialog">
        <DialogHeader>
          <DialogTitle>Assign Referee</DialogTitle>
          <DialogDescription className="text-slate-600">
            Assign a referee to {game?.home_team} vs {game?.away_team}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="referee" className="text-slate-700">Available Referees</Label>
            <Select value={selectedRefereeId} onValueChange={handleRefereeSelect}>
              <SelectTrigger className="w-full bg-white border-slate-300" data-testid="assign-referee-select-trigger">
                <SelectValue placeholder="Select a referee" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {availableReferees.length > 0 ? availableReferees.map(ref => (
                  <SelectItem key={ref.id} value={ref.id}>{ref.name}</SelectItem>
                )) : <div className="p-2 text-slate-400">No available referees</div>}
              </SelectContent>
            </Select>
          </div>
          {selectedReferee && (
             <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3" data-testid="assign-referee-selected-summary">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-slate-900">{selectedReferee.name}</p>
                    <div className="flex items-center text-sm text-yellow-400">
                        <Star className="h-4 w-4 mr-1 fill-current" />
                        {selectedReferee.rating?.toFixed(1) || 'N/A'}
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-orange-400"/>
                    <div className="flex flex-wrap gap-1">
                        {(selectedReferee.certifications || []).map(cert => (
                            <Badge key={cert} variant="outline" className="text-xs">{cert}</Badge>
                        ))}
                    </div>
                </div>
            </div>
          )}
          {conflictWarning && (
            <div className="flex items-start space-x-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3" data-testid="assign-referee-conflict-warning">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <p className="text-sm text-yellow-700">{conflictWarning}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" data-testid="assign-referee-cancel-button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" data-testid="assign-referee-confirm-button" onClick={handleAssign} className="basketball-gradient hover:opacity-90">Assign Referee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRefereeDialog;