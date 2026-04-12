import { toast } from '@/components/ui/use-toast';
import { addGameRecord, markGameCompleted } from '@/lib/firestoreService';

export const useGameActions = (user, fetchData) => {
  const addGame = async (gameData) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await addGameRecord(user, gameData);

    if (error) {
      toast({
        title: 'Error Scheduling Game',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Game Scheduled',
        description: 'The new game has been added to the schedule.',
      });
      fetchData(false);
    }
  };

  const markGameAsCompleted = async (gameId) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await markGameCompleted(user, gameId);
    if (error) {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Game Completed", description: "The game has been marked as complete and payments are pending." });
      fetchData(false);
    }
  };

  return { addGame, markGameAsCompleted };
};