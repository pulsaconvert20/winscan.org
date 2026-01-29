import { NextRequest, NextResponse } from 'next/server';
import { getBlockByNumber } from '@/lib/evm/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { number: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const blockNumber = params.number;

    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }

    if (!blockNumber) {
      return NextResponse.json({ error: 'Block number required' }, { status: 400 });
    }

    console.log(`[EVM Block Detail API] Fetching block ${blockNumber} for ${chain}`);
    
    // Parse block number (can be 'latest' or a number)
    const blockParam = blockNumber === 'latest' ? 'latest' : parseInt(blockNumber);
    
    // Fetch block with full transaction details
    const block = await getBlockByNumber(chain, blockParam, true);
    
    // Transform to match expected format
    const formattedBlock = {
      number: parseInt(block.number, 16),
      hash: block.hash,
      parentHash: block.parentHash,
      timestamp: parseInt(block.timestamp, 16),
      transactionsCount: block.transactionsCount,
      gasUsed: parseInt(block.gasUsed, 16),
      gasLimit: parseInt(block.gasLimit, 16),
      miner: block.miner,
      transactions: block.transactions
    };
    
    return NextResponse.json({ block: formattedBlock }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[EVM Block Detail API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch block' },
      { status: 500 }
    );
  }
}
