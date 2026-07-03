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

// Stale-while-revalidate: cache se TURANT dikhao (fast open),
// background me naya version fetch karke cache update kar do agli baar ke liye.
// APP_VERSION update-checker already user ko naya version batata hai (banner),
// isliye yahan fresh-fetch ka wait karne ki zaroorat nahi — speed priority hai.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request)
          .then((networkResponse) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => cachedResponse);

        // Cache mila to turant wahi bhejo, warna network ka wait karo
        return cachedResponse || networkFetch;
      })
    )
  );
});
