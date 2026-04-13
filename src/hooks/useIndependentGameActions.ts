import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import {
  addIndependentGameRecord,
  updateIndependentGameRecord,
  deleteIndependentGameRecord,
} from '@/lib/firestoreService';

export const useIndependentGameActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const addIndependentGame = async (gameData: Record<string, unknown>) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await addIndependentGameRecord(user, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game logged!', description: 'Independent game has been added to your log.' });
      fetchData(false);
    }
  };

  const updateIndependentGame = async (gameId: string, gameData: Record<string, unknown>) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await updateIndependentGameRecord(user, gameId, gameData);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Game updated', description: 'Your independent game has been updated.' });
      fetchData(false);
    }
  };

  const deleteIndependentGame = async (gameId: string) => {
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
