// Service Worker for aggressive caching
const CACHE_NAME = 'winscan-v1';
const RUNTIME_CACHE = 'winscan-runtime-v1';

// Cache API responses for instant loading
const API_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/icon.svg',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache GET requests
  if (request.method !== 'GET') return;

  // Cache API requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        
        // Return cached response immediately if available
        if (cached) {
          // Check if cache is stale
          const cachedTime = new Date(cached.headers.get('sw-cache-time') || 0).getTime();
          const isStale = Date.now() - cachedTime > API_CACHE_DURATION;
          
          if (!isStale) {
            return cached;
          }
          
          // Stale cache - return it but fetch fresh data in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseToCache = response.clone();
                const headers = new Headers(responseToCache.headers);
                headers.set('sw-cache-time', new Date().toISOString());
                
                const cachedResponse = new Response(responseToCache.body, {
                  status: responseToCache.status,
                  statusText: responseToCache.statusText,
                  headers: headers,
                });
                
                cache.put(request, cachedResponse);
              }
            })
            .catch(() => {});
          
          return cached;
        }
        
        // No cache - fetch and cache
        try {
          const response = await fetch(request);
          if (response.ok) {
            const responseToCache = response.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-time', new Date().toISOString());
            
            const cachedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers,
            });
            
            cache.put(request, cachedResponse);
          }
          return response;
        } catch (error) {
          // Network error - return cached if available
          return cached || new Response('Network error', { status: 503 });
        }
      })
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
