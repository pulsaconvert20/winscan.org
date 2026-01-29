import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain', 'height'],
  cacheConfig: {
    ttl: 60000, // 1 minute
    staleWhileRevalidate: 120000 // 2 minutes
  },
  handler: async ({ chain, height }) => {
    const backendUrl = `${API_URL}/api/blocks/${height}?chain=${chain}`;
    console.log('[Block API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error(`Block not found: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
