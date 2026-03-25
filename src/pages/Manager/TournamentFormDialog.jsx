import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const TournamentFormDialog = ({ open, setOpen, tournament, onSubmit }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [numberOfCourts, setNumberOfCourts] = useState('');
  const [date, setDate] = useState({ from: undefined, to: undefined });

  const isEditMode = !!tournament;

  useEffect(() => {
    if (isEditMode && tournament) {
      setName(tournament.name);
      setLocation(tournament.location);
      setNumberOfCourts(String(tournament.numberOfCourts || ''));
      setDate({
        from: new Date(tournament.startDate),
        to: new Date(tournament.endDate),
      });
    } else {
      setName('');
      setLocation('');
      setNumberOfCourts('');
      setDate({ from: undefined, to: undefined });
    }
  }, [tournament, isEditMode, open]);

  const handleSubmit = async () => {
    if (!name || !location || !date.from || !date.to || !numberOfCourts) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
    await onSubmit({
      name,
      location,
      startDate: format(date.from, 'yyyy-MM-dd'),
      endDate: format(date.to, 'yyyy-MM-dd'),
      numberOfCourts: parseInt(numberOfCourts, 10),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Tournament' : 'Add New Tournament'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this tournament.' : 'Fill in the details for the new tournament.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-slate-300">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right text-slate-300">Location</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="courts" className="text-right text-slate-300">Courts</Label>
            <Input id="courts" type="number" value={numberOfCourts} onChange={(e) => setNumberOfCourts(e.target.value)} className="col-span-3 bg-slate-800 border-slate-600" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right text-slate-300">Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("col-span-3 justify-start text-left font-normal bg-slate-800 border-slate-600 hover:bg-slate-700", !date.from && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-slate-800 border-slate-700" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  className="text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} className="basketball-gradient hover:opacity-90">
            {isEditMode ? 'Save Changes' : 'Save Tournament'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentFormDialog;