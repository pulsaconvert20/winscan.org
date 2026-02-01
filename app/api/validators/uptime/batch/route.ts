import { NextRequest, NextResponse } from 'next/server';
import { fetchJSONWithFailover } from '@/lib/sslLoadBalancer';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chain, validators } = body;

    if (!chain || !validators || !Array.isArray(validators)) {
      return NextResponse.json(
        { error: 'Chain and validators array required' },
        { status: 400 }
      );
    }

    console.log(`[Batch Validators Uptime] Fetching uptime for ${validators.length} validators on ${chain}`);

    // Fetch uptime for all validators in parallel with limit
    const BATCH_SIZE = 10;
    const results: { [key: string]: number } = {};

    for (let i = 0; i < validators.length; i += BATCH_SIZE) {
      const batch = validators.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (consensus: string) => {
        try {
          const path = `/api/validators/uptime?chain=${chain}&consensus=${encodeURIComponent(consensus)}`;
          
          // Use failover: SSL1 -> SSL2
          const data = await fetchJSONWithFailover(path, {
            headers: { 'Accept': 'application/json' }
          });
          
          return { consensus, uptime: data.uptime || 100 };
        } catch (error: any) {
          // Silent fail - just return default uptime
          if (error.name !== 'AbortError' && error.name !== 'TimeoutError') {
            console.error(`[Batch Uptime] Error for ${consensus}:`, error.message);
          }
          return { consensus, uptime: 100 };
        }
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ consensus, uptime }) => {
        results[consensus] = uptime;
      });
    }

    console.log(`[Batch Validators Uptime] Complete: ${Object.keys(results).length} results`);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
      }
    });

  } catch (error) {
    console.error('[Batch Validators Uptime] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
