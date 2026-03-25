import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useGameActions = (user, fetchData) => {
  const addGame = async (gameData) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await supabase.from('games').insert([gameData]);

    if (error) {
      toast({
        title: 'Error Scheduling Game',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Game Scheduled! 🏀',
        description: 'The new game has been added to the schedule.',
      });
      fetchData();
    }
  };

  const markGameAsCompleted = async (gameId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await supabase.rpc('mark_game_completed', { game_id_param: gameId });
    if (error) {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Game Completed! 🎉", description: "The game has been marked as complete and payments are pending." });
      fetchData();
    }
  };

  return { addGame, markGameAsCompleted };
};