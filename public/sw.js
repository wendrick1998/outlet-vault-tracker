const CACHE_NAME = 'outlet-vault-v2';
const OFFLINE_URL = '/offline.html';
const IS_DEVELOPMENT = false; // Set to false in production

const STATIC_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

const DYNAMIC_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:css|js|png|jpg|jpeg|svg|gif|webp)$/
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        if (IS_DEVELOPMENT) console.log('SW: Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        if (IS_DEVELOPMENT) console.error('SW: Install failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            if (IS_DEVELOPMENT) console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Enhanced fetch strategy with stale-while-revalidate
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/') || event.request.url.includes('supabase.co')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(event.request.url))) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // Default to stale-while-revalidate for other requests
  event.respondWith(staleWhileRevalidateStrategy(event.request));
});

// Network-first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
  });

  return cachedResponse || fetchPromise;
}

// Enhanced background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    // Handle queued offline actions
    const pendingRequests = await getPendingRequests();
    
    for (const request of pendingRequests) {
      try {
        await fetch(request.url, request.options);
        await removePendingRequest(request.id);
        
        // Notify clients of successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'BACKGROUND_SYNC_SUCCESS',
              data: request
            });
          });
        });
      } catch (error) {
        if (IS_DEVELOPMENT) console.error('SW: Background sync failed for request:', request);
      }
    }
  } catch (error) {
    if (IS_DEVELOPMENT) console.error('SW: Background sync error:', error);
  }
}

// Utility functions for background sync
async function getPendingRequests() {
  // Implement storage logic for pending requests
  return [];
}

async function removePendingRequest(id) {
  // Implement removal logic
}

// Enhanced push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Outlet Vault', {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'general',
        data: data.url,
        actions: data.actions || [],
        requireInteraction: data.requireInteraction || false
      })
    );
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action) {
    // Handle action buttons
    handleNotificationAction(event.action, event.notification.data);
  } else if (event.notification.data) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url === event.notification.data) {
            return client.focus();
          }
        }
        // Open new window
        return clients.openWindow(event.notification.data);
      })
    );
  }
});

function handleNotificationAction(action, data) {
  // Handle specific notification actions
  switch (action) {
    case 'view':
      clients.openWindow(data);
      break;
    case 'dismiss':
      // Just close, no action needed
      break;
    default:
      if (IS_DEVELOPMENT) console.log('SW: Unknown notification action:', action);
  }
}

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});