/**
 * useSyncStatus.ts
 * Monitors Firestore snapshot metadata to track pending (offline) writes
 * and notifies the user when queued changes sync or when server-side
 * updates arrive that may have overwritten local edits (conflict).
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import type { AppUser } from '@/lib/types';

export interface SyncState {
  /** Number of pending (un-acked) local writes */
  pendingWrites: number;
  /** Whether we just synced offline changes */
  justSynced: boolean;
  /** Whether a server-side change was detected (possible conflict) */
  conflictDetected: boolean;
  /** Dismiss the conflict banner */
  dismissConflict: () => void;
}

/**
 * Tracks Firestore metadata on key collections to detect:
 * 1. hasPendingWrites: true → user wrote while offline → queued
 * 2. hasPendingWrites: false after true → offline writes committed → notify user
 * 3. fromCache: false + !hasPendingWrites + doc changed → server update (possible conflict)
 */
export const useSyncStatus = (user: AppUser | null): SyncState => {
  const [pendingWrites, setPendingWrites] = useState(0);
  const [justSynced, setJustSynced] = useState(false);
  const [conflictDetected, setConflictDetected] = useState(false);

  const prevPendingRef = useRef(false);
  // Last-seen content per doc (JSON), keyed by collection-prefixed id.
  // Assignments/tournaments carry no updated_at field, so conflict detection
  // compares content: the local cache already reflects our own optimistic
  // writes, so our own server acks compare equal — only changes made by
  // ANOTHER session actually differ from what we last saw.
  const docContentsRef = useRef(new Map<string, string>());

  const dismissConflict = useCallback(() => setConflictDetected(false), []);

  useEffect(() => {
    if (!user?.id) return;

    const unsubs: Unsubscribe[] = [];

    // Monitor game_assignments for the current user (most conflict-prone collection)
    const assignQ = user.role === 'manager'
      ? query(collection(db, 'game_assignments'), where('manager_id', '==', user.id))
      : query(collection(db, 'game_assignments'), where('referee_id', '==', user.id));

    unsubs.push(
      onSnapshot(assignQ, { includeMetadataChanges: true }, (snapshot) => {
        const hasPending = snapshot.metadata.hasPendingWrites;
        const fromCache = snapshot.metadata.fromCache;

        // Count pending docs
        let pending = 0;
        snapshot.docs.forEach(d => {
          if (d.metadata.hasPendingWrites) pending++;
        });
        setPendingWrites(pending);

        // Detect sync completion: was pending → now committed
        if (prevPendingRef.current && !hasPending && !fromCache) {
          setJustSynced(true);
          toast({
            title: 'Changes synced',
            description: 'Your offline changes have been saved to the server.',
            duration: 3000,
          });
          setTimeout(() => setJustSynced(false), 3000);
        }

        // Detect server-side update while user was offline
        // (fromCache=false, no pending writes, and doc content changed
        // relative to what this session last saw — own-write acks match the
        // optimistic cache content and are NOT flagged)
        if (!fromCache && !hasPending) {
          let serverChanged = false;
          snapshot.docChanges().forEach(change => {
            if (change.type === 'modified') {
              const prevContent = docContentsRef.current.get(`a:${change.doc.id}`);
              const newContent = JSON.stringify(change.doc.data());
              if (prevContent !== undefined && newContent !== prevContent) {
                serverChanged = true;
              }
            }
          });
          if (serverChanged && prevPendingRef.current) {
            setConflictDetected(true);
            toast({
              title: 'Data updated by another session',
              description: 'Some records were modified while you were offline. Your latest view reflects the current server state.',
              variant: 'destructive',
              duration: 8000,
            });
          }
        }

        // Track content for conflict detection (includes optimistic writes,
        // so this session's own changes never read as foreign)
        snapshot.docs.forEach(d => {
          docContentsRef.current.set(`a:${d.id}`, JSON.stringify(d.data()));
        });

        prevPendingRef.current = hasPending;
      })
    );

    // Also monitor tournaments for managers (editing tournaments offline is risky)
    if (user.role === 'manager') {
      const tournQ = query(collection(db, 'tournaments'), where('manager_id', '==', user.id));
      unsubs.push(
        onSnapshot(tournQ, { includeMetadataChanges: true }, (snapshot) => {
          if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
            snapshot.docChanges().forEach(change => {
              if (change.type === 'modified') {
                const prev = docContentsRef.current.get(`t:${change.doc.id}`);
                const curr = JSON.stringify(change.doc.data());
                // Content comparison: this session's own edit acks match the
                // optimistic cache and stay silent
                if (prev !== undefined && curr !== prev) {
                  toast({
                    title: 'Tournament updated',
                    description: `"${change.doc.data()?.name || 'A tournament'}" was updated from another session.`,
                    duration: 5000,
                  });
                }
              }
            });
          }
          snapshot.docs.forEach(d => {
            docContentsRef.current.set(`t:${d.id}`, JSON.stringify(d.data()));
          });
        })
      );
    }

    return () => {
      unsubs.forEach(u => u());
      docContentsRef.current.clear();
    };
  }, [user?.id, user?.role]);

  return { pendingWrites, justSynced, conflictDetected, dismissConflict };
};
