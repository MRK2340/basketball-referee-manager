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
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

initializeApp();

const db = getFirestore('refereemanager');

// Hosting origin — used for FCM notification icons.
// GCLOUD_PROJECT is set automatically by the Firebase Functions runtime.
const HOSTING_ORIGIN = `https://${process.env.GCLOUD_PROJECT || 'iwhistle-6f5d1'}.web.app`;
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

    // Fetch recipient's Firestore profile for preferences
    const userSnap = await db.collection('users').doc(recipientId).get();
    if (!userSnap.exists) return;

    const userData = userSnap.data();

    // Fetch FCM token from private collection (not user profile)
    const tokenSnap = await db.collection('_fcm_tokens').doc(recipientId).get();
    const fcmToken = tokenSnap.exists ? tokenSnap.data().token : null;
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
            icon: `${HOSTING_ORIGIN}/favicon.ico`,
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
        await db.collection('_fcm_tokens').doc(recipientId).update({ token: null });
      }
    }
  }
);

// ── Game Reminder Scheduling ────────────────────────────────────────────────

/**
 * When a referee is assigned to a game, schedule reminder notifications.
 * Creates entries in _game_reminders collection for the scheduler to pick up.
 */
exports.scheduleGameReminder = onDocumentCreated(
  {
    document: 'game_assignments/{assignmentId}',
    database: 'refereemanager',
    region: 'us-central1',
  },
  async (event) => {
    const assignment = event.data?.data();
    if (!assignment?.game_id || !assignment?.referee_id) return;
    if (assignment.status === 'declined') return;

    // Fetch the game to get date/time
    const gameSnap = await db.collection('games').doc(assignment.game_id).get();
    if (!gameSnap.exists) return;
    const game = gameSnap.data();
    if (!game.game_date || !game.game_time) return;

    // Parse game datetime
    const gameDateTime = new Date(`${game.game_date}T${game.game_time}`);
    if (isNaN(gameDateTime.getTime())) return;

    const now = new Date();
    const gameLabel = `${game.home_team || 'TBD'} vs ${game.away_team || 'TBD'}`;
    const venue = game.venue || 'TBD';

    // Schedule 24h reminder
    const reminder24h = new Date(gameDateTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
      await db.collection('_game_reminders').add({
        referee_id: assignment.referee_id,
        game_id: assignment.game_id,
        remind_at: reminder24h.toISOString(),
        type: '24h',
        title: 'Game Tomorrow',
        body: `${gameLabel} at ${venue} — ${game.game_date} ${game.game_time}`,
        sent: false,
      });
    }

    // Schedule 1h reminder
    const reminder1h = new Date(gameDateTime.getTime() - 60 * 60 * 1000);
    if (reminder1h > now) {
      await db.collection('_game_reminders').add({
        referee_id: assignment.referee_id,
        game_id: assignment.game_id,
        remind_at: reminder1h.toISOString(),
        type: '1h',
        title: 'Game in 1 Hour',
        body: `${gameLabel} at ${venue} — get ready!`,
        sent: false,
      });
    }
  }
);

/**
 * Scheduled function: runs every 15 minutes, checks for due reminders, sends push.
 */
exports.processGameReminders = onSchedule(
  {
    schedule: 'every 15 minutes',
    region: 'us-central1',
    timeZone: 'America/New_York',
  },
  async () => {
    const now = new Date().toISOString();
    const remindersSnap = await db.collection('_game_reminders')
      .where('sent', '==', false)
      .where('remind_at', '<=', now)
      .limit(100)
      .get();

    if (remindersSnap.empty) return;

    const batch = db.batch();
    const sendPromises = [];

    for (const doc of remindersSnap.docs) {
      const reminder = doc.data();
      batch.update(doc.ref, { sent: true });

      sendPromises.push((async () => {
        // Fetch referee's preferences from profile
        const userSnap = await db.collection('users').doc(reminder.referee_id).get();
        if (!userSnap.exists) return;
        const userData = userSnap.data();

        // Fetch FCM token from private collection
        const tokenSnap = await db.collection('_fcm_tokens').doc(reminder.referee_id).get();
        const fcmToken = tokenSnap.exists ? tokenSnap.data().token : null;
        if (!fcmToken) return;

        // Check preferences
        const prefs = userData.notification_preferences || {};
        if (prefs.pushNotifications === false) return;
        if (prefs.scheduleChanges === false) return;

        // Create in-app notification
        await db.collection('notifications').add({
          type: 'schedule',
          title: reminder.title,
          body: reminder.body,
          link: '/schedule',
          read: false,
          created_at: FieldValue.serverTimestamp(),
          recipient_id: reminder.referee_id,
        });

        // Send FCM push
        try {
          await fcm.send({
            token: fcmToken,
            notification: {
              title: reminder.title,
              body: reminder.body,
            },
            webpush: {
              notification: {
                icon: `${HOSTING_ORIGIN}/favicon.ico`,
                badge: `${HOSTING_ORIGIN}/favicon.ico`,
                requireInteraction: true,
              },
              fcmOptions: { link: '/schedule' },
            },
          });
        } catch (err) {
          console.error('[Reminder FCM]', err.message);
          if (err.code === 'messaging/registration-token-not-registered') {
            await db.collection('_fcm_tokens').doc(reminder.referee_id).update({ token: null });
          }
        }
      })());
    }

    await Promise.all(sendPromises);
    await batch.commit();
    console.log(`[Reminders] Processed ${remindersSnap.size} game reminders`);
  }
);

