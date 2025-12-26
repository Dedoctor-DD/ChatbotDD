const CACHE_NAME = 'dedoctor-v3'; // Incremented version
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Network First strategy for better compatibility with new deployments
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
