const CACHE_VERSION = 'ice-blog-static-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './about.html',
  './tags.html',
  './offline.html',
  './posts/welcome-to-ice-blog.html',
  './css/ice-blog.css',
  './js/site.js',
  './img/1.jpg',
  './pwa/icons/pwa_icon_128.png',
  './pwa/icons/pwa_icon_512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => key === CACHE_VERSION ? null : caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => cached || caches.match('./offline.html'));
      return cached || network;
    })
  );
});
