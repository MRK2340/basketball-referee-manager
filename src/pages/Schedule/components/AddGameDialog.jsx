import React, { useState, useEffect } from 'react';
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
  const { tournaments, addGame } = useData();
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

  useEffect(() => {
    if (!open) {
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
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!tournamentId || !homeTeam || !awayTeam || !date || !time || !venue || !division || !payment || !level) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all fields to schedule a game.',
        variant: 'destructive',
      });
      return;
    }
    await addGame({
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
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Schedule New Game</DialogTitle>
          <DialogDescription>Fill in the details for the new game.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tournament" className="text-right text-slate-300">Tournament</Label>
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
            <Label htmlFor="homeTeam" className="text-right text-slate-300">Home Team</Label>
            <Input id="homeTeam" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="awayTeam" className="text-right text-slate-300">Away Team</Label>
            <Input id="awayTeam" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right text-slate-300">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="text-white" />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right text-slate-300">Time</Label>
            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="venue" className="text-right text-slate-300">Venue</Label>
            <Input id="venue" value={venue} onChange={(e) => setVenue(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="division" className="text-right text-slate-300">Division</Label>
            <Input id="division" value={division} onChange={(e) => setDivision(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" placeholder="e.g., U14 Boys" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="payment" className="text-right text-slate-300">Payment ($)</Label>
            <Input id="payment" type="number" value={payment} onChange={(e) => setPayment(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="level" className="text-right text-slate-300">Game Level</Label>
            <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" placeholder="e.g., Varsity, JV" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="requiredCerts" className="text-right text-slate-300">Certs</Label>
            <Input id="requiredCerts" value={requiredCerts} onChange={(e) => setRequiredCerts(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" placeholder="e.g., State, Certified (comma-sep)" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} className="basketball-gradient hover:opacity-90">Schedule Game</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddGameDialog;