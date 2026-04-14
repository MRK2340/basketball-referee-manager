import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, DatabaseZap } from 'lucide-react';
import { getPersistenceStatus, type PersistenceStatus } from '@/lib/firebase';

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [persistenceWarning, setPersistenceWarning] = useState<string | null>(null);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  // Check IndexedDB persistence status on mount
  useEffect(() => {
    getPersistenceStatus().then((status: PersistenceStatus) => {
      if (status === 'multi-tab') {
        setPersistenceWarning('Offline mode unavailable — another tab is open');
      } else if (status === 'unsupported') {
        setPersistenceWarning('Offline mode unavailable — browser not supported');
      } else if (status === 'error') {
        setPersistenceWarning('Offline mode failed to initialize');
      }
      // Auto-dismiss after 6 seconds
      if (status !== 'enabled') {
        setTimeout(() => setPersistenceWarning(null), 6000);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-medium py-2 px-4 shadow-lg"
          data-testid="offline-indicator"
        >
          <WifiOff className="h-4 w-4" />
          You're offline — changes will sync when reconnected
        </motion.div>
      )}
      {showReconnected && !isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-green-500 text-white text-sm font-medium py-2 px-4 shadow-lg"
          data-testid="online-indicator"
        >
          <Wifi className="h-4 w-4" />
          Back online — syncing changes
        </motion.div>
      )}
      {persistenceWarning && !isOffline && !showReconnected && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-slate-600 text-white text-sm font-medium py-2 px-4 shadow-lg"
          data-testid="persistence-warning"
        >
          <DatabaseZap className="h-4 w-4" />
          {persistenceWarning}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
