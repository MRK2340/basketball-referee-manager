/**
 * useRealtimeMessages.js
 *
 * Attaches a Firestore onSnapshot listener to the current user's messages.
 * - Keeps the messages list in real-time (inbox updates without a page refresh)
 * - Shows an in-app toast for each NEW incoming message (not sent by this user)
 * - Uses a ref for usersMap so the listener never re-subscribes on re-renders
 * - Uses an indexed query (orderBy) with automatic fallback to client-side sort
 *   while the composite index is still building.
 */
import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
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

    // Preferred query: Firestore-side sort (requires composite index).
    const indexedQ = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    // Fallback query: used while the composite index is still building.
    const fallbackQ = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      limit(100)
    );

    let unsubscribe;

    const handleSnapshot = (snapshot, useFallbackSort = false) => {
      let allMessages = snapshot.docs
        .map(d => mapRawMessage(d.id, d.data(), usersMapRef.current, user.id));
      if (useFallbackSort) {
        allMessages = allMessages.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      }

      setMessages(allMessages);

      if (!isInitialized.current) {
        allMessages.forEach(m => knownIds.current.add(m.id));
        isInitialized.current = true;
        return;
      }

      allMessages.forEach(m => {
        if (!knownIds.current.has(m.id) && m.sender_id !== user.id) {
          knownIds.current.add(m.id);
          toast({
            title: `New message from ${m.from}`,
            description: m.subject,
            duration: 5000,
          });
        } else {
          knownIds.current.add(m.id);
        }
      });
    };

    const subscribe = (q, useFallbackSort = false) => {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => handleSnapshot(snapshot, useFallbackSort),
        (err) => {
          if (!useFallbackSort && err.message?.includes('requires an index')) {
            // Index still building — silently switch to fallback query
            unsubscribe?.();
            subscribe(fallbackQ, true);
          } else {
            console.error('[useRealtimeMessages] Listener error:', err);
          }
        }
      );
    };

    subscribe(indexedQ, false);

    return () => {
      unsubscribe?.();
      isInitialized.current = false;
      knownIds.current = new Set();
    };
  }, [user?.id, setMessages]);
};
