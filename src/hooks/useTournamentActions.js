import { toast } from '@/components/ui/use-toast';
import {
  addTournament as addTournamentRecord,
  updateTournamentRecord,
} from '@/lib/demoDataService';

export const useTournamentActions = (user, fetchData) => {
  const addTournament = async (tournamentData) => {
    if (!user) return;
    const { error } = addTournamentRecord(user, tournamentData);

    if (error) {
      toast({
        title: "Error adding tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tournament Added! 🏆",
        description: "The new tournament has been created successfully.",
      });
      fetchData();
    }
  };

  const updateTournament = async (tournamentId, tournamentData) => {
    if (!user || user.role !== 'manager') return;
    const { error } = updateTournamentRecord(user, tournamentId, tournamentData);

    if (error) {
      toast({
        title: "Error updating tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Tournament Updated! 📝",
        description: "The tournament details have been saved.",
      });
      fetchData();
    }
  };

  return { addTournament, updateTournament };
};