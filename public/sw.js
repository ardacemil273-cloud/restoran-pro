const CACHE_NAME = 'restoran-pro-v1'
const urlsToCache = ['/', '/offline.html', '/manifest.json', '/favicon.ico']

// Install event - cache files
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...')
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Opened cache')
      return cache.addAll(urlsToCache).catch(err => {
        console.log('[SW] Cache addAll error:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...')
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - cache first strategy
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return

  // Skip API requests (let them go to network)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json'
            })
          })
        })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(res => {
        if (!res || res.status !== 200) return res
        const clone = res.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        return res
      }).catch(() => caches.match('/offline.html'))
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

  const urlToOpen = event.notification.data.url || '/'

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

console.log('[SW] Service Worker loaded')
