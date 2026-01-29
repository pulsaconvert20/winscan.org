import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }
    // Use backend API which supports EVM pending txs
    const backendUrl = `${API_URL}/api/evm/pending?chain=${chain}`;
    const response = await fetch(backendUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 5 }
    });
    if (!response.ok) {
      return NextResponse.json(
        { pending: [], error: 'Failed to fetch EVM pending transactions' },
        { status: response.status }
      );
    }
    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { pending: [], error: 'Internal server error' },
      { status: 500 }
    );
  }
}
