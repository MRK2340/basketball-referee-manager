import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useFCM } from '@/hooks/useFCM';
import { exportUserData, deleteUserData, writeAuditLog } from '@/lib/firestoreService';
import NotificationsSettings from './Settings/NotificationsSettings';
import PreferencesSettings from './Settings/PreferencesSettings';
import AccountSecuritySettings from './Settings/AccountSecuritySettings';
import SupportSettings from './Settings/SupportSettings';
import TwoFactorDialog from './Settings/TwoFactorDialog';

const Settings = () => {
  const { user, resetPassword, logout } = useAuth();
  const { notificationPreferences, settingsActions } = useData();
  const { pushEnabled, permissionStatus, enablePushNotifications, disablePushNotifications } = useFCM(user);

  const [notifications, setNotifications] = useState(() => ({
    gameAssignments: true,
    paymentUpdates: true,
    scheduleChanges: true,
    messages: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    ...(notificationPreferences || {}),
  }));

  // Sync from context after async fetchData resolves (handles hard reload)
  useEffect(() => {
    if (notificationPreferences && Object.keys(notificationPreferences).length > 0) {
      setNotifications((prev) => ({ ...prev, ...notificationPreferences }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(notificationPreferences)]);

  const [preferences, setPreferences] = useState({
    darkMode: false,
    soundEffects: false,
    language: 'en',
    timezone: 'America/New_York',
    autoRefresh: true,
  });

  const [show2FADialog, setShow2FADialog] = useState(false);

  const handleNotificationChange = async (key) => {
    // Push notifications: wire to actual FCM permission/token flow
    if (key === 'pushNotifications') {
      if (!notifications[key]) {
        const success = await enablePushNotifications();
        if (!success) return; // Don't update toggle if FCM setup failed
      } else {
        await disablePushNotifications();
      }
      const updated = { ...notifications, pushNotifications: !notifications.pushNotifications };
      setNotifications(updated);
      settingsActions.saveNotificationPreferences(updated);
      return;
    }
    // All other toggles
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    settingsActions.saveNotificationPreferences(updated);
    toast({
      title: "Settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    toast({
      title: "Settings updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleFeatureClick = async (feature: string) => {
    if (feature === 'change-password' && user?.email) {
      resetPassword(user.email);
      return;
    }
    if (feature === 'export-data' && user) {
      toast({ title: 'Exporting data...', description: 'This may take a moment.' });
      const { data, error } = await exportUserData(user);
      if (error) {
        toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `iwhistle-data-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click(); URL.revokeObjectURL(url);
        writeAuditLog(user.id, 'export_data', 'gdpr');
        toast({ title: 'Data exported', description: 'Your data has been downloaded as JSON.' });
      }
      return;
    }
    if (feature === 'delete-account' && user) {
      if (!window.confirm('Are you sure you want to permanently delete your account and all associated data? This action cannot be undone.')) return;
      if (!window.confirm('This is your FINAL confirmation. All your data will be permanently erased. Continue?')) return;
      const { error } = await deleteUserData(user);
      if (error) {
        toast({ title: 'Deletion failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Account deleted', description: 'All your data has been permanently removed.' });
        logout();
      }
      return;
    }
    if (feature === 'two-factor-auth' && user) {
      setShow2FADialog(true);
      return;
    }
    toast({
      title: "Coming Soon",
      description: "This feature is on our roadmap and will be available in a future update.",
    });
  };

  return (
    <>
      <Helmet>
        <title>Settings - iWhistle</title>
        <meta name="description" content="Manage your account settings, notifications, and preferences for the iWhistle app." />
      </Helmet>

      <div className="space-y-8" data-testid="settings-page">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
          data-testid="settings-page-header"
        >
          <p className="app-kicker mb-3">Preferences</p>
          <h1 className="app-heading mb-3 text-4xl text-slate-950">Settings</h1>
          <p className="max-w-2xl text-slate-600">Manage notifications, app behavior, and account-level preferences in a cleaner control center.</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NotificationsSettings 
              notifications={notifications} 
              onNotificationChange={handleNotificationChange}
              fcm={{ pushEnabled, permissionStatus }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PreferencesSettings 
              preferences={preferences} 
              onPreferenceChange={handlePreferenceChange} 
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <AccountSecuritySettings onFeatureClick={handleFeatureClick} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SupportSettings onFeatureClick={handleFeatureClick} />
        </motion.div>
      </div>
      {user && <TwoFactorDialog open={show2FADialog} setOpen={setShow2FADialog} user={user} />}
    </>
  );
};

export default Settings;