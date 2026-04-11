import { toast } from '@/components/ui/use-toast';
import {
  addIndependentGameRecord,
  updateIndependentGameRecord,
  deleteIndependentGameRecord,
} from '@/lib/firestoreService';

export const useIndependentGameActions = (user, fetchData) => {
  const addIndependentGame = async (gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await addIndependentGameRecord(user, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game logged!', description: 'Independent game has been added to your log.' });
      fetchData(false);
    }
  };

  const updateIndependentGame = async (gameId, gameData) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await updateIndependentGameRecord(user, gameId, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game updated', description: 'Your independent game has been updated.' });
      fetchData(false);
    }
  };

  const deleteIndependentGame = async (gameId) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await deleteIndependentGameRecord(user, gameId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game removed', description: 'Independent game removed from your log.' });
      fetchData(false);
    }
  };

  return { addIndependentGame, updateIndependentGame, deleteIndependentGame };
};
