import { NextRequest, NextResponse } from 'next/server';
import { discoverERC20Tokens, getERC20TokenInfo } from '@/lib/evm/client';

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
      const backendUrl = `${API_URL}/api/evm/tokens?chain=${chain}`;
      console.log('[EVM Tokens API] Fetching from backend:', backendUrl);
      
      const response = await fetch(backendUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 15 },
        signal: AbortSignal.timeout(10000) // Increase to 10 seconds
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tokens && data.tokens.length > 0) {
          return NextResponse.json(data, {
            headers: {
              'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
            },
          });
        }
      }
      
      console.log('[EVM Tokens API] Backend unavailable, using direct RPC');
    } catch (backendError: any) {
      console.log('[EVM Tokens API] Backend error, using direct RPC');
    }

    // Fallback to direct RPC - discover tokens from recent Transfer events
    console.log('[EVM Tokens API] Discovering tokens from blockchain...');
    const tokenAddresses = await discoverERC20Tokens(chain, 10000); // Last 10k blocks (RPC limit)
    
    if (tokenAddresses.length === 0) {
      return NextResponse.json({ 
        tokens: [], 
        message: 'No tokens found in recent blocks' 
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Get token info for discovered tokens (limit to first 20 to avoid timeout)
    const tokensToFetch = tokenAddresses.slice(0, 20);
    console.log(`[EVM Tokens API] Fetching info for ${tokensToFetch.length} tokens...`);
    
    const tokenInfoPromises = tokensToFetch.map(address => 
      getERC20TokenInfo(chain, address).catch(err => {
        console.error(`Failed to get info for ${address}:`, err);
        return null;
      })
    );
    
    const tokenInfos = await Promise.all(tokenInfoPromises);
    const validTokens = tokenInfos.filter((t): t is NonNullable<typeof t> => t !== null);

    console.log(`[EVM Tokens API] Found ${validTokens.length} valid tokens out of ${tokensToFetch.length}`);

    return NextResponse.json({ 
      tokens: validTokens,
      total: tokenAddresses.length,
      showing: validTokens.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[EVM Tokens API] Error:', error);
    return NextResponse.json(
      { tokens: [], error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
