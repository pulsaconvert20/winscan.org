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
      const data = await fetchJSONWithFailover(`/api/evm/pending?chain=${chain}`, {
        headers: { 'Accept': 'application/json' }
      });
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
        },
      });
    } catch (error) {
      return NextResponse.json(
        { pending: [], error: 'Failed to fetch EVM pending transactions' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { pending: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
