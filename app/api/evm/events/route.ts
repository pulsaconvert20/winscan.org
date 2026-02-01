import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }
    
    try {
      // Use failover: SSL1 -> SSL2
      const data = await fetchJSONWithFailover(`/api/evm/events?chain=${chain}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { events: [], error: 'Failed to fetch EVM events' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { events: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
