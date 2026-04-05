import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

const PAYMENT_METHODS = ['Cash', 'Venmo', 'Zelle', 'Check', 'PayPal', 'Other'];

const emptyForm = () => ({
  home_team: '',
  away_team: '',
  date: null,
  game_time: '',
  venue: '',
  league_name: '',
  division: '',
  level: '',
  payment_amount: '',
  payment_method: 'Cash',
  payment_status: 'paid',
  notes: '',
});

const LogExternalGameDialog = ({ open, setOpen, existingGame = null }) => {
  const { addExternalGame, updateExternalGame } = useData();
  const isEdit = !!existingGame;

  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    if (open && isEdit && existingGame) {
      setForm({
        home_team: existingGame.homeTeam || '',
        away_team: existingGame.awayTeam || '',
        date: existingGame.date ? new Date(existingGame.date) : null,
        game_time: existingGame.time || '',
        venue: existingGame.venue || '',
        league_name: existingGame.leagueName || '',
        division: existingGame.division || '',
        level: existingGame.level || '',
        payment_amount: existingGame.payment != null ? String(existingGame.payment) : '',
        payment_method: existingGame.paymentMethod || 'Cash',
        payment_status: existingGame.paymentStatus || 'paid',
        notes: existingGame.notes || '',
      });
    } else if (open && !isEdit) {
      setForm(emptyForm());
    }
  }, [open, isEdit, existingGame]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = () => {
    if (!form.home_team || !form.away_team || !form.date) {
      toast({
        title: 'Missing information',
        description: 'Home team, away team, and date are required.',
        variant: 'destructive',
      });
      return;
    }
    const payload = {
      ...form,
      game_date: format(form.date, 'yyyy-MM-dd'),
      payment_amount: parseFloat(form.payment_amount) || 0,
    };
    if (isEdit) {
      updateExternalGame(existingGame.id, payload);
    } else {
      addExternalGame(payload);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); }}>
      <DialogContent className="sm:max-w-lg bg-white border-slate-200 text-slate-900">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit External Game' : 'Log External Game'}</DialogTitle>
          <DialogDescription className="text-slate-600">
            {isEdit
              ? 'Update the details for this game.'
              : 'Record a game you officiated outside of iWhistle.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Teams */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Home Team</Label>
            <Input value={form.home_team} onChange={set('home_team')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., Metro Eagles" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Away Team</Label>
            <Input value={form.away_team} onChange={set('away_team')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., Northside Lions" />
          </div>

          {/* Date */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn('col-span-3 justify-start text-left font-normal bg-white border-slate-300 hover:bg-slate-50', !form.date && 'text-muted-foreground')}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.date ? format(form.date, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-slate-200">
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={(d) => setForm((prev) => ({ ...prev, date: d }))}
                  initialFocus
                  className="text-slate-900"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Time</Label>
            <Input type="time" value={form.game_time} onChange={set('game_time')} className="col-span-3 bg-white border-slate-300" />
          </div>

          {/* Venue */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Venue</Label>
            <Input value={form.venue} onChange={set('venue')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., Riverside Gym" />
          </div>

          {/* League */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">League / Org</Label>
            <Input value={form.league_name} onChange={set('league_name')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., YMCA Rec League" />
          </div>

          {/* Division */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Division</Label>
            <Input value={form.division} onChange={set('division')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., U14 Boys" />
          </div>

          {/* Level */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Level</Label>
            <Input value={form.level} onChange={set('level')} className="col-span-3 bg-white border-slate-300" placeholder="e.g., Varsity, Rec" />
          </div>

          {/* Payment amount */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Pay ($)</Label>
            <Input type="number" min="0" step="0.01" value={form.payment_amount} onChange={set('payment_amount')} className="col-span-3 bg-white border-slate-300" placeholder="0.00" />
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Method</Label>
            <Select value={form.payment_method} onValueChange={(v) => setForm((prev) => ({ ...prev, payment_method: v }))}>
              <SelectTrigger className="col-span-3 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                {PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Payment status */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-700">Status</Label>
            <Select value={form.payment_status} onValueChange={(v) => setForm((prev) => ({ ...prev, payment_status: v }))}>
              <SelectTrigger className="col-span-3 bg-white border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right text-slate-700 pt-2">Notes</Label>
            <Textarea value={form.notes} onChange={set('notes')} className="col-span-3 bg-white border-slate-300 resize-none" rows={3} placeholder="Any notes about this game…" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="basketball-gradient hover:opacity-90 text-white" onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Log Game'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LogExternalGameDialog;
