import { createRoute } from '@/lib/routes';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';
const API_URL_FALLBACK = process.env.API_URL_FALLBACK || 'https://ssl2.winsnip.xyz';

async function fetchWithFallback(endpoint: string, searchParams: URLSearchParams) {
  // Try primary API
  try {
    const url = new URL(endpoint, API_URL);
    searchParams.forEach((value, key) => {
      url.searchParams.append(key, value);
    });
    
    console.log('🔵 Trying primary API:', url.toString());
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    if (response.ok) {
      console.log('✅ Primary API success');
      return await response.json();
    }
    
    console.warn('⚠️ Primary API failed with status:', response.status);
    throw new Error(`Primary API failed: ${response.status}`);
  } catch (primaryError: any) {
    console.error('❌ Primary API error:', primaryError.message);
    
    // Try fallback API
    const fallbackUrl = new URL(endpoint, API_URL_FALLBACK);
    searchParams.forEach((value, key) => {
      fallbackUrl.searchParams.append(key, value);
    });
    
    console.log('🟡 Trying fallback API:', fallbackUrl.toString());
    const fallbackResponse = await fetch(fallbackUrl.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(10000)
    });
    
    if (fallbackResponse.ok) {
      console.log('✅ Fallback API success');
      return await fallbackResponse.json();
    }
    
    console.error('❌ Fallback API failed with status:', fallbackResponse.status);
    throw new Error(`Both APIs failed. Primary: ${primaryError.message}, Fallback: ${fallbackResponse.status}`);
  }
}

export const GET = createRoute({
  requiredParams: ['endpoint'],
  cacheConfig: { ttl: 10000, staleWhileRevalidate: 30000 },
  handler: async ({ endpoint }, request) => {
    // Remove endpoint from params before passing to APIs
    const apiParams = new URLSearchParams(request.nextUrl.searchParams);
    apiParams.delete('endpoint');
    
    return await fetchWithFallback(endpoint, apiParams);
  }
});
