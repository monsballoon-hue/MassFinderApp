var CACHE_NAME = 'massfinder-v3_' + '20260309_1512';
var SHELL_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/dist/app.min.js',
  '/parish_data.json',
  '/events.json',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js',
];

// NETWORK_ONLY_HOSTS — always bypass cache for these
var NETWORK_ONLY_HOSTS = [
  'massfinder-readings-api.vercel.app',
  'litcal.johnromanodorazio.com',
  'query.bibleget.io',
  'api.web3forms.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'universalis.com',
];

// Install: cache shell assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(SHELL_ASSETS); })
  );
  self.skipWaiting();
});

// Activate: delete old caches, notify clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      var old = keys.filter(function(k) { return k !== CACHE_NAME; });
      return Promise.all(old.map(function(k) { return caches.delete(k); })).then(function() {
        if (old.length) {
          self.clients.matchAll().then(function(clients) {
            clients.forEach(function(c) { c.postMessage({ type: 'CACHE_UPDATED' }); });
          });
        }
      });
    })
  );
  self.clients.claim();
});

// Fetch: network-only for APIs, stale-while-revalidate for everything else
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-only for API hosts
  if (NETWORK_ONLY_HOSTS.some(function(h) { return url.host === h; })) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(function() {
          // Network failed — return cached or offline
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
        return cached || fetchPromise;
      });
    })
  );
});
