import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';

export const useMessageActions = (user, fetchData) => {
  const sendMessage = async (messageData) => {
    if (!user) return;

    let recipientId = messageData.recipientId;

    if (!recipientId) {
      const { data: managers, error: managerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'manager')
        .limit(1);

      if (managerError || !managers || managers.length === 0) {
        toast({
          title: "Error sending message",
          description: "Could not find a league manager to send the message to.",
          variant: "destructive",
        });
        return;
      }
      recipientId = managers[0].id;
    }

    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        recipient_id: recipientId,
        subject: messageData.subject,
        content: messageData.content,
        is_read: false,
      },
    ]);

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: 'Message Sent! ✉️',
        description: 'Your message has been sent successfully.',
      });
      fetchData();
    }
  };

  const markMessageAsRead = async (messageId) => {
    if (!user) return;
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('recipient_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Could not mark message as read.',
        variant: 'destructive',
      });
    } else {
      fetchData();
    }
  };

  return { sendMessage, markMessageAsRead };
};