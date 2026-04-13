import type { AppUser } from '@/lib/types';
import { saveNotificationPreferencesRecord } from '@/lib/firestoreService';
import { logger } from '@/lib/logger';

export const useSettingsActions = (user: AppUser | null, fetchData: (isInitial?: boolean) => Promise<void>) => {
  const saveNotificationPreferences = async (prefs: Record<string, boolean>) => {
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
