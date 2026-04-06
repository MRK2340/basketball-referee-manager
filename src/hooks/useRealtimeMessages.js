/**
 * useRealtimeMessages.js
 *
 * Attaches a Firestore onSnapshot listener to the current user's messages.
 * - Keeps the messages list in real-time (inbox updates without a page refresh)
 * - Shows an in-app toast for each NEW incoming message (not sent by this user)
 * - Uses a ref for usersMap so the listener never re-subscribes on re-renders
 */
import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';

const mapRawMessage = (id, data, usersMap, currentUserId) => {
  const sender = usersMap[data.sender_id] || { name: 'System', avatar_url: null };
  const isMine = data.sender_id === currentUserId;
  return {
    id,
    from: sender.name,
    fromAvatar: sender.avatar_url,
    subject: data.subject,
    content: data.content,
    timestamp: data.created_at,
    created_at: data.created_at,
    // Sender already "read" their own message — prevents false unread badge count
    read: data.is_read || isMine,
    is_read: data.is_read || isMine,
    sender_id: data.sender_id,
    recipient_id: data.recipient_id,
  };
};

export const useRealtimeMessages = (user, setMessages, usersMap) => {
  const isInitialized = useRef(false);
  const knownIds = useRef(new Set());
  // Keep latest usersMap in a ref so the listener closure is always fresh
  // without needing to re-subscribe when the map changes.
  const usersMapRef = useRef(usersMap);
  useEffect(() => {
    usersMapRef.current = usersMap;
  });

  useEffect(() => {
    if (!user?.id) {
      isInitialized.current = false;
      knownIds.current = new Set();
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const allMessages = snapshot.docs
          .map(d => mapRawMessage(d.id, d.data(), usersMapRef.current, user.id))
          .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

        // Always keep state fresh
        setMessages(allMessages);

        if (!isInitialized.current) {
          // First snapshot on login — record existing IDs, no toasts
          allMessages.forEach(m => knownIds.current.add(m.id));
          isInitialized.current = true;
          return;
        }

        // Toast only for new messages the current user didn't send
        allMessages.forEach(m => {
          if (!knownIds.current.has(m.id) && m.sender_id !== user.id) {
            knownIds.current.add(m.id);
            toast({
              title: `New message from ${m.from}`,
              description: m.subject,
              duration: 5000,
            });
          } else {
            // Still track IDs for messages sent by this user (no toast)
            knownIds.current.add(m.id);
          }
        });
      },
      (err) => {
        console.error('[useRealtimeMessages] Listener error:', err);
      }
    );

    return () => {
      unsubscribe();
      isInitialized.current = false;
      knownIds.current = new Set();
    };
  }, [user?.id, setMessages]);
};
