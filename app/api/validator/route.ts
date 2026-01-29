import { createRoute } from '@/lib/routes/factory';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export const GET = createRoute({
  requiredParams: ['chain', 'address'],
  cacheConfig: {
    ttl: 30000, // 30 seconds
    staleWhileRevalidate: 60000 // 1 minute
  },
  handler: async ({ chain, address }) => {
    const backendUrl = `${API_URL}/api/validator?chain=${chain}&address=${address}`;
    console.log('[Validator Detail API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch validator details: HTTP ${response.status}`);
    }

    return await response.json();
  }
});
