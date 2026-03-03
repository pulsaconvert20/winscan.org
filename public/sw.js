// Lightweight Service Worker - Optimized for stability
const CACHE_NAME = 'winscan-v2';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Reduced from 100

// Endpoints that should NEVER be cached
const SKIP_CACHE = [
  '/api/prc20-holders',
  '/api/holders',
  '/api/wallet',
  '/api/balance',
  '/api/prc20-balance',
  '/api/prc20-swap',
  '/api/prc20-transfer',
  '/api/transactions',
  '/api/blocks',
];

// Install - minimal setup
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - simple caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  
  // Skip caching for sensitive endpoints
  if (SKIP_CACHE.some(path => url.pathname.includes(path))) {
    return; // Let browser handle it
  }
  
  // Only cache API requests
  if (!url.pathname.startsWith('/api/')) {
    return; // Let browser handle static files
  }
  
  // Simple cache strategy: cache first, then network
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // Try cache first
        const cached = await cache.match(request);
        
        if (cached) {
          const cacheTime = cached.headers.get('sw-cached-at');
          const age = Date.now() - (parseInt(cacheTime) || 0);
          
          // Return cached if fresh
          if (age < CACHE_DURATION) {
            return cached;
          }
        }
        
        // Fetch from network
        const response = await fetch(request, { 
          signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          const headers = new Headers(clone.headers);
          headers.set('sw-cached-at', Date.now().toString());
          
          const cachedResponse = new Response(clone.body, {
            status: clone.status,
            statusText: clone.statusText,
            headers: headers,
          });
          
          // Cleanup if needed
          const keys = await cache.keys();
          if (keys.length >= MAX_CACHE_SIZE) {
            await cache.delete(keys[0]); // Remove oldest
          }
          
          cache.put(request, cachedResponse).catch(() => {}); // Silent fail
        }
        
        return response;
        
      } catch (error) {
        // Network failed - return stale cache if available
        const cached = await cache.match(request);
        if (cached) return cached;
        
        // No cache - return error
        return new Response(JSON.stringify({ error: 'Network error' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    })
  );
});
