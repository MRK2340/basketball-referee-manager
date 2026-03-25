import React, { useState } from 'react';
import { format, addMinutes } from 'date-fns';
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

const AssignCourtScheduleDialog = ({ open, setOpen }) => {
  const { tournaments, referees, assignRefereesToCourt } = useData();
  const [tournamentId, setTournamentId] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [courtNumber, setCourtNumber] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [gameDuration, setGameDuration] = useState('60');
  const [selectedReferees, setSelectedReferees] = useState([]);

  const selectedTournament = tournaments.find(t => t.id === tournamentId);

  const handleRefereeToggle = (refId) => {
    setSelectedReferees(prev =>
      prev.includes(refId) ? prev.filter(id => id !== refId) : [...prev, refId]
    );
  };

  const generateSchedule = () => {
    if (!tournamentId || !selectedDate || !courtNumber || selectedReferees.length < 3) {
        toast({ title: 'Missing Information', description: 'Please select a tournament, date, court, and at least 3 referees.', variant: 'destructive' });
        return;
    }

    const assignments = [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    let currentTime = new Date(`${dateStr}T${startTime}`);
    const endDateTime = new Date(`${dateStr}T${endTime}`);
    const duration = parseInt(gameDuration, 10);
    const numReferees = selectedReferees.length;
    let gameIndex = 0;

    while (currentTime < endDateTime) {
        const slotStartTime = format(currentTime, 'HH:mm:ss');
        const slotEndTime = format(addMinutes(currentTime, duration), 'HH:mm:ss');
        
        const ref1Index = gameIndex % numReferees;
        const ref2Index = (gameIndex + 1) % numReferees;
        
        assignments.push({
            tournament_id: tournamentId,
            referee_id: selectedReferees[ref1Index],
            court_number: parseInt(courtNumber, 10),
            assignment_date: dateStr,
            start_time: slotStartTime,
            end_time: slotEndTime,
        });
        assignments.push({
            tournament_id: tournamentId,
            referee_id: selectedReferees[ref2Index],
            court_number: parseInt(courtNumber, 10),
            assignment_date: dateStr,
            start_time: slotStartTime,
            end_time: slotEndTime,
        });

        currentTime = addMinutes(currentTime, duration);
        gameIndex++;
    }
    
    assignRefereesToCourt(assignments);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Assign Court Schedule</DialogTitle>
          <DialogDescription>Assign referees to a court for a time period with a "two on, one off" rotation.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">Tournament</Label>
            <Select onValueChange={setTournamentId} value={tournamentId}>
              <SelectTrigger className="col-span-3 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button disabled={!selectedTournament} variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="text-white" fromDate={selectedTournament ? new Date(selectedTournament.startDate) : undefined} toDate={selectedTournament ? new Date(selectedTournament.endDate) : undefined} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">Court #</Label>
            <Select onValueChange={setCourtNumber} value={courtNumber} disabled={!selectedTournament}>
              <SelectTrigger className="col-span-3 bg-slate-800 border-slate-600">
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                {selectedTournament && Array.from({ length: selectedTournament.numberOfCourts }, (_, i) => i + 1).map(num =>
                  <SelectItem key={num} value={String(num)}>Court {num}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-time" className="text-slate-300">Start Time</Label>
              <Input id="start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-slate-800 border-slate-600" />
            </div>
            <div>
              <Label htmlFor="end-time" className="text-slate-300">End Time</Label>
              <Input id="end-time" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-slate-800 border-slate-600" />
            </div>
          </div>
          <div>
            <Label htmlFor="game-duration" className="text-slate-300">Game Duration (minutes)</Label>
            <Input id="game-duration" type="number" value={gameDuration} onChange={e => setGameDuration(e.target.value)} className="bg-slate-800 border-slate-600" />
          </div>
          <div>
            <Label className="text-slate-300">Select Referees (at least 3)</Label>
            <div className="mt-2 p-2 max-h-40 overflow-y-auto rounded-md border border-slate-700 bg-slate-800/50">
              {referees.map(ref => (
                <div key={ref.id} className="flex items-center space-x-2 py-1">
                  <Checkbox id={`ref-${ref.id}`} checked={selectedReferees.includes(ref.id)} onCheckedChange={() => handleRefereeToggle(ref.id)} />
                  <Label htmlFor={`ref-${ref.id}`} className="text-sm font-medium leading-none text-white">{ref.name}</Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 mt-1">{selectedReferees.length} referees selected.</p>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={generateSchedule} disabled={selectedReferees.length < 3} className="basketball-gradient hover:opacity-90">Generate & Save Schedule</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
};

export default AssignCourtScheduleDialog;