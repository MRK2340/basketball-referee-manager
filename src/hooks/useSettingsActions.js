import { saveNotificationPreferencesRecord } from '@/lib/firestoreService';
import { logger } from '@/lib/logger';

export const useSettingsActions = (user, fetchData) => {
  const saveNotificationPreferences = async (prefs) => {
    if (!user) return;
    try {
      await saveNotificationPreferencesRecord(user, prefs);
      await fetchData(false);
    } catch (e) {
      logger.error('saveNotificationPreferences error:', e);
    }
  };

  return { saveNotificationPreferences };
};
