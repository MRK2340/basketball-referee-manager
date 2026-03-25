import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar as DayPickerCalendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';

const AvailabilityDialog = ({ isOpen, onOpenChange, addAvailability }) => {
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

  const handleSave = () => {
    if (dateRange?.from) {
      const toDate = dateRange.to || dateRange.from;
      addAvailability(dateRange.from, toDate);
      onOpenChange(false);
      setDateRange({ from: undefined, to: undefined });
    } else {
      toast({
        title: "No date selected",
        description: "Please select a date or date range.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Set Your Availability</DialogTitle>
          <DialogDescription className="text-slate-400">
            Select a date or a range of dates you are available to referee.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <DayPickerCalendar
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            className="rounded-md border bg-slate-800 border-slate-700"
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} className="basketball-gradient hover:opacity-90">
            Save Availability
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityDialog;