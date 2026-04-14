import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudOff, CheckCircle, AlertTriangle, X } from 'lucide-react';
import type { SyncState } from '@/hooks/useSyncStatus';

interface SyncStatusIndicatorProps {
  syncState: SyncState;
}

export const SyncStatusIndicator = ({ syncState }: SyncStatusIndicatorProps) => {
  const { pendingWrites, justSynced, conflictDetected, dismissConflict } = syncState;

  return (
    <AnimatePresence>
      {/* Pending writes indicator — shows when offline writes are queued */}
      {pendingWrites > 0 && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center gap-2 bg-amber-600 text-white text-sm font-medium py-1.5 px-4"
          data-testid="sync-pending-indicator"
        >
          <CloudOff className="h-3.5 w-3.5" />
          {pendingWrites} pending change{pendingWrites > 1 ? 's' : ''} — will sync when online
        </motion.div>
      )}

      {/* Sync success indicator — briefly shows after offline changes commit */}
      {justSynced && pendingWrites === 0 && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium py-1.5 px-4"
          data-testid="sync-success-indicator"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          All changes synced
        </motion.div>
      )}

      {/* Conflict detection banner — shows when server data differs from local */}
      {conflictDetected && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-medium py-2 px-4"
          data-testid="sync-conflict-indicator"
        >
          <AlertTriangle className="h-4 w-4" />
          Data was modified by another session while you were offline — showing latest version
          <button
            onClick={dismissConflict}
            className="ml-3 p-0.5 rounded hover:bg-red-500 transition-colors"
            data-testid="dismiss-conflict-btn"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
