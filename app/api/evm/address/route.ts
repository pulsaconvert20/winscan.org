import { NextRequest, NextResponse } from 'next/server';
import { 
  getBalance, 
  getTransactionCount,
  getAddressTransactions,
  discoverAddressTokens,
  getAddressTokenBalances,
  discoverAddressNFTs,
  isContract,
  getCode
} from '@/lib/evm/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

const API_URL = process.env.API_URL || 'https://ssl.winsnip.xyz';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const chain = searchParams.get('chain');
    const address = searchParams.get('address');

    if (!chain) {
      return NextResponse.json({ error: 'Chain parameter required' }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({ error: 'Address parameter required' }, { status: 400 });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    console.log(`[EVM Address API] Fetching details for ${address} on ${chain}`);

    // Try backend API first
    try {
      const backendUrl = `${API_URL}/api/evm/address/${address}?chain=${chain}`;
      console.log('[EVM Address API] Trying backend:', backendUrl);
      
      const response = await fetch(backendUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.address && !data.error) {
          console.log('[EVM Address API] Backend success');
          return NextResponse.json(data, {
            headers: {
              'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
            },
          });
        }
      }
      
      console.log('[EVM Address API] Backend unavailable, using direct RPC');
    } catch (backendError) {
      console.log('[EVM Address API] Backend error, using direct RPC:', backendError);
    }

    // Fallback to direct RPC
    console.log('[EVM Address API] Fetching from blockchain...');
    
    // Fetch basic info in parallel
    const [balance, txCount, isContractAddr] = await Promise.all([
      getBalance(chain, address),
      getTransactionCount(chain, address),
      isContract(chain, address)
    ]);

    // Get recent transactions (limit to 1000 blocks for performance)
    console.log('[EVM Address API] Fetching transactions...');
    const transactions = await getAddressTransactions(chain, address, 1000);
    
    // Combine sent and received, sort by block number
    const allTxs = [...transactions.sent, ...transactions.received]
      .sort((a, b) => {
        const blockA = parseInt(a.blockNumber, 16);
        const blockB = parseInt(b.blockNumber, 16);
        return blockB - blockA; // Descending
      })
      .slice(0, 50); // Limit to 50 most recent

    // Format transactions
    const formattedTxs = allTxs.map(tx => ({
      hash: tx.hash,
      blockNumber: parseInt(tx.blockNumber, 16),
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gas: tx.gas,
      input: tx.input,
      nonce: parseInt(tx.nonce, 16),
      timestamp: Math.floor(Date.now() / 1000) // Approximate
    }));

    // Discover tokens (only if not a contract)
    let tokenBalances: any[] = [];
    if (!isContractAddr) {
      try {
        console.log('[EVM Address API] Discovering tokens...');
        const tokenAddresses = await discoverAddressTokens(chain, address, 10000);
        
        if (tokenAddresses.length > 0) {
          console.log(`[EVM Address API] Found ${tokenAddresses.length} tokens, fetching balances...`);
          tokenBalances = await getAddressTokenBalances(chain, address, tokenAddresses.slice(0, 20));
        }
      } catch (error) {
        console.error('[EVM Address API] Token discovery failed:', error);
      }
    }

    // Discover NFTs (only if not a contract)
    let nftBalances: any[] = [];
    if (!isContractAddr) {
      try {
        console.log('[EVM Address API] Discovering NFTs...');
        nftBalances = await discoverAddressNFTs(chain, address, 10000);
        console.log(`[EVM Address API] Found ${nftBalances.length} NFTs`);
      } catch (error) {
        console.error('[EVM Address API] NFT discovery failed:', error);
      }
    }

    const result = {
      address,
      balance,
      balanceFormatted: (parseInt(balance, 16) / 1e18).toFixed(6),
      transactionCount: txCount,
      isContract: isContractAddr,
      transactions: formattedTxs,
      tokenBalances,
      nftBalances,
      stats: {
        totalTransactions: transactions.total,
        sent: transactions.sent.length,
        received: transactions.received.length,
        tokens: tokenBalances.length,
        nfts: nftBalances.length
      }
    };

    console.log('[EVM Address API] Success:', {
      txs: formattedTxs.length,
      tokens: tokenBalances.length,
      nfts: nftBalances.length
    });

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[EVM Address API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
