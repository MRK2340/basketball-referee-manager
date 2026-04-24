import React, { useState } from 'react';
import { format } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { parseLocalDate, timeToMinutes } from '@/lib/dateUtils';

const AssignCourtScheduleDialog = ({ open, setOpen }) => {
  const { tournaments, referees, games, assignmentActions } = useData();
  const [tournamentId, setTournamentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [selectedReferees, setSelectedReferees] = useState([]);

  const selectedTournament = tournaments.find(t => t.id === tournamentId);

  const handleRefereeToggle = (refId) => {
    setSelectedReferees(prev =>
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId]
    );
  };

  const generateSchedule = async () => {
    if (!tournamentId || !selectedDate || selectedReferees.length < 3) {
        toast({ title: 'Missing Information', description: 'Please select a tournament, date, and at least 3 referees.', variant: 'destructive' });
        return;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (startMinutes == null || endMinutes == null || endMinutes <= startMinutes) {
      toast({ title: 'Invalid Time Window', description: 'Please choose a valid start and end time.', variant: 'destructive' });
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const gamesToAssign = games
      .filter((game) => {
        if (game.tournamentId !== tournamentId || game.date !== dateStr || game.status === 'completed') return false;
        if ((game.assignments || []).length > 0) return false;

        const gameMinutes = timeToMinutes(game.time);
        return gameMinutes != null && gameMinutes >= startMinutes && gameMinutes < endMinutes;
      })
      .sort((a, b) => (timeToMinutes(a.time) ?? 0) - (timeToMinutes(b.time) ?? 0));

    if (gamesToAssign.length === 0) {
      toast({
        title: 'No Eligible Games',
        description: 'No unassigned games were found for this tournament, date, and time window.',
        variant: 'destructive',
      });
      return;
    }

    const assignments = gamesToAssign.flatMap((game, index) => {
      const ref1Index = index % selectedReferees.length;
      const ref2Index = (index + 1) % selectedReferees.length;

      return [
        { gameId: game.id, refereeId: selectedReferees[ref1Index] },
        { gameId: game.id, refereeId: selectedReferees[ref2Index] },
      ];
    });

    await assignmentActions.assignRefereesToCourt(assignments);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900" data-testid="assign-court-schedule-dialog">
        <DialogHeader>
          <DialogTitle>Assign Court Schedule</DialogTitle>
          <DialogDescription className="text-slate-600">Assign selected referees to unassigned tournament games in a date/time window with a rotating crew pattern.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Tournament</Label>
            <Select onValueChange={setTournamentId} value={tournamentId}>
              <SelectTrigger className="col-span-3 bg-white border-slate-300" data-testid="assign-court-tournament-trigger">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button disabled={!selectedTournament} data-testid="assign-court-date-button" variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50", !selectedDate && "text-muted-foreground")}> 
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  className="text-slate-900"
                  fromDate={selectedTournament ? parseLocalDate(selectedTournament.startDate) ?? undefined : undefined}
                  toDate={selectedTournament ? parseLocalDate(selectedTournament.endDate) ?? undefined : undefined}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-slate-700">Start Time</Label>
              <Input id="start-time" data-testid="assign-court-start-time-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-white border-slate-300" />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-slate-700">End Time</Label>
              <Input id="end-time" data-testid="assign-court-end-time-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-white border-slate-300" />
            </div>
          </div>
          <div>
            <Label className="text-slate-700">Select Referees (at least 3)</Label>
            <div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
              {referees.map(ref => (
                <div key={ref.id} className="flex items-center space-x-2 py-1">
                  <Checkbox id={`ref-${ref.id}`} data-testid={`assign-court-referee-${ref.id}`} checked={selectedReferees.includes(ref.id)} onCheckedChange={() => handleRefereeToggle(ref.id)} />
                  <Label htmlFor={`ref-${ref.id}`} className="text-sm font-medium leading-none text-slate-800">{ref.name}</Label>
                </div>
              ))}
            </div>
            <p className="mt-1 text-sm text-slate-500">{selectedReferees.length} referees selected.</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" data-testid="assign-court-generate-button" onClick={generateSchedule} disabled={selectedReferees.length < 3} className="basketball-gradient hover:opacity-90">Generate & Save Assignments</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default AssignCourtScheduleDialog;