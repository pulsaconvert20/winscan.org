import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');
    const limit = searchParams.get('limit') || '100';

    if (!chain || !address) {
      return NextResponse.json({ error: 'Chain and address parameters required' }, { status: 400 });
    }

    const path = `/api/validator/transactions?chain=${chain}&address=${address}&limit=${limit}`;
    console.log('[Validator Transactions API] Fetching from backend with failover');
    
    try {
      // Use failover: SSL1 -> SSL2
      const data = await fetchJSONWithFailover(path, {
        headers: { 'Accept': 'application/json' }
      });
      
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'no-store, must-revalidate'
        }
      });
    } catch (error: any) {
      console.error('[Validator Transactions API] All backends failed:', error.message);
      return NextResponse.json(
        { transactions: [], source: 'none' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Validator Transactions API] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error.message, transactions: [] },
      { status: 500 }
    );
  }
}
