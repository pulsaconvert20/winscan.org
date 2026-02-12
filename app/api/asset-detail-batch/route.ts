import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Batch Asset Detail API
 * POST /api/asset-detail-batch
 * Body: { chain: string, denoms: string[] }
 * Returns: Array of asset details
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, denoms } = body;

    if (!chain || !Array.isArray(denoms) || denoms.length === 0) {
      return NextResponse.json({ 
        error: 'Chain and denoms array required' 
      }, { status: 400 });
    }

    console.log(`[Asset Detail Batch API] Fetching ${denoms.length} assets for ${chain}`);

    // Fetch all asset details in parallel (but limit concurrency)
    const BATCH_SIZE = 10; // Process 10 at a time to avoid overwhelming the server
    const results: any[] = [];
    
    for (let i = 0; i < denoms.length; i += BATCH_SIZE) {
      const batch = denoms.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(async (denom) => {
        try {
          const path = `/api/asset-detail?chain=${chain}&denom=${encodeURIComponent(denom)}`;
          
          // Use failover: SSL1 -> SSL2
          const data = await fetchJSONWithFailover(path, {
            headers: { 'Accept': 'application/json' }
          });
          
          return { denom, data };
        } catch (error: any) {
          console.error(`[Asset Detail Batch] Error for ${denom}:`, error.message);
          return { denom, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    console.log(`[Asset Detail Batch API] Completed ${results.length} requests`);

    return NextResponse.json({
      chain,
      total: results.length,
      results
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error: any) {
    console.error('[Asset Detail Batch API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
