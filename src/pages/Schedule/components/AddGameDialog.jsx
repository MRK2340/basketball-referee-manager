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

const AddGameDialog = ({ open, setOpen }) => {
  const { tournaments, gameActions } = useData();
  const [tournamentId, setTournamentId] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [division, setDivision] = useState('');
  const [payment, setPayment] = useState('');
  const [level, setLevel] = useState('');
  const [requiredCerts, setRequiredCerts] = useState('');

  const resetForm = () => {
    setTournamentId('');
    setHomeTeam('');
    setAwayTeam('');
    setDate(null);
    setTime('');
    setVenue('');
    setDivision('');
    setPayment('');
    setLevel('');
    setRequiredCerts('');
  };

  const handleSubmit = async () => {
    if (!tournamentId || !homeTeam || !awayTeam || !date || !time || !venue || !division || !payment || !level) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields to schedule a game.',
        variant: 'destructive',
      });
      return;
    }
    // Validate payment amount bounds
    const paymentNum = parseFloat(payment);
    if (isNaN(paymentNum) || paymentNum < 0 || paymentNum > 10000) {
      toast({ title: 'Invalid Payment', description: 'Payment must be between $0 and $10,000.', variant: 'destructive' });
      return;
    }
    // Validate time format (HH:MM or H:MM AM/PM)
    const timeRegex = /^(\d{1,2}):(\d{2})(\s?[AaPp][Mm])?$/;
    if (!timeRegex.test(time.trim())) {
      toast({ title: 'Invalid Time', description: 'Please enter a valid time (e.g. 9:00 AM or 14:30).', variant: 'destructive' });
      return;
    }
    await gameActions.addGame({
      tournament_id: tournamentId,
      home_team: homeTeam,
      away_team: awayTeam,
      game_date: format(date, 'yyyy-MM-dd'),
      game_time: time,
      venue: venue,
      division: division,
      payment_amount: parseFloat(payment),
      level: level,
      required_certifications: requiredCerts.split(',').map(c => c.trim()).filter(Boolean),
      status: 'scheduled',
    });
    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900" data-testid="schedule-add-game-dialog">
        <DialogHeader>
          <DialogTitle>Schedule New Game</DialogTitle>
          <DialogDescription className="text-slate-600">Fill in the details for the new game.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tournament" className="text-right text-slate-700">Tournament</Label>
            <Select onValueChange={setTournamentId} value={tournamentId}>
              <SelectTrigger className="col-span-3 bg-white border-slate-300" data-testid="schedule-add-game-tournament-trigger">
                <SelectValue placeholder="Select a tournament" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {tournaments.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="homeTeam" className="text-right text-slate-700">Home Team</Label>
            <Input id="homeTeam" data-testid="schedule-add-game-home-team-input" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="col-span-3 bg-white border-slate-300" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="awayTeam" className="text-right text-slate-700">Away Team</Label>
            <Input id="awayTeam" data-testid="schedule-add-game-away-team-input" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="col-span-3 bg-white border-slate-300" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-slate-700">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button data-testid="schedule-add-game-date-button" variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="text-slate-900" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right text-slate-700">Time</Label>
            <Input id="time" data-testid="schedule-add-game-time-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3 bg-white border-slate-300" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="venue" className="text-right text-slate-700">Venue</Label>
            <Input id="venue" data-testid="schedule-add-game-venue-input" value={venue} onChange={(e) => setVenue(e.target.value)} className="col-span-3 bg-white border-slate-300" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="division" className="text-right text-slate-700">Division</Label>
            <Input id="division" data-testid="schedule-add-game-division-input" value={division} onChange={(e) => setDivision(e.target.value)} className="col-span-3 bg-white border-slate-300" placeholder="e.g., U14 Boys" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment" className="text-right text-slate-700">Payment ($)</Label>
            <Input id="payment" data-testid="schedule-add-game-payment-input" type="number" value={payment} onChange={(e) => setPayment(e.target.value)} className="col-span-3 bg-white border-slate-300" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="level" className="text-right text-slate-700">Game Level</Label>
            <Input id="level" data-testid="schedule-add-game-level-input" value={level} onChange={(e) => setLevel(e.target.value)} className="col-span-3 bg-white border-slate-300" placeholder="e.g., Varsity, JV" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiredCerts" className="text-right text-slate-700">Certs</Label>
            <Input id="requiredCerts" data-testid="schedule-add-game-certs-input" value={requiredCerts} onChange={(e) => setRequiredCerts(e.target.value)} className="col-span-3 bg-white border-slate-300" placeholder="e.g., State, Certified (comma-sep)" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" data-testid="schedule-add-game-cancel-button" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" data-testid="schedule-add-game-save-button" onClick={handleSubmit} className="basketball-gradient hover:opacity-90">Schedule Game</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGameDialog;