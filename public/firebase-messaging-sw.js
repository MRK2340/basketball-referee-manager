// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAjk1notFHFwsxEE34IuUWp20FujMe_6zk',
  authDomain: 'iwhistle-6f5d1.firebaseapp.com',
  projectId: 'iwhistle-6f5d1',
  storageBucket: 'iwhistle-6f5d1.firebasestorage.app',
  messagingSenderId: '629950123933',
  appId: '1:629950123933:web:588ba00892d917617c6974',
});

const messaging = firebase.messaging();

// Show notification when app is in background or closed
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'iWhistle';
  const options = {
    body: payload.notification?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: payload.data?.type || 'iwhistle',
    data: { link: payload.data?.link || '/dashboard' },
    requireInteraction: false,
  };
  self.registration.showNotification(title, options);
});

// Open / focus the app when a notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/dashboard';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
