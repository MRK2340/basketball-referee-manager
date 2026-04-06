/**
 * useRealtimeNotifications.js
 *
 * Attaches a Firestore onSnapshot listener to the current user's notifications.
 * - Keeps the notifications array in real-time (bell badge updates immediately)
 * - Shows an in-app toast for each NEW notification that arrives after login
 */
import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

    // orderBy('created_at', 'desc') pushes sorting to Firestore (requires composite index).
    // limit(100) caps memory/bandwidth for users with many notifications.
    // See: firestore.indexes.json — notifications composite index.
    const q = query(
      collection(db, 'notifications'),
      where('recipient_id', '==', user.id),
      orderBy('created_at', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Results arrive pre-sorted by Firestore (orderBy created_at desc)
        const allNotifs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }));

        // Always keep state fresh in real-time
        setNotifications(allNotifs);

        if (!isInitialized.current) {
          // First snapshot on login — record existing IDs, no toasts
          allNotifs.forEach(n => knownIds.current.add(n.id));
          isInitialized.current = true;
          return;
        }

        // Show a toast for each notification that wasn't there before
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
      },
      (err) => {
        console.error('[useRealtimeNotifications] Listener error:', err);
      }
    );

    return () => {
      unsubscribe();
      isInitialized.current = false;
      knownIds.current = new Set();
    };
  }, [user?.id, setNotifications]);
};
