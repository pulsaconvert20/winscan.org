import { createRoute } from '@/lib/routes';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: { ttl: 0 }, // No cache for relayers
  handler: async ({ chain }) => {
    const path = `/api/relayers?chain=${chain}`;
    
    try {
      // Use failover: SSL1 -> SSL2
      return await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' }
      });
    } catch (error) {
      console.error('[Relayers API] All backends failed:', error);
      return { relayers: [], total: 0, source: 'none' };
    }
  }
});
