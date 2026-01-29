import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: {
    ttl: 30000, // 30 seconds
    staleWhileRevalidate: 60000 // 1 minute
  },
  handler: async ({ chain }) => {
    const backendUrl = `${API_URL}/api/network?chain=${chain}`;
    console.log('[Network API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch network info: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
