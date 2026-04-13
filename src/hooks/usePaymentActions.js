import { toast } from '@/components/ui/use-toast';
import { batchMarkPaymentsPaidRecord, rateRefereeRecord } from '@/lib/firestoreService';
import { guardAction } from '@/lib/rateLimit';

export const usePaymentActions = (user, fetchData) => {
  const batchMarkPaymentsPaid = guardAction('batchPayments', async (paymentIds) => {
    if (!user) return;
    try {
      await batchMarkPaymentsPaidRecord(user, paymentIds);
      toast({ title: 'Payments Updated', description: `${paymentIds.length} payment(s) marked as paid.` });
      await fetchData(false);
    } catch (e) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' });
    }
  });

  const rateReferee = async (gameId, refereeId, stars, feedback) => {
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
