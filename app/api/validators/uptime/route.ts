import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const consensus = searchParams.get('consensus');

    if (!chain || !consensus) {
      return NextResponse.json({ error: 'Chain and consensus parameters required' }, { status: 400 });
    }

    const path = `/api/validators/uptime?chain=${chain}&consensus=${encodeURIComponent(consensus)}`;
    console.log('[Validators Uptime API] Fetching from backend with failover');
    
    try {
      // Use failover: SSL1 -> SSL2
      const data = await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' }
      });
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
      });
    } catch (error) {
      console.error('[Validators Uptime API] All backends failed:', error);
      // Return default uptime if backend fails
      return NextResponse.json({ uptime: 100 });
    }
  } catch (error) {
    console.error('[Validators Uptime API] Error:', error);
    // Return default uptime on error
    return NextResponse.json({ uptime: 100 });
  }
}
