import { NextRequest, NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/evm/client';

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
      const backendUrl = `${API_URL}/api/evm/transactions?chain=${chain}`;
      console.log('[EVM Transactions API] Fetching from backend:', backendUrl);
      
      const response = await fetch(backendUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        const data = await response.json();
        if (data.transactions && data.transactions.length > 0) {
          return NextResponse.json(data, {
            headers: {
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
            },
          });
        }
      }
      
      console.log('[EVM Transactions API] Backend unavailable, using direct RPC');
    } catch (backendError) {
      console.log('[EVM Transactions API] Backend error, using direct RPC:', backendError);
    }

    // Fallback to direct RPC
    console.log('[EVM Transactions API] Fetching directly from EVM RPC');
    const transactions = await getRecentTransactions(chain, 10, 50);
    
    // Transform to match expected format
    const formattedTransactions = transactions.map(tx => ({
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber, 16),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gas: tx.gas,
      input: tx.input,
      nonce: parseInt(tx.nonce, 16)
    }));
    
    return NextResponse.json({ transactions: formattedTransactions }, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[EVM Transactions API] Error:', error);
    return NextResponse.json(
      { transactions: [], error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
