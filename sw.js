const CACHE_NAME = '4hghub-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './styles_v4.css',
  './app_v5.js',
  './manifest.json',
  'https://4hgs.com/wp-content/uploads/2025/09/image-37.png',
  'https://4hgs.com/wp-content/uploads/2025/10/4HGS-Circle-Logo.pdf-2.png'
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
  // Avoid interception for non-HTTP(S) schemes (e.g. chrome-extension or firebase SDKs internal endpoints if needed)
  if (!e.request.url.startsWith('http')) {
    return;
  }
  
  // Bypass caching for Firestore database requests and Firebase Auth endpoints to avoid stale data/errors
  if (e.request.url.includes('firestore.googleapis.com') || 
      e.request.url.includes('identitytoolkit.googleapis.com') ||
      e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache dynamic assets if they are static/regular types
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback
        return caches.match('./index.html');
      });
    })
  );
});
