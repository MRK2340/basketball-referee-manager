import { toast } from '@/components/ui/use-toast';
import {
  assignCourtSchedule,
  assignReferee,
  requestAssignment,
  unassignReferee,
  updateAssignment,
  batchUnassignRefereesRecord,
} from '@/lib/firestoreService';

export const useAssignmentActions = (user, fetchData) => {
  const assignRefereeToGame = async (gameId, refereeId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await assignReferee(user, gameId, refereeId);
    if (error) {
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Referee Assigned! ✅", description: "The referee has been assigned to the game." });
        fetchData(false);
    }
  };

  const unassignRefereeFromGame = async (assignmentId) => {
      if (!user || user.role !== 'manager') return;
      const { error } = await unassignReferee(user, assignmentId);
      if (error) {
          toast({ title: "Unassignment Failed", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Referee Unassigned", description: "The referee has been removed from the game." });
          fetchData(false);
      }
  };

  const updateAssignmentStatus = async (assignmentId, status, reason = null) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await updateAssignment(user, assignmentId, status, reason);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated!", description: `You have ${status} the game.` });

      fetchData(false);
    }
  };

  const assignRefereesToCourt = async (assignments) => {
    if (!user || user.role !== 'manager') return;

    const { error } = await assignCourtSchedule(user, assignments);

    if (error) {
      toast({
        title: 'Court Assignment Failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Court Schedule Saved! 🏀',
        description: 'Referees have been assigned to the court schedule.',
      });
      fetchData(false);
    }
  };

  const requestGameAssignment = async (gameId) => {
    if (!user || user.role !== 'referee') return;

    const { error } = await requestAssignment(user, gameId);

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Already Requested", description: "You have already requested to officiate this game.", variant: "default" });
      } else {
        toast({
          title: "Request Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Request Sent! 👍",
      description: "Your request to officiate this game has been sent to the manager.",
    });

    fetchData(false);
  };


  const batchUnassignReferees = async (gameIds) => {
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