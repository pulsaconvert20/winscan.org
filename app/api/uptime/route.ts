import { createRoute } from '@/lib/routes/factory';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['blocks'],
  cacheConfig: {
    ttl: 10000, // 10 seconds
    staleWhileRevalidate: 30000 // 30 seconds
  },
  handler: async ({ chain, blocks = '100' }) => {
    const path = `/api/uptime?chain=${chain}&blocks=${blocks}`;
    
    // Use failover: SSL1 -> SSL2
    return await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
  }
});
