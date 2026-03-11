var CACHE_NAME = 'massfinder-v3_' + '20260311_1639';
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
  '/offline.html',
  '/assets/fonts/playfair-display-latin.woff2',
  '/assets/fonts/playfair-display-latin-ext.woff2',
  '/assets/fonts/source-sans-3-latin.woff2',
  '/assets/fonts/source-sans-3-latin-ext.woff2',
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

// UX-08: Daily reading reminder notification
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    // Store the reminder preference
    self._reminderEnabled = true;
    self._reminderHour = event.data.hour || 8;
  }
  if (event.data && event.data.type === 'CANCEL_REMINDER') {
    self._reminderEnabled = false;
  }
});

// Periodic check — fires on SW activation or fetch events
function _checkDailyReminder() {
  if (!self._reminderEnabled) return;
  var now = new Date();
  var todayKey = now.toISOString().slice(0, 10);
  // Only notify once per day and only if the app hasn't been opened
  if (self._lastReminderDate === todayKey) return;
  if (now.getHours() < (self._reminderHour || 8)) return;
  self._lastReminderDate = todayKey;
  self.registration.showNotification('MassFinder \u2014 Daily Reading', {
    body: 'Today\u2019s readings and reflections are ready.',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    tag: 'daily-reading',
    renotify: false,
    data: { url: '/' }
  }).catch(function() {});
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf(url) !== -1) {
          return clients[i].focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Fetch: network-only for APIs, stale-while-revalidate for everything else
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-only for API hosts and /api/ routes
  if (NETWORK_ONLY_HOSTS.some(function(h) { return url.host === h; }) || url.pathname.indexOf('/api/') === 0) {
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
          // Network failed — return cached, offline page for navigation, or 503
          if (cached) return cached;
          if (event.request.mode === 'navigate') return cache.match('/offline.html');
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
        return cached || fetchPromise;
      });
    })
  );
});
