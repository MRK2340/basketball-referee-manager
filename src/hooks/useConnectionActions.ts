import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import {
  requestManagerConnectionRecord,
  respondToConnectionRecord,
  withdrawConnectionRecord,
} from '@/lib/firestoreService';

export const useConnectionActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const requestManagerConnection = async (managerId: string, note: string) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await requestManagerConnectionRecord(user, managerId, note);
    if (error) {
      toast({ title: 'Request failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request sent!', description: 'Your roster request has been sent to the manager.' });
      fetchData(false);
    }
  };

  const respondToConnection = async (connectionId: string, status: string) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await respondToConnectionRecord(user, connectionId, status);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      const label = status === 'connected' ? 'accepted' : 'declined';
      toast({ title: `Request ${label}`, description: `Referee roster request has been ${label}.` });
      fetchData(false);
    }
  };

  const withdrawConnection = async (managerId: string) => {
    if (!user || user.role !== 'referee') return;
    const { error } = await withdrawConnectionRecord(user, managerId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Request withdrawn', description: 'Your connection request has been withdrawn.' });
      fetchData(false);
    }
  };

  return { requestManagerConnection, respondToConnection, withdrawConnection };
};
