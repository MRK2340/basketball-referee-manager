import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

const AcceptConflictWarningDialog = ({ open, onOpenChange, conflictInfo, onAcceptAnyway }) => {
  const { status, conflicts } = conflictInfo || {};

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="accept-conflict-warning-dialog" className="bg-white border-slate-200">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-slate-900">
              {status === 'conflict' ? 'Schedule Conflict Detected' : 'Availability Issue'}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-slate-600 leading-relaxed">
            {status === 'conflict' && conflicts?.length > 0 ? (
              <>
                You are already assigned to{' '}
                <strong className="text-slate-900">
                  {conflicts[0].home_team} vs {conflicts[0].away_team}
                </strong>{' '}
                at the same time. Accepting both assignments may cause a conflict.
              </>
            ) : status === 'unavailable' ? (
              'You have marked yourself as unavailable during this time slot. Are you sure you want to accept this assignment?'
            ) : (
              'There may be a scheduling issue with this assignment. Do you still want to accept it?'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            data-testid="accept-conflict-cancel-button"
            className="border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="accept-conflict-anyway-button"
            onClick={onAcceptAnyway}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Accept Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AcceptConflictWarningDialog;
