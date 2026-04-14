import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import {
  addTournament as addTournamentRecord,
  updateTournamentRecord,
  deleteTournamentRecord,
  archiveTournamentRecord,
} from '@/lib/firestoreService';

export const useTournamentActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const addTournament = async (tournamentData: Record<string, unknown>) => {
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

  const updateTournament = async (tournamentId: string, tournamentData: Record<string, unknown>) => {
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

  const deleteTournament = async (tournamentId: string) => {
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

  const archiveTournament = async (tournamentId: string, archived: boolean) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await archiveTournamentRecord(user, tournamentId, archived);

    if (error) {
      toast({
        title: archived ? "Error archiving tournament" : "Error restoring tournament",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: archived ? "Tournament Archived" : "Tournament Restored",
        description: archived
          ? "The tournament has been moved to archives."
          : "The tournament has been restored to active.",
      });
      fetchData(false);
    }
  };

  return { addTournament, updateTournament, deleteTournament, archiveTournament };
};