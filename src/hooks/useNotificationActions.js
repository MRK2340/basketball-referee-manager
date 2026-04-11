import { markNotificationReadRecord, markAllNotificationsReadRecord } from '@/lib/firestoreService';

export const useNotificationActions = (user, fetchData) => {
  const markNotificationRead = async (notificationId) => {
    if (!user) return;
    try {
      await markNotificationReadRecord(user, notificationId);
      await fetchData(false);
    } catch (e) {
      console.error('markNotificationRead error:', e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsReadRecord(user);
      await fetchData(false);
    } catch (e) {
      console.error('markAllNotificationsRead error:', e);
    }
  };

  return { markNotificationRead, markAllNotificationsRead };
};
