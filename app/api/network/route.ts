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
    try {
      const path = `/api/network?chain=${chain}`;
      console.log('[Network API] Fetching with failover:', path);
      
      // Use failover: SSL1 -> SSL2
      return await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000) // 8 second timeout for Vercel
      });
    } catch (error) {
      console.warn(`[Network API] Failed for chain ${chain}:`, error);
      // Return default network data instead of throwing error
      return {
        bondedTokens: '0',
        notBondedTokens: '0',
        totalSupply: '0',
        bondedRatio: '0',
        inflation: '0',
        communityPool: '0'
      };
    }
  }
});
