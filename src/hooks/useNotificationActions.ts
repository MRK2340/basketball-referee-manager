import type { AppUser } from '@/lib/types';
import { markNotificationReadRecord, markAllNotificationsReadRecord } from '@/lib/firestoreService';
import { logger } from '@/lib/logger';

export const useNotificationActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const markNotificationRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await markNotificationReadRecord(user, notificationId);
      // P1 fix: no fetchData — realtime listener handles the update
    } catch (e) {
      logger.error('markNotificationRead error:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsReadRecord(user);
      // P1 fix: no fetchData — realtime listener handles the update
    } catch (e) {
      logger.error('markAllNotificationsRead error:', e);
    }
  };

  return { markNotificationRead, markAllNotificationsRead };
};
