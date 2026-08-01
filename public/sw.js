const CACHE_NAME = 'relevant-plus-v2';
const STATIC_CACHE = 'relevant-static-v2';
const DATA_CACHE = 'relevant-data-v2';

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: precache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, DATA_CACHE];
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => !currentCaches.includes(name))
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: strategy depends on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations go through sync queue in the app)
  if (request.method !== 'GET') return;

  // Supabase API calls and Bible API: Network first, fall back to cache
  if (url.hostname.includes('supabase') || url.hostname.includes('bible-api.com')) {
    event.respondWith(networkFirstThenCache(request, DATA_CACHE));
    return;
  }

  // Navigation requests: Network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/offline.html')))
    );
    return;
  }

  // Static assets: Cache first, network fallback
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(cacheFirstThenNetwork(request, STATIC_CACHE));
    return;
  }

  // Everything else: network first
  event.respondWith(networkFirstThenCache(request, STATIC_CACHE));
});

// Cache first, then network
async function cacheFirstThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      cache.put(request, clone);
    }
    return response;
  } catch (e) {
    return new Response('Offline', { status: 503 });
  }
}

// Network first, fall back to cache
async function networkFirstThenCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      cache.put(request, clone);
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Listen for sync events (Background Sync API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Notify clients to run their sync queue
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_PENDING' });
  });
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- Push Notification Handlers (Phase 6 groundwork) ---

// Handle incoming push messages
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Relevant+', {
        body: data.body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        data: { url: data.url || '/' },
        actions: data.actions || [],
      })
    );
  } catch (e) {
    // Fallback for non-JSON push payloads
    event.waitUntil(
      self.registration.showNotification('Relevant+', {
        body: event.data.text(),
        icon: '/icons/icon-192x192.png',
      })
    );
  }
});

// Handle notification clicks — navigate to the relevant page
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});
