import { toast } from '@/components/ui/use-toast';
import {
  addTournament as addTournamentRecord,
  updateTournamentRecord,
  deleteTournamentRecord,
} from '@/lib/firestoreService';

export const useTournamentActions = (user, fetchData) => {
  const addTournament = async (tournamentData) => {
    if (!user) return;
    const { error } = await addTournamentRecord(user, tournamentData);

    if (error) {
      toast({
        title: "Error adding tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tournament Added",
        description: "The new tournament has been created successfully.",
      });
      fetchData(false);
    }
  };

  const updateTournament = async (tournamentId, tournamentData) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await updateTournamentRecord(user, tournamentId, tournamentData);

    if (error) {
      toast({
        title: "Error updating tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tournament Updated",
        description: "The tournament details have been saved.",
      });
      fetchData(false);
    }
  };

  const deleteTournament = async (tournamentId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await deleteTournamentRecord(user, tournamentId);

    if (error) {
      toast({
        title: "Error deleting tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tournament Deleted",
        description: "The tournament and all related games have been removed.",
        variant: "destructive",
      });
      fetchData(false);
    }
  };

  return { addTournament, updateTournament, deleteTournament };
};