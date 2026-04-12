/**
 * useFCM.js
 * Manages Firebase Cloud Messaging token registration and browser permission.
 * - Requests notification permission
 * - Registers / refreshes FCM token and saves it to Firestore
 * - Handles enabling / disabling push from the Settings page
 */
import { useState, useEffect, useCallback } from 'react';
import { getToken, isSupported } from 'firebase/messaging';
import { getMessaging } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import app, { db } from '@/lib/firebase';
import { toast } from '@/components/ui/use-toast';
import { Analytics } from '@/lib/analytics';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const useFCM = (user) => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(
    () => (typeof Notification !== 'undefined' ? Notification.permission : 'not-supported')
  );

  // On mount: if browser permission was already granted, silently refresh the token
  useEffect(() => {
    if (!user?.id || typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    (async () => {
      try {
        const supported = await isSupported();
        if (!supported) return;
        const messaging = getMessaging(app);
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          await updateDoc(doc(db, 'users', user.id), { fcmToken: token });
          setPushEnabled(true);
        }
      } catch {
        // Token refresh is best-effort — silently ignore failures
      }
    })();
  }, [user?.id]);

  const enablePushNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      toast({
        title: 'Not supported',
        description: 'Push notifications are not supported in this browser.',
        variant: 'destructive',
      });
      return false;
    }
    if (!user?.id) return false;

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission !== 'granted') {
        toast({
          title: 'Permission denied',
          description:
            'Allow notifications in your browser settings to receive push alerts.',
          variant: 'destructive',
        });
        return false;
      }

      const supported = await isSupported();
      if (!supported) {
        toast({
          title: 'Not supported',
          description: 'FCM push notifications are not supported in this browser.',
          variant: 'destructive',
        });
        return false;
      }

      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await updateDoc(doc(db, 'users', user.id), { fcmToken: token });
        setPushEnabled(true);
        Analytics.pushEnabled();
        toast({
          title: 'Push notifications enabled!',
          description: "You'll receive alerts even when the app is closed.",
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[FCM]', error);
      toast({
        title: 'Failed to enable push notifications',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const disablePushNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      await updateDoc(doc(db, 'users', user.id), { fcmToken: null });
      setPushEnabled(false);
      Analytics.pushDisabled();
      toast({ title: 'Push notifications disabled' });
    } catch (error) {
      console.error('[FCM disable]', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { pushEnabled, permissionStatus, enablePushNotifications, disablePushNotifications };
};

