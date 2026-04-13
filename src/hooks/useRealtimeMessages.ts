/**
 * useRealtimeMessages.ts
 * Attaches a Firestore onSnapshot listener to the current user's messages.
 */
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, type QuerySnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toISOString } from '@/lib/timestampUtils';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import type { AppUser } from '@/lib/types';
import type { MappedMessage, MappedProfile } from '@/lib/mappers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Doc = Record<string, any>;

const mapRawMessage = (id: string, data: Doc, usersMap: Record<string, MappedProfile>, currentUserId: string): MappedMessage => {
  const sender = usersMap[data.sender_id] || { name: 'System', avatarUrl: '' };
  const isMine = data.sender_id === currentUserId;
  return {
    id,
    from: sender.name,
    fromAvatar: sender.avatarUrl || '',
    subject: data.subject,
    content: data.content,
    timestamp: toISOString(data.created_at),
    read: data.is_read || isMine,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
  };
};

export const useRealtimeMessages = (
  user: AppUser | null,
  setMessages: Dispatch<SetStateAction<MappedMessage[]>>,
  usersMap: Record<string, MappedProfile>,
) => {
  const isInitialized = useRef(false);
  const knownIds = useRef(new Set<string>());
  const usersMapRef = useRef(usersMap);
  useEffect(() => { usersMapRef.current = usersMap; }, [usersMap]);

  useEffect(() => {
    if (!user?.id) {
      isInitialized.current = false;
      knownIds.current = new Set();
      return;
    }

    const indexedQ = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    const fallbackQ = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.id),
      limit(100)
    );

    let unsubscribe: Unsubscribe | undefined;

    const handleSnapshot = (snapshot: QuerySnapshot, useFallbackSort = false) => {
      let allMessages = snapshot.docs
        .map(d => mapRawMessage(d.id, d.data(), usersMapRef.current, user.id));
      if (useFallbackSort) {
        allMessages = allMessages.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      }

      setMessages(allMessages);

      if (!isInitialized.current) {
        allMessages.forEach(m => knownIds.current.add(m.id));
        isInitialized.current = true;
        return;
      }

      allMessages.forEach(m => {
        if (!knownIds.current.has(m.id) && m.senderId !== user.id) {
          knownIds.current.add(m.id);
          toast({ title: `New message from ${m.from}`, description: m.subject, duration: 5000 });
        } else {
          knownIds.current.add(m.id);
        }
      });
    };

    const subscribe = (q: ReturnType<typeof query>, useFallbackSort = false) => {
      unsubscribe = onSnapshot(
        q,
        (snapshot) => handleSnapshot(snapshot, useFallbackSort),
        (err) => {
          if (!useFallbackSort && err.message?.includes('requires an index')) {
            unsubscribe?.();
            subscribe(fallbackQ, true);
          } else {
            logger.error('[useRealtimeMessages] Listener error:', err);
            toast({ title: 'Message sync lost', description: 'Live updates paused. Refresh the page to reconnect.', variant: 'destructive', duration: 10000 });
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
