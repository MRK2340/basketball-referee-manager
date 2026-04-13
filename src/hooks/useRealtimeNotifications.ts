/**
 * useRealtimeNotifications.ts
 * Attaches a Firestore onSnapshot listener to the current user's notifications.
 */
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, type QuerySnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toISOString } from '@/lib/timestampUtils';
import { logger } from '@/lib/logger';
import { toast } from '@/components/ui/use-toast';
import type { AppUser } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Notification = Record<string, any>;

const TYPE_LABELS: Record<string, string> = {
  assignment:   'Game Assignment',
  message:      'New Message',
  payment:      'Payment Update',
  game_request: 'Game Request',
  report:       'Report Update',
};

export const useRealtimeNotifications = (
  user: AppUser | null,
  setNotifications: Dispatch<SetStateAction<Notification[]>>,
) => {
  const isInitialized = useRef(false);
  const knownIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user?.id) {
      isInitialized.current = false;
      knownIds.current = new Set();
      return;
    }

    const indexedQ = query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    const fallbackQ = query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      limit(100)
    );

    let unsubscribe: Unsubscribe | undefined;

    const handleSnapshot = (snapshot: QuerySnapshot, useFallbackSort = false) => {
      let allNotifs: Notification[] = snapshot.docs.map(d => {
        const data = d.data();
        return { id: d.id, ...data, created_at: toISOString(data.created_at) };
      });
      if (useFallbackSort) {
        allNotifs = allNotifs.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      }

      setNotifications(allNotifs);

      if (!isInitialized.current) {
        allNotifs.forEach(n => knownIds.current.add(n.id));
        isInitialized.current = true;
        return;
      }

      allNotifs.forEach(n => {
        if (!knownIds.current.has(n.id)) {
          knownIds.current.add(n.id);
          toast({ title: TYPE_LABELS[n.type] || 'Notification', description: n.body || n.title || 'You have a new notification.', duration: 5000 });
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
            logger.error('[useRealtimeNotifications] Listener error:', err);
            toast({ title: 'Notification sync lost', description: 'Live updates paused. Refresh the page to reconnect.', variant: 'destructive', duration: 10000 });
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
  }, [user?.id, setNotifications]);
};
