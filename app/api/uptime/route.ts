import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain'],
  optionalParams: ['blocks'],
  cacheConfig: {
    ttl: 10000, // 10 seconds
    staleWhileRevalidate: 30000 // 30 seconds
  },
  handler: async ({ chain, blocks = '100' }) => {
    const backendUrl = `${API_URL}/api/uptime?chain=${chain}&blocks=${blocks}`;
    console.log('[Uptime API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 10 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch uptime data: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
