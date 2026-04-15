/**
 * useRemoteConfig.ts
 * Fetches Firebase Remote Config on mount and provides feature flags
 * that can be toggled from the Firebase Console without redeploying.
 */
import { useState, useEffect } from 'react';
import { loadRemoteConfig } from '@/lib/firebase';

export interface RemoteFlags {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  featureAiAssistant: boolean;
  featureBracketEditor: boolean;
  featureScheduleImport: boolean;
  featurePushNotifications: boolean;
  announcementBanner: string;
  announcementBannerColor: string;
  loading: boolean;
}

const DEFAULTS: Omit<RemoteFlags, 'loading'> = {
  maintenanceMode: false,
  maintenanceMessage: 'iWhistle is undergoing scheduled maintenance. Please check back shortly.',
  featureAiAssistant: true,
  featureBracketEditor: true,
  featureScheduleImport: true,
  featurePushNotifications: true,
  announcementBanner: '',
  announcementBannerColor: '#0080C8',
};

export const useRemoteConfig = (): RemoteFlags => {
  const [flags, setFlags] = useState<RemoteFlags>({ ...DEFAULTS, loading: true });

  useEffect(() => {
    loadRemoteConfig()
      .then((values) => {
        setFlags({
          maintenanceMode: typeof values.maintenanceMode === 'boolean' ? values.maintenanceMode : DEFAULTS.maintenanceMode,
          maintenanceMessage: (values.maintenanceMessage as string) || DEFAULTS.maintenanceMessage,
          featureAiAssistant: typeof values.featureAiAssistant === 'boolean' ? values.featureAiAssistant : DEFAULTS.featureAiAssistant,
          featureBracketEditor: typeof values.featureBracketEditor === 'boolean' ? values.featureBracketEditor : DEFAULTS.featureBracketEditor,
          featureScheduleImport: typeof values.featureScheduleImport === 'boolean' ? values.featureScheduleImport : DEFAULTS.featureScheduleImport,
          featurePushNotifications: typeof values.featurePushNotifications === 'boolean' ? values.featurePushNotifications : DEFAULTS.featurePushNotifications,
          announcementBanner: (values.announcementBanner as string) || DEFAULTS.announcementBanner,
          announcementBannerColor: (values.announcementBannerColor as string) || DEFAULTS.announcementBannerColor,
          loading: false,
        });
      })
      .catch(() => {
        // Remote Config is optional — fall back to defaults and unblock the app
        setFlags((prev) => ({ ...prev, loading: false }));
      });
  }, []);

  return flags;
};
