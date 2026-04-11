/**
 * functions/index.js
 * Firebase Cloud Functions for iWhistle push notifications.
 *
 * Trigger: new document created in /notifications/{notificationId}
 * Action:  sends an FCM push to the recipient if they have a token and push is enabled.
 *
 * DEPLOY:
 *   cd /app && firebase deploy --only functions
 *
 * Per-event preferences respected (gameAssignments, messages, paymentUpdates, scheduleChanges).
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

// Named Firestore database (project uses 'refereemanager', not the default)
const db = getFirestore('refereemanager');
const fcm = getMessaging();

// Maps notification.type → user notification_preferences key
const PREF_KEY_MAP = {
  assignment: 'gameAssignments',
  message: 'messages',
  payment: 'paymentUpdates',
  schedule: 'scheduleChanges',
};

exports.sendPushNotification = onDocumentCreated(
  {
    document: 'notifications/{notificationId}',
    database: 'refereemanager',
    region: 'us-central1',
  },
  async (event) => {
    const notification = event.data?.data();
    if (!notification) return;

    const recipientId = notification.recipient_id;
    if (!recipientId) return;

    // Fetch recipient's Firestore profile for FCM token + preferences
    const userSnap = await db.collection('users').doc(recipientId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data();
    const fcmToken = userData.fcmToken;
    if (!fcmToken) return;

    // Respect global push preference
    const prefs = userData.notification_preferences || {};
    if (prefs.pushNotifications === false) return;

    // Respect per-event preferences
    const prefKey = PREF_KEY_MAP[notification.type];
    if (prefKey && prefs[prefKey] === false) return;

    // Send the push notification
    try {
      await fcm.send({
        token: fcmToken,
        notification: {
          title: notification.title || 'iWhistle',
          body: notification.body || '',
        },
        webpush: {
          notification: {
            icon: 'https://iwhistle-6f5d1.web.app/favicon.ico',
            requireInteraction: false,
          },
          fcmOptions: {
            link: notification.link || '/dashboard',
          },
        },
      });
    } catch (err) {
      console.error('[FCM send]', err.message);
      // Clear stale tokens so we stop retrying
      if (err.code === 'messaging/registration-token-not-registered') {
        await db.collection('users').doc(recipientId).update({ fcmToken: null });
      }
    }
  }
);
