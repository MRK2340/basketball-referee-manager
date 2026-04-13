import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import {
  assignCourtSchedule,
  assignReferee,
  requestAssignment,
  unassignReferee,
  updateAssignment,
  batchUnassignRefereesRecord,
  writeAuditLog,
} from '@/lib/firestoreService';
import { guardAction } from '@/lib/rateLimit';

export const useAssignmentActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const assignRefereeToGame = guardAction('assignReferee', async (gameId: string, refereeId: string) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await assignReferee(user, gameId, refereeId);
    if (error) {
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Referee Assigned", description: "The referee has been assigned to the game." });
        writeAuditLog(user.id, 'assign_referee', `game:${gameId}`, `referee:${refereeId}`);
        fetchData(false);
    }
  });

  const unassignRefereeFromGame = async (assignmentId: string) => {
      if (!user || user.role !== 'manager') return;
      const { error } = await unassignReferee(user, assignmentId);
      if (error) {
          toast({ title: "Unassignment Failed", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Referee Unassigned", description: "The referee has been removed from the game." });
          fetchData(false);
      }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string, reason: string | null = null) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await updateAssignment(user, assignmentId, status, reason);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated!", description: `You have ${status} the game.` });
      fetchData(false);
    }
  };

  const assignRefereesToCourt = async (assignments: {gameId: string; refereeId: string}[]) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await assignCourtSchedule(user, assignments);
    if (error) {
      toast({ title: 'Court Assignment Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Court Schedule Saved', description: 'Referees have been assigned to the court schedule.' });
      fetchData(false);
    }
  };

  const requestGameAssignment = guardAction('requestAssignment', async (gameId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await requestAssignment(user, gameId);
    if (error) {
      if ((error as { code?: string }).code === '23505') {
        toast({ title: "Already Requested", description: "You have already requested to officiate this game.", variant: "default" });
      } else {
        toast({ title: "Request Failed", description: error.message, variant: "destructive" });
      }
      return;
    }
    toast({ title: "Request Sent", description: "Your request to officiate this game has been sent to the manager." });
    fetchData(false);
  });

  const batchUnassignReferees = async (gameIds: string[]) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await batchUnassignRefereesRecord(user, gameIds);
    if (error) {
      toast({ title: 'Batch unassign failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Referees Unassigned', description: `Removed all referee assignments from ${gameIds.length} game(s).` });
      fetchData(false);
    }
  };

  return { assignRefereeToGame, unassignRefereeFromGame, updateAssignmentStatus, assignRefereesToCourt, requestGameAssignment, batchUnassignReferees };
};
