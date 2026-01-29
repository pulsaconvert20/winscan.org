import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');

    if (!chain || !address) {
      return NextResponse.json({ error: 'Chain and address parameters required' }, { status: 400 });
    }

    // Use backend API which supports both chain_name and chain_id with load balancer
    const backendUrl = `${API_URL}/api/validator/delegations?chain=${chain}&address=${address}`;
    console.log('[Delegations API] Fetching from backend:', backendUrl);
    
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Delegations API] Backend error:', response.status);
      return NextResponse.json(
        { delegations: [], unbonding: [], source: 'none' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate'
      }
    });

  } catch (error: any) {
    console.error('[Delegations API] Error:', error.message);
    return NextResponse.json(
      { error: 'Failed to fetch delegations', details: error.message },
      { status: 500 }
    );
  }
}
