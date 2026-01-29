import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['status', 'limit'],
  cacheConfig: {
    ttl: 60000, // 1 minute
    staleWhileRevalidate: 120000 // 2 minutes
  },
  handler: async ({ chain, status, limit = '50' }) => {
    let backendUrl = `${API_URL}/api/proposals?chain=${chain}&limit=${limit}`;
    if (status) {
      backendUrl += `&status=${status}`;
    }
    console.log('[Proposals API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch proposals: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
