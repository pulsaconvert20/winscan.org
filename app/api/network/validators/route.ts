import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');

    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }

    const path = `/api/network/validators?chain=${chain}`;
    console.log('[Validators API] Fetching from backend with failover');
    
    try {
      // Use failover: SSL1 -> SSL2
      const data = await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' }
      });
      
      // Return backend data (from cache or real-time)
      console.log(`[Validators API] ✅ Backend returned ${data.total_locations || 0} locations for ${chain} (cached: ${data.cached || false})`);
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      });
    } catch (fetchError: any) {
      console.error('[Validators API] All backends failed:', fetchError.message);
    }

    // Fallback: Return empty data (no location data available)
    console.warn('[Validators API] Backend unavailable for', chain, '- returning empty location data');
    
    // Note: The frontend will fetch validators directly from /api/validators
    // This endpoint only provides location data, which is not available for all chains
    
    // Final fallback: Return empty data
    console.warn('[Validators API] Returning empty location data for', chain);
    return NextResponse.json({
      success: false,
      error: 'Location data not available',
      total_peers: 0,
      total_locations: 0,
      locations: [],
      message: 'Validator location data not available for this chain. Validator list will be fetched separately.'
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error: any) {
    console.error('[Validators API] Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.name === 'AbortError' ? 'Request timeout' : 'Internal server error',
      total_peers: 0,
      total_locations: 0,
      locations: []
    }, { status: 200 });
  }
}

