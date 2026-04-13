import type { AppUser } from '@/lib/types';
import { toast } from '@/components/ui/use-toast';
import { markMessageRead, sendMessageRecord } from '@/lib/firestoreService';
import { guardAction } from '@/lib/rateLimit';

export const useMessageActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const sendMessage = guardAction('sendMessage', async (messageData: Record<string, unknown>) => {
    if (!user) return;
    const { error } = await sendMessageRecord(user, messageData);

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: 'Message Sent',
        description: 'Your message has been sent successfully.',
      });
      fetchData(false);
    }
  });

  const markMessageAsRead = async (messageId: string) => {
    if (!user) return;
    const { error } = await markMessageRead(user, messageId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not mark message as read.',
        variant: 'destructive',
      });
    }
    // P1 fix: no fetchData call — realtime listener handles the update
  };

  return { sendMessage, markMessageAsRead };
};