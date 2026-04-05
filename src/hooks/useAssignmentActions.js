import { toast } from '@/components/ui/use-toast';
import {
  assignCourtSchedule,
  assignReferee,
  requestAssignment,
  unassignReferee,
  updateAssignment,
} from '@/lib/demoDataService';

export const useAssignmentActions = (user, fetchData) => {
  const assignRefereeToGame = (gameId, refereeId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = assignReferee(user, gameId, refereeId);
    if (error) {
        toast({ title: "Assignment Failed", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Referee Assigned! ✅", description: "The referee has been assigned to the game." });
        fetchData(false);
    }
  };

  const unassignRefereeFromGame = (assignmentId) => {
      if (!user || user.role !== 'manager') return;
      const { error } = unassignReferee(user, assignmentId);
      if (error) {
          toast({ title: "Unassignment Failed", description: error.message, variant: "destructive" });
      } else {
          toast({ title: "Referee Unassigned", description: "The referee has been removed from the game." });
          fetchData(false);
      }
  };

  const updateAssignmentStatus = (assignmentId, status, reason = null) => {
    if (!user || user.role !== 'referee') return;
    const { error } = updateAssignment(user, assignmentId, status, reason);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Assignment Updated!", description: `You have ${status} the game.` });

      fetchData(false);
    }
  };

  const assignRefereesToCourt = (assignments) => {
    if (!user || user.role !== 'manager') return;

    const { error } = assignCourtSchedule(user, assignments);

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

  const requestGameAssignment = (gameId) => {
    if (!user || user.role !== 'referee') return;

    const { error } = requestAssignment(user, gameId);

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


  return { assignRefereeToGame, unassignRefereeFromGame, updateAssignmentStatus, assignRefereesToCourt, requestGameAssignment };
};