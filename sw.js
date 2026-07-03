// ── Akmal Dream 11 Pak — Service Worker ──
// Ye service worker sirf offline fallback + PWA installability ke liye hai.
// Content hamesha network se fresh load hoga (koi purana cache force nahi hoga),
// isliye jab bhi index.html update karo, user ko naya version mil jayega.

const CACHE_NAME = 'd11pak-shell-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // naya service worker turant activate ho
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first strategy: hamesha latest version try karo, offline ho to cache se do
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
