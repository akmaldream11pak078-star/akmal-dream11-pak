// Akmal Dream 11 Pak — Service Worker
// Caches app shell for fast load and offline support

const CACHE_NAME = 'akmal-d11-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap'
];

// Install — cache app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

// Activate — clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip Firebase/API calls — always go to network
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache fresh copy for next time
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Fallback to index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Push Notifications support
self.addEventListener('push', event => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    self.registration.showNotification(data.title || 'Akmal Dream 11 Pak', {
      body: data.body || '',
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url || '/' }
    });
  } catch(e) {}
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
