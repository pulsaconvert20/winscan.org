import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: {
    ttl: 300000, // 5 minutes
    staleWhileRevalidate: 600000 // 10 minutes
  },
  handler: async ({ chain }) => {
    const backendUrl = `${API_URL}/api/parameters?chain=${chain}`;
    console.log('[Parameters API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch parameters: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
