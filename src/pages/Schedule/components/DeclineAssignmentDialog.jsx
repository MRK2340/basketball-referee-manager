import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const DeclineAssignmentDialog = ({ open, setOpen, assignment, onDecline }) => {
  const [reason, setReason] = useState('');

  const handleDecline = () => {
    if (!reason.trim()) {
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
      <DialogContent
        className="sm:max-w-[420px] bg-white border-slate-200"
        data-testid="decline-assignment-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-900">Decline Assignment</DialogTitle>
          <DialogDescription className="text-slate-600">
            Please provide a reason for declining this game assignment. The manager will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="py-3 space-y-2">
          <Label htmlFor="decline-reason" className="text-slate-800 font-medium">Reason</Label>
          <Input
            id="decline-reason"
            data-testid="decline-assignment-reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="bg-white border-slate-300 text-slate-900 placeholder-slate-400"
            placeholder="e.g., Prior commitment, schedule conflict…"
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-testid="decline-assignment-cancel-button"
            onClick={() => setOpen(false)}
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-testid="decline-assignment-confirm-button"
            onClick={handleDecline}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Decline Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeclineAssignmentDialog;
