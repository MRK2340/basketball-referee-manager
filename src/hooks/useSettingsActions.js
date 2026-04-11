import { saveNotificationPreferencesRecord } from '@/lib/firestoreService';

export const useSettingsActions = (user, fetchData) => {
  const saveNotificationPreferences = async (prefs) => {
    if (!user) return;
    try {
      await saveNotificationPreferencesRecord(user, prefs);
      await fetchData(false);
    } catch (e) {
      console.error('saveNotificationPreferences error:', e);
    }
  };

  return { saveNotificationPreferences };
};
