import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const DeclineAssignmentDialog = ({ open, setOpen, assignment, onDecline }) => {
  const [reason, setReason] = useState('');

  const handleDecline = () => {
    if (!reason) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for declining.',
        variant: 'destructive',
      });
      return;
    }
    onDecline(assignment.id, 'declined', reason);
    setOpen(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Decline Assignment</DialogTitle>
          <DialogDescription>
            Please provide a reason for declining this game assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reason" className="text-slate-300">Reason</Label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-slate-800 border-slate-600"
            placeholder="e.g., Prior commitment"
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="button" onClick={handleDecline} variant="destructive">Decline Assignment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineAssignmentDialog;