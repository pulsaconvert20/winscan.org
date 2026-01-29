import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain', 'id'],
  cacheConfig: {
    ttl: 60000, // 1 minute
    staleWhileRevalidate: 120000 // 2 minutes
  },
  handler: async ({ chain, id }) => {
    const backendUrl = `${API_URL}/api/proposal?chain=${chain}&id=${id}`;
    console.log('[Proposal API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch proposal: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
