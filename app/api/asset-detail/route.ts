import { createRoute } from '@/lib/routes';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain', 'denom'],
  cacheConfig: { ttl: 60000, staleWhileRevalidate: 120000 },
  handler: async ({ chain, denom }) => {
    const path = `/api/asset-detail?chain=${chain}&denom=${encodeURIComponent(denom)}`;
    
    // Use failover: SSL1 -> SSL2
    return await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
  }
});
