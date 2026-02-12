import { NextRequest, NextResponse } from 'next/server';
import { getRecentBlocks } from '@/lib/evm/client';

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

    // Try backend API first
    try {
      const backendUrl = `${API_URL}/api/evm/blocks?chain=${chain}`;
      console.log('[EVM Blocks API] Fetching from backend:', backendUrl);
      
      const response = await fetch(backendUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.blocks && data.blocks.length > 0) {
          return NextResponse.json(data, {
            headers: {
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
            },
          });
        }
      }
      
      console.log('[EVM Blocks API] Backend unavailable, using direct RPC');
    } catch (backendError) {
      console.log('[EVM Blocks API] Backend error, using direct RPC:', backendError);
    }

    // Fallback to direct RPC
    console.log('[EVM Blocks API] Fetching directly from EVM RPC');
    const blocks = await getRecentBlocks(chain, 20);
    
    // Transform to match expected format
    const formattedBlocks = blocks.map(block => ({
      number: parseInt(block.number, 16),
      hash: block.hash,
      timestamp: parseInt(block.timestamp, 16),
      transactionsCount: block.transactionsCount,
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16),
      miner: block.miner
    }));
    
    return NextResponse.json({ blocks: formattedBlocks }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[EVM Blocks API] Error:', error);
    return NextResponse.json(
      { blocks: [], error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
