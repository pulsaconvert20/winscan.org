import { createRoute } from '@/lib/routes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: { ttl: 0 }, // No cache for relayers
  handler: async ({ chain }) => {
    const backendUrl = `${API_URL}/api/relayers?chain=${chain}`;
    console.log('[Relayers API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Relayers API] Backend error:', response.status);
      return { relayers: [], total: 0, source: 'none' };
    }

    return await response.json();
  }
});
