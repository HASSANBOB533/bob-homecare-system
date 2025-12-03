// Service Worker for BOB Home Care PWA
// Version 2.0.0 - Enhanced with smart caching and offline support

const VERSION = '2.0.0';
const CACHE_PREFIX = 'bob-home-care';
const CACHE_NAME = `${CACHE_PREFIX}-static-v${VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v${VERSION}`;
const OFFLINE_CACHE = `${CACHE_PREFIX}-offline-v${VERSION}`;

// Maximum cache age (7 days)
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000;

// Maximum cache size (50 MB)
const MAX_CACHE_SIZE = 50 * 1024 * 1024;

// Assets to precache on install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// Routes to cache for offline access
const OFFLINE_ROUTES = [
  '/',
  '/book',
  '/dashboard',
  '/my-bookings',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log(`[ServiceWorker v${VERSION}] Install event`);
  
  event.waitUntil(
    Promise.all([
      // Precache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          console.error('[ServiceWorker] Precache failed:', err);
          // Continue even if some assets fail
        });
      }),
      // Create offline cache
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('[ServiceWorker] Creating offline cache');
        return Promise.resolve();
      }),
    ]).then(() => {
      console.log('[ServiceWorker] Installation complete, skipping waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[ServiceWorker v${VERSION}] Activate event`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete caches from different versions
            if (cacheName.startsWith(CACHE_PREFIX) && 
                cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE &&
                cacheName !== OFFLINE_CACHE) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Clean up expired cache entries
      cleanExpiredCaches(),
      // Claim clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log('[ServiceWorker] Activation complete, clients claimed');
    })
  );
});

// Fetch event - smart caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip API requests (always fetch fresh, with offline fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline fallback
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cached API response if offline
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[ServiceWorker] Serving cached API response (offline)');
              return cachedResponse;
            }
            // Return offline response for API failures
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              { status: 503, headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for HTML pages
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          // Fetch fresh version in background
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => {
              // Network failed, return offline page if no cache
              if (!cachedResponse) {
                return caches.match('/offline.html');
              }
            });

          // Return cached version immediately (if available), otherwise wait for network
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Cache-first with network fallback for static assets
  if (
    request.destination === 'image' ||
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'manifest'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Check if cache is expired
          return cachedResponse.headers.get('date')
            ? isExpired(cachedResponse)
              ? fetchAndCache(request)
              : cachedResponse
            : cachedResponse;
        }
        return fetchAndCache(request);
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Helper: Fetch and cache response
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Helper: Check if cached response is expired
function isExpired(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const cacheDate = new Date(dateHeader).getTime();
  const now = Date.now();
  return (now - cacheDate) > MAX_CACHE_AGE;
}

// Helper: Clean expired cache entries
async function cleanExpiredCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (!cacheName.startsWith(CACHE_PREFIX)) continue;
    
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response && isExpired(response)) {
        console.log('[ServiceWorker] Deleting expired cache entry:', request.url);
        await cache.delete(request);
      }
    }
  }
}

// Helper: Manage cache size
async function manageCacheSize() {
  const cache = await caches.open(RUNTIME_CACHE);
  const requests = await cache.keys();
  
  let totalSize = 0;
  const entries = [];
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      const size = blob.size;
      totalSize += size;
      entries.push({ request, size, date: response.headers.get('date') });
    }
  }
  
  // If cache exceeds max size, delete oldest entries
  if (totalSize > MAX_CACHE_SIZE) {
    console.log(`[ServiceWorker] Cache size (${totalSize}) exceeds limit, cleaning up`);
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (const entry of entries) {
      await cache.delete(entry.request);
      totalSize -= entry.size;
      if (totalSize <= MAX_CACHE_SIZE * 0.8) break; // Clean to 80% of max
    }
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanExpiredCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

// Periodic cache cleanup (every 6 hours)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(
      Promise.all([
        cleanExpiredCaches(),
        manageCacheSize(),
      ])
    );
  }
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    console.log('[ServiceWorker] Background sync: bookings');
    event.waitUntil(syncOfflineBookings());
  }
});

// Helper: Sync offline bookings
async function syncOfflineBookings() {
  // Future enhancement: sync offline bookings when back online
  console.log('[ServiceWorker] Syncing offline bookings...');
  return Promise.resolve();
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');
  
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New notification from BOB Home Care',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'bob-notification',
    requireInteraction: false,
    data: data.url || '/',
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BOB Home Care', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log(`[ServiceWorker v${VERSION}] Loaded successfully`);
