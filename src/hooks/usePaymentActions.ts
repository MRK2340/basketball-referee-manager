import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { batchMarkPaymentsPaidRecord, rateRefereeRecord } from '@/lib/firestoreService';
import { guardAction } from '@/lib/rateLimit';

export const usePaymentActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const batchMarkPaymentsPaid = guardAction('batchPayments', async (paymentIds: string[]) => {
    if (!user) return;

    const { error } = await batchMarkPaymentsPaidRecord(user, paymentIds);
    if (error) {
      toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Payments Updated', description: `${paymentIds.length} payment(s) marked as paid.` });
    await fetchData(false);
  });

  const rateReferee = async (gameId: string, refereeId: string, stars: number, feedback: string) => {
    if (!user || user.role !== 'manager') return;
    const { error } = await rateRefereeRecord(user, gameId, refereeId, stars, feedback);
    if (error) {
      toast({ title: 'Rating failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rating submitted', description: `${stars}-star rating saved.` });
      fetchData(false);
    }
  };

  return { batchMarkPaymentsPaid, rateReferee };
};
