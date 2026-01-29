import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['limit'],
  cacheConfig: {
    ttl: 10000, // 10 seconds
    staleWhileRevalidate: 30000 // 30 seconds
  },
  handler: async ({ chain, limit }) => {
    const backendUrl = `${API_URL}/api/blocks?chain=${chain}${limit ? `&limit=${limit}` : ''}`;
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch blocks: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
