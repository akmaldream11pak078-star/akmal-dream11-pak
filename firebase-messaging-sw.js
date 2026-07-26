// firebase-messaging-sw.js
// This service worker runs in the background and receives push
// notifications even when the app/tab is closed.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD0Z9cJeKbaP1TGGt-o7S769w08fgL59Sk",
  authDomain: "akmaldream11pak.firebaseapp.com",
  projectId: "akmaldream11pak",
  storageBucket: "akmaldream11pak.firebasestorage.app",
  messagingSenderId: "958695333536",
  appId: "1:958695333536:web:baf0f21406db5b8ba033c5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Notification';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: '/icon-192-1.png',
    badge: '/icon-192-1.png',
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
