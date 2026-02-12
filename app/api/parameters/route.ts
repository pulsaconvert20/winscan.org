import { createRoute } from '@/lib/routes/factory';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: {
    ttl: 300000, // 5 minutes
    staleWhileRevalidate: 600000 // 10 minutes
  },
  handler: async ({ chain }) => {
    const path = `/api/parameters?chain=${chain}`;
    
    // Use failover: SSL1 -> SSL2
    return await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
  }
});
