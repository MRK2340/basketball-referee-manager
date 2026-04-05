import { toast } from '@/components/ui/use-toast';
import {
  addExternalGameRecord,
  updateExternalGameRecord,
  deleteExternalGameRecord,
} from '@/lib/demoDataService';

export const useExternalGameActions = (user, fetchData) => {
  const addExternalGame = (gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = addExternalGameRecord(user, gameData);
    if (error) {
      toast({ title: 'Failed to log game', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game logged!', description: 'Your external game has been saved.' });
      fetchData();
    }
  };

  const updateExternalGame = (gameId, gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = updateExternalGameRecord(user, gameId, gameData);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game updated', description: 'Your changes have been saved.' });
      fetchData();
    }
  };

  const deleteExternalGame = (gameId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = deleteExternalGameRecord(user, gameId);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game removed', description: 'The external game entry has been deleted.' });
      fetchData();
    }
  };

  return { addExternalGame, updateExternalGame, deleteExternalGame };
};
