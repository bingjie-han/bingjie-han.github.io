const CACHE_VERSION = 'ice-blog-jekyll-v5';
const PRECACHE_URLS = [
  './',
  './offline.html',
  './css/ice-blog.css',
  './js/snow.js',
  './img/1.jpg',
  './pwa/icons/pwa_icon_128.png',
  './pwa/icons/pwa_icon_512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => key === CACHE_VERSION ? null : caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const isFreshAsset = request.mode === 'navigate' || ['document', 'script', 'style'].includes(request.destination);

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok && new URL(request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./offline.html');
          return Response.error();
        });

      return isFreshAsset ? network : (cached || network);
    })
  );
});
