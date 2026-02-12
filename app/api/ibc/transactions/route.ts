import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ssl.winsnip.xyz';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const channel = searchParams.get('channel');
    const direction = searchParams.get('direction') || 'out';
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    if (!chain || !channel) {
      return NextResponse.json(
        { error: 'Missing chain or channel parameter' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/ibc/transactions?chain=${encodeURIComponent(chain)}&channel=${encodeURIComponent(channel)}&direction=${direction}&limit=${limit}&offset=${offset}`,
      {
        next: { revalidate: 30 },
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15',
      },
    });
  } catch (error) {
    console.error('Error fetching IBC transactions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch IBC transactions',
        transactions: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
