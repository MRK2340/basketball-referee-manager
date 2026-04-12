/**
 * useRealtimeNotifications.js
 *
 * Attaches a Firestore onSnapshot listener to the current user's notifications.
 * - Keeps the notifications array in real-time (bell badge updates immediately)
 * - Shows an in-app toast for each NEW notification that arrives after login
 * - Uses an indexed query (orderBy) with automatic fallback to client-side sort
 *   while the composite index is still building.
 */
import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toISOString } from '@/lib/firestoreService';
import { toast } from '@/components/ui/use-toast';

const TYPE_LABELS = {
  assignment:   'Game Assignment',
  message:      'New Message',
  payment:      'Payment Update',
  game_request: 'Game Request',
  report:       'Report Update',
};

export const useRealtimeNotifications = (user, setNotifications) => {
  const isInitialized = useRef(false);
  const knownIds = useRef(new Set());

  useEffect(() => {
    if (!user?.id) {
      isInitialized.current = false;
      knownIds.current = new Set();
      return;
    }

    // Preferred query: Firestore-side sort (requires composite index).
    const indexedQ = query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    // Fallback query: used while the composite index is still building.
    const fallbackQ = query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      limit(100)
    );

    let unsubscribe;

    const handleSnapshot = (snapshot, useFallbackSort = false) => {
      let allNotifs = snapshot.docs.map(d => {
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
          toast({
            title: TYPE_LABELS[n.type] || 'Notification',
            description: n.body || n.title || 'You have a new notification.',
            duration: 5000,
          });
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
            console.error('[useRealtimeNotifications] Listener error:', err);
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
