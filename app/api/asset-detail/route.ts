import { createRoute } from '@/lib/routes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain', 'denom'],
  cacheConfig: { ttl: 60000, staleWhileRevalidate: 120000 },
  handler: async ({ chain, denom }) => {
    const backendUrl = `${API_URL}/api/asset-detail?chain=${chain}&denom=${encodeURIComponent(denom)}`;
    console.log('[Asset Detail API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.error('[Asset Detail API] Backend error:', response.status);
      throw new Error('Failed to fetch asset detail');
    }

    return await response.json();
  }
});
