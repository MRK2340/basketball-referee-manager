import { markNotificationReadRecord, markAllNotificationsReadRecord } from '@/lib/firestoreService';
import { logger } from '@/lib/logger';

export const useNotificationActions = (user, fetchData) => {
  const markNotificationRead = async (notificationId) => {
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
