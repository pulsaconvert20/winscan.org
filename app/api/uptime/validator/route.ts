import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const chain = searchParams.get('chain');
  const address = searchParams.get('address');
  const blocks = searchParams.get('blocks') || '150';

  if (!chain || !address) {
    return NextResponse.json({ error: 'Chain and address parameters required' }, { status: 400 });
  }

  try {
    const path = `/api/uptime/validator?chain=${chain}&address=${address}&blocks=${blocks}`;
    console.log('[Validator Uptime API] Fetching from backend with failover');
    
    // Use failover: SSL1 -> SSL2
    const data = await fetchJSONWithFailover(path, {
      headers: { 'Accept': 'application/json' }
    });
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    });

  } catch (error) {
    console.error('[Validator Uptime API] All backends failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch validator uptime data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
