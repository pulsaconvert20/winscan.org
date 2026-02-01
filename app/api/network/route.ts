import { createRoute } from '@/lib/routes/factory';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: {
    ttl: 30000, // 30 seconds
    staleWhileRevalidate: 60000 // 1 minute
  },
  handler: async ({ chain }) => {
    const path = `/api/network?chain=${chain}`;
    console.log('[Network API] Fetching with failover:', path);
    
    // Use failover: SSL1 -> SSL2
    return await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
  }
});
