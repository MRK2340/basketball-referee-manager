import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const AssignRefereeDialog = ({ open, setOpen, game, referees, onAssign }) => {
  const [selectedRefereeId, setSelectedRefereeId] = useState('');

  const handleAssign = () => {
    if (!game || !selectedRefereeId) {
      toast({ title: "Selection Missing", description: "Please select a referee to assign.", variant: "destructive" });
      return;
    }
    onAssign(game.id, selectedRefereeId);
    setOpen(false);
    setSelectedRefereeId('');
  };

  const availableReferees = useMemo(() => {
    if (!game || !referees) return [];
    const assignedRefereeIds = new Set(game.assignments.map(a => a.referee.id));
    return referees.filter(ref => !assignedRefereeIds.has(ref.id));
  }, [game, referees]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setSelectedRefereeId('');
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Assign Referee</DialogTitle>
          <DialogDescription>
            Assign a referee to {game?.homeTeam} vs {game?.awayTeam}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="referee" className="text-slate-300">Available Referees</Label>
          <Select value={selectedRefereeId} onValueChange={setSelectedRefereeId}>
            <SelectTrigger className="w-full bg-slate-800 border-slate-600">
              <SelectValue placeholder="Select a referee" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              {availableReferees.length > 0 ? availableReferees.map(ref => (
                <SelectItem key={ref.id} value={ref.id}>{ref.name}</SelectItem>
              )) : <div className="p-2 text-slate-400">No available referees</div>}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAssign} className="basketball-gradient hover:opacity-90">Assign Referee</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignRefereeDialog;