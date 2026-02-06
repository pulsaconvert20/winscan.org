import { createRoute } from '@/lib/routes/factory';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['limit'],
  cacheConfig: {
    ttl: 10000, // 10 seconds
    staleWhileRevalidate: 30000 // 30 seconds
  },
  handler: async ({ chain, limit }) => {
    try {
      const path = `/api/blocks?chain=${chain}${limit ? `&limit=${limit}` : ''}`;
      
      // Use failover: SSL1 -> SSL2
      return await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000) // 8 second timeout for Vercel
      });
    } catch (error) {
      console.warn(`[Blocks API] Failed for chain ${chain}:`, error);
      // Return empty array instead of throwing error
      return { blocks: [] };
    }
  }
});
