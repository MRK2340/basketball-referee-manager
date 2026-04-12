import { toast } from '@/components/ui/use-toast';
import { markMessageRead, sendMessageRecord } from '@/lib/firestoreService';

export const useMessageActions = (user, fetchData) => {
  const sendMessage = async (messageData) => {
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
      // Realtime listener will pick up the new message — only refetch for side effects
      fetchData(false);
    }
  };

  const markMessageAsRead = async (messageId) => {
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