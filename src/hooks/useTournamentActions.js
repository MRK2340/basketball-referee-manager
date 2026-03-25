import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useTournamentActions = (user, fetchData) => {
  const addTournament = async (tournamentData) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tournaments')
      .insert([{
        name: tournamentData.name,
        start_date: tournamentData.startDate,
        end_date: tournamentData.endDate,
        location: tournamentData.location,
        number_of_courts: tournamentData.numberOfCourts,
        manager_id: user.id
      }])
      .select();

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
    const { error } = await supabase
      .from('tournaments')
      .update({
        name: tournamentData.name,
        start_date: tournamentData.startDate,
        end_date: tournamentData.endDate,
        location: tournamentData.location,
        number_of_courts: tournamentData.numberOfCourts,
      })
      .eq('id', tournamentId);

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