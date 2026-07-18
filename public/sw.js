const CACHE_NAME = 'restoran-pro-v4'
const STATIC_CACHE = 'restoran-pro-static-v4'

const urlsToCache = [
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-384x384.png',
  '/apple-touch-icon.png',
]

// Install event - cache files aggressively
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker v4...')
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(urlsToCache).catch(err => {
          console.log('[SW] Cache addAll error (non-fatal):', err)
          // Hataları görmezden gel, devam et
          return Promise.resolve()
        })
      }),
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Initializing main cache')
        return Promise.resolve()
      })
    ]).then(() => {
      console.log('[SW] Installation complete')
      self.skipWaiting() // Hemen aktif hale getir
    })
  )
})

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker v4...')
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  )
  console.log('[SW] Activation complete')
})

// Fetch event - network first with intelligent caching
self.addEventListener('fetch', event => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // Skip API requests - always go to network with timeout
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
      ]).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline', message: 'İnternet bağlantısı yok' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' })
        })
      })
    )
    return
  }

  // Skip Supabase requests
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: new Headers({ 'Content-Type': 'application/json' })
        })
      })
    )
    return
  }

  // For navigation requests (HTML pages) - network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Try cache first
          return caches.match(request).then(cached => {
            if (cached) return cached
            // Fallback to offline page
            return caches.match('/offline.html')
          })
        })
    )
    return
  }

  // For static assets - cache first, then network (with background update)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached version immediately
        // Update in background
        fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, networkResponse.clone())
            })
          }
        }).catch(() => {})
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(request).then(response => {
        if (!response || response.status !== 200) return response
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone)
        })
        return response
      }).catch(() => {
        // Fallback to offline page
        return caches.match('/offline.html')
      })
    })
  )
})

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push notification received')
  
  let notificationData = {
    title: 'Restoran Pro',
    body: 'Yeni sipariş geldi!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'order-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200]
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = Object.assign(notificationData, data)
    } catch (e) {
      notificationData.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.vibrate,
      data: {
        url: notificationData.url || '/'
      }
    })
  )
})

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked')
  event.notification.close()

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if ('focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Message event - handle messages from the app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING received, updating...')
    self.skipWaiting()
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches...')
    caches.keys().then(cacheNames => {
      Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    })
  }
})

console.log('[SW] Service Worker v4 loaded and ready')
