import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Pool {
  id: string;
  token1: string;
  token2: string;
  liquidity: string;
  volume24h?: string;
}

interface SwapRoute {
  poolId: string;
  tokenIn: string;
  tokenOut: string;
  estimatedOutput: string;
  priceImpact: number;
}

// Cache untuk pool data (5 menit)
let poolsCache: { data: Pool[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Query all active pools from Osmosis
 */
async function queryOsmosisPools(): Promise<Pool[]> {
  // Check cache first
  if (poolsCache && Date.now() - poolsCache.timestamp < CACHE_TTL) {
    console.log('[Osmosis Pools] Using cached data');
    return poolsCache.data;
  }

  try {
    console.log('[Osmosis Pools] Fetching fresh pool data...');
    const rpcUrl = 'https://lcd.osmosis.zone';
    
    // Query pools from Osmosis LCD
    const response = await fetch(`${rpcUrl}/osmosis/gamm/v1beta1/pools?pagination.limit=1000`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error('[Osmosis Pools] Query failed:', response.status);
      throw new Error(`Failed to query pools: ${response.status}`);
    }

    const data = await response.json();
    const pools: Pool[] = [];

    console.log('[Osmosis Pools] Processing pools...');
    
    // Parse pool data
    for (const pool of data.pools || []) {
      if (pool['@type'] === '/osmosis.gamm.v1beta1.Pool') {
        const poolAssets = pool.pool_assets || [];
        
        if (poolAssets.length >= 2) {
          pools.push({
            id: pool.id,
            token1: poolAssets[0].token.denom,
            token2: poolAssets[1].token.denom,
            liquidity: pool.total_shares?.amount || '0',
          });
        }
      }
    }

    console.log(`[Osmosis Pools] Loaded ${pools.length} pools`);

    // Update cache
    poolsCache = {
      data: pools,
      timestamp: Date.now()
    };

    return pools;
  } catch (error) {
    console.error('[Osmosis Pools] Error querying pools:', error);
    
    // Return cached data if available, even if expired
    if (poolsCache) {
      console.log('[Osmosis Pools] Returning stale cache due to error');
      return poolsCache.data;
    }
    
    return [];
  }
}

/**
 * Find best swap route for token pair
 */
function findBestRoute(
  pools: Pool[],
  tokenIn: string,
  tokenOut: string
): SwapRoute | null {
  console.log(`[Osmosis Pools] Finding route for ${tokenIn} -> ${tokenOut}`);
  console.log(`[Osmosis Pools] Available pools: ${pools.length}`);
  
  // Normalize function that handles IBC denoms (case-insensitive for IBC hashes)
  const normalizeDenom = (denom: string): string => {
    if (denom.startsWith('ibc/') || denom.startsWith('IBC/')) {
      // IBC denoms: normalize to lowercase for comparison
      return denom.toLowerCase();
    }
    // Native denoms: keep as-is (already lowercase like uosmo, uatom)
    return denom.toLowerCase();
  };
  
  const normalizeTokenIn = normalizeDenom(tokenIn);
  const normalizeTokenOut = normalizeDenom(tokenOut);
  
  console.log(`[Osmosis Pools] Normalized: ${normalizeTokenIn} -> ${normalizeTokenOut}`);
  
  // Direct route (single pool)
  const directPool = pools.find(
    p => {
      const t1 = normalizeDenom(p.token1);
      const t2 = normalizeDenom(p.token2);
      return (t1 === normalizeTokenIn && t2 === normalizeTokenOut) ||
             (t2 === normalizeTokenIn && t1 === normalizeTokenOut);
    }
  );

  if (directPool) {
    console.log(`[Osmosis Pools] Found direct route via pool ${directPool.id}`);
    console.log(`[Osmosis Pools] Pool tokens: ${directPool.token1} <-> ${directPool.token2}`);
    return {
      poolId: directPool.id,
      tokenIn,
      tokenOut,
      estimatedOutput: '0', // Will be calculated on-chain
      priceImpact: 0,
    };
  }

  // Multi-hop route via OSMO
  const osmoToken = 'uosmo';
  
  if (normalizeTokenIn !== osmoToken && normalizeTokenOut !== osmoToken) {
    const pool1 = pools.find(
      p => {
        const t1 = normalizeDenom(p.token1);
        const t2 = normalizeDenom(p.token2);
        return (t1 === normalizeTokenIn && t2 === osmoToken) ||
               (t2 === normalizeTokenIn && t1 === osmoToken);
      }
    );
    
    const pool2 = pools.find(
      p => {
        const t1 = normalizeDenom(p.token1);
        const t2 = normalizeDenom(p.token2);
        return (t1 === osmoToken && t2 === normalizeTokenOut) ||
               (t2 === osmoToken && t1 === normalizeTokenOut);
      }
    );

    if (pool1 && pool2) {
      console.log(`[Osmosis Pools] Found multi-hop route: ${pool1.id} -> ${pool2.id}`);
      console.log(`[Osmosis Pools] Pool1 tokens: ${pool1.token1} <-> ${pool1.token2}`);
      console.log(`[Osmosis Pools] Pool2 tokens: ${pool2.token1} <-> ${pool2.token2}`);
      return {
        poolId: `${pool1.id},${pool2.id}`, // Multi-hop
        tokenIn,
        tokenOut,
        estimatedOutput: '0',
        priceImpact: 0,
      };
    }
    
    if (pool1) {
      console.log(`[Osmosis Pools] Found partial route (pool1): ${pool1.id}`);
      console.log(`[Osmosis Pools] Pool1 tokens: ${pool1.token1} <-> ${pool1.token2}`);
    }
    if (pool2) {
      console.log(`[Osmosis Pools] Found partial route (pool2): ${pool2.id}`);
      console.log(`[Osmosis Pools] Pool2 tokens: ${pool2.token1} <-> ${pool2.token2}`);
    }
  }

  console.log(`[Osmosis Pools] No route found for ${tokenIn} -> ${tokenOut}`);
  
  // Debug: Show sample of pool tokens to help diagnose
  const samplePools = pools.slice(0, 5);
  console.log(`[Osmosis Pools] Sample pool tokens:`, samplePools.map(p => ({
    id: p.id,
    token1: p.token1,
    token2: p.token2
  })));
  
  return null;
}

/**
 * Get pool info by ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const tokenIn = searchParams.get('tokenIn');
    const tokenOut = searchParams.get('tokenOut');
    const poolId = searchParams.get('poolId');

    // Action: List all pools
    if (action === 'list') {
      const pools = await queryOsmosisPools();
      return NextResponse.json({
        pools,
        count: pools.length,
        cached: poolsCache !== null,
      });
    }

    // Action: Find route
    if (action === 'route' && tokenIn && tokenOut) {
      console.log(`[Osmosis Pools API] Route request: ${tokenIn} -> ${tokenOut}`);
      
      const pools = await queryOsmosisPools();
      console.log(`[Osmosis Pools API] Loaded ${pools.length} pools`);
      
      // Debug: Check if tokenIn exists in any pool
      const poolsWithTokenIn = pools.filter(p => 
        p.token1.toLowerCase() === tokenIn.toLowerCase() || 
        p.token2.toLowerCase() === tokenIn.toLowerCase()
      );
      console.log(`[Osmosis Pools API] Pools containing tokenIn: ${poolsWithTokenIn.length}`);
      if (poolsWithTokenIn.length > 0) {
        console.log(`[Osmosis Pools API] Sample pools with tokenIn:`, poolsWithTokenIn.slice(0, 3).map(p => ({
          id: p.id,
          token1: p.token1,
          token2: p.token2
        })));
      }
      
      const route = findBestRoute(pools, tokenIn, tokenOut);

      if (!route) {
        console.log(`[Osmosis Pools API] No route found`);
        
        // Return helpful debug info
        return NextResponse.json(
          { 
            error: 'No route found for this token pair',
            debug: {
              tokenIn,
              tokenOut,
              totalPools: pools.length,
              poolsWithTokenIn: poolsWithTokenIn.length,
              suggestion: poolsWithTokenIn.length === 0 
                ? 'Token does not exist on Osmosis yet. It needs to be transferred via IBC first before pools can be created.'
                : 'No direct or multi-hop route found. Token may have low liquidity.',
              samplePoolsWithToken: poolsWithTokenIn.slice(0, 3).map(p => ({
                poolId: p.id,
                token1: p.token1,
                token2: p.token2
              }))
            }
          },
          { status: 404 }
        );
      }

      console.log(`[Osmosis Pools API] Route found: ${route.poolId}`);
      return NextResponse.json({ route });
    }

    // Action: Get pool details
    if (action === 'pool' && poolId) {
      const pools = await queryOsmosisPools();
      const pool = pools.find(p => p.id === poolId);

      if (!pool) {
        return NextResponse.json(
          { error: 'Pool not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ pool });
    }

    // Default: Return supported tokens for auto-swap
    const pools = await queryOsmosisPools();
    
    // Get unique tokens with liquidity
    const tokenMap = new Map<string, { denom: string; pools: number; totalLiquidity: bigint }>();
    
    for (const pool of pools) {
      for (const token of [pool.token1, pool.token2]) {
        const existing = tokenMap.get(token);
        const liquidity = BigInt(pool.liquidity || '0');
        
        if (existing) {
          existing.pools++;
          existing.totalLiquidity += liquidity;
        } else {
          tokenMap.set(token, {
            denom: token,
            pools: 1,
            totalLiquidity: liquidity,
          });
        }
      }
    }

    // Convert to array and sort by liquidity
    const tokens = Array.from(tokenMap.values())
      .sort((a, b) => Number(b.totalLiquidity - a.totalLiquidity))
      .slice(0, 50); // Top 50 tokens

    // Map common denoms to symbols
    const tokenSymbols: Record<string, string> = {
      'uosmo': 'OSMO',
      'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2': 'ATOM',
      'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858': 'USDC',
      'ibc/4ABBEF4C8926DDDB320AE5188CFD63267ABBCEFC0583E4AE05D6E5AA2401DDAB': 'USDT',
      'ibc/32C4AEE2B3C4F767A351FA821AB0140B10CB690CDED27D9FCC857859B44432B9': 'LUME',
    };

    const supportedTokens = tokens.map(t => ({
      denom: t.denom,
      symbol: tokenSymbols[t.denom] || t.denom.slice(0, 8),
      pools: t.pools,
      liquidity: t.totalLiquidity.toString(),
    }));

    return NextResponse.json({
      tokens: supportedTokens,
      totalPools: pools.length,
    });
  } catch (error) {
    console.error('[Osmosis Pools API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
