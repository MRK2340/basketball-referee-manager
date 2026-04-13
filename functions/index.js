/**
 * functions/index.js
 * Firebase Cloud Functions for iWhistle.
 *
 * 1. sendPushNotification — FCM push on new /notifications/{id}
 * 2. enforceRateLimit     — rejects excessive writes per user per minute
 *
 * DEPLOY:
 *   cd /app && firebase deploy --only functions
 */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore('refereemanager');
const fcm = getMessaging();

// ── Rate Limiting ───────────────────────────────────────────────────────────

const RATE_LIMITS = {
  messages:      { max: 20, windowSec: 60 },   // 20 messages per minute
  notifications: { max: 30, windowSec: 60 },   // 30 notifications per minute
};

/**
 * Check and increment a per-user rate counter.
 * Returns true if the write is within limits, false if it should be rejected.
 */
async function checkRateLimit(userId, collection) {
  const config = RATE_LIMITS[collection];
  if (!config) return true; // no limit configured

  const docRef = db.collection('_rate_limits').doc(`${userId}_${collection}`);
  const now = Date.now();

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(docRef);
    const data = snap.data();

    if (!data || (now - data.windowStart) > config.windowSec * 1000) {
      // Window expired or first write — reset counter
      tx.set(docRef, { count: 1, windowStart: now });
      return true;
    }

    if (data.count >= config.max) {
      return false; // rate limit exceeded
    }

    tx.update(docRef, { count: FieldValue.increment(1) });
    return true;
  });
}

// ── Rate Limit Enforcement on Messages ──────────────────────────────────────

exports.enforceMessageRateLimit = onDocumentCreated(
  {
    document: 'messages/{messageId}',
    database: 'refereemanager',
    region: 'us-central1',
  },
  async (event) => {
    const message = event.data?.data();
    if (!message?.sender_id) return;

    const allowed = await checkRateLimit(message.sender_id, 'messages');
    if (!allowed) {
      // Delete the message that exceeded rate limit
      await event.data.ref.delete();
      console.warn(`[RateLimit] Message from ${message.sender_id} deleted — exceeded ${RATE_LIMITS.messages.max}/min`);
    }
  }
);

// ── Push Notification Sender ────────────────────────────────────────────────

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

    // Rate limit notification creation
    const allowed = await checkRateLimit(recipientId, 'notifications');
    if (!allowed) {
      console.warn(`[RateLimit] Notification for ${recipientId} skipped — exceeded ${RATE_LIMITS.notifications.max}/min`);
      return;
    }

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
      if (err.code === 'messaging/registration-token-not-registered') {
        await db.collection('users').doc(recipientId).update({ fcmToken: null });
      }
    }
  }
);
