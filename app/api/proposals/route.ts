import { createRoute } from '@/lib/routes/factory';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['status', 'limit'],
  cacheConfig: {
    ttl: 60000, // 1 minute
    staleWhileRevalidate: 120000 // 2 minutes
  },
  handler: async ({ chain, status, limit = '50' }) => {
    let path = `/api/proposals?chain=${chain}&limit=${limit}`;
    if (status) {
      path += `&status=${status}`;
    }
    
    // Use failover: SSL1 -> SSL2
    return await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
  }
});
