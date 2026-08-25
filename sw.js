const CACHE_NAME = '4hghub-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './styles_v4.css',
  './app_v5.js',
  './manifest.json',
  './assets/4hgs_logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Avoid interception for non-HTTP(S) schemes
  if (!e.request.url.startsWith('http')) {
    return;
  }
  
  // Bypass caching for Firestore database requests and Firebase Auth endpoints
  if (e.request.url.includes('firestore.googleapis.com') || 
      e.request.url.includes('identitytoolkit.googleapis.com') ||
      e.request.method !== 'GET') {
    return;
  }

  // Network-First strategy: always fetch the newest version from server first
  e.respondWith(
    fetch(e.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Offline fallback: serve from local cache if network is unavailable
      return caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        if (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});

