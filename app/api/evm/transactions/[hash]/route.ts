import { NextRequest, NextResponse } from 'next/server';
import { getTransactionByHash, getTransactionReceipt } from '@/lib/evm/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const { hash: txHash } = await params;

    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash required' }, { status: 400 });
    }

    console.log(`[EVM Transaction Detail API] Fetching tx ${txHash} for ${chain}`);
    
    // Fetch transaction and receipt in parallel
    const [transaction, receipt] = await Promise.all([
      getTransactionByHash(chain, txHash),
      getTransactionReceipt(chain, txHash).catch(() => null) // Receipt might not exist for pending tx
    ]);
    
    // Transform to match expected format
    const formattedTransaction = {
      hash: transaction.hash,
      blockNumber: parseInt(transaction.blockNumber, 16),
      blockHash: transaction.blockHash,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      gas: parseInt(transaction.gas, 16),
      gasPrice: transaction.gasPrice,
      input: transaction.input,
      nonce: parseInt(transaction.nonce, 16),
      transactionIndex: parseInt(transaction.transactionIndex, 16),
      receipt: receipt ? {
        status: receipt.status === '0x1' ? 'success' : 'failed',
        gasUsed: parseInt(receipt.gasUsed, 16),
        cumulativeGasUsed: parseInt(receipt.cumulativeGasUsed, 16),
        contractAddress: receipt.contractAddress,
        logs: receipt.logs
      } : null
    };
    
    return NextResponse.json({ transaction: formattedTransaction }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[EVM Transaction Detail API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}
