const CACHE_NAME = 'dont-troll-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './login.html',
  './builder.html',
  './style.css',
  './main.js',
  './game.js',
  './player.js',
  './levels.js',
  './traps.js',
  './renderer.js',
  './sound.js',
  './auth.js',
  './achievements.js',
  './builder.js',
  './assets/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Only cache successful GET requests from the same origin
        if (event.request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to load from cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});
