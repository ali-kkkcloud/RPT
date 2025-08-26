const CACHE_NAME = 'g4s-fleet-v1.0.0'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add other static assets as needed
]

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log('Service Worker installed successfully')
        return self.skipWaiting()
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('Service Worker activated')
      return self.clients.claim()
    })
  )
})

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Skip Google Sheets API calls (always need fresh data)
  if (event.request.url.includes('docs.google.com') || 
      event.request.url.includes('sheets.googleapis.com')) {
    return
  }

  event.respondWith(
    // Try network first
    fetch(event.request)
      .then((response) => {
        // If we got a valid response, clone it and store in cache
        if (response.status === 200) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
        }
        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            
            // If not in cache and it's a navigation request, return offline page
            if (event.request.mode === 'navigate') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>G4S Fleet - Offline</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      height: 100vh;
                      margin: 0;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                    }
                    .container {
                      text-align: center;
                      padding: 2rem;
                      border-radius: 20px;
                      background: rgba(255, 255, 255, 0.1);
                      backdrop-filter: blur(10px);
                      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                    }
                    h1 { margin-bottom: 1rem; }
                    p { margin-bottom: 2rem; opacity: 0.9; }
                    button {
                      background: #3b82f6;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 16px;
                      transition: background-color 0.2s;
                    }
                    button:hover { background: #2563eb; }
                    .icon { font-size: 4rem; margin-bottom: 1rem; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="icon">📡</div>
                    <h1>You're Offline</h1>
                    <p>G4S Fleet Dashboard requires an internet connection to load fresh data from Google Sheets.</p>
                    <button onclick="window.location.reload()">Try Again</button>
                  </div>
                </body>
                </html>
              `, {
                headers: {
                  'Content-Type': 'text/html'
                }
              })
            }
            
            // For other requests, return a generic offline response
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            })
          })
      })
  )
})

// Background Sync for data updates
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background data sync
      fetch('/api/offline')
        .then(() => fetch('/api/alerts'))
        .then(() => fetch('/api/speed'))
        .then(() => {
          console.log('Background sync completed')
        })
        .catch((error) => {
          console.error('Background sync failed:', error)
        })
    )
  }
})

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event)
  
  const options = {
    body: event.data ? event.data.text() : 'New fleet alert received',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    tag: 'fleet-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Dashboard'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('G4S Fleet Alert', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

console.log('G4S Fleet Service Worker loaded')
