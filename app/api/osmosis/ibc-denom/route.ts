import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Calculate IBC denom hash
 * Formula: ibc/HASH where HASH = SHA256(path/baseDenom)
 */
function calculateIBCDenom(path: string, baseDenom: string): string {
  const fullPath = `${path}/${baseDenom}`;
  const hash = crypto.createHash('sha256').update(fullPath).digest('hex').toUpperCase();
  return `ibc/${hash}`;
}

/**
 * Query IBC denom trace from Osmosis
 */
async function queryDenomTrace(ibcDenom: string): Promise<any> {
  try {
    const hash = ibcDenom.replace('ibc/', '');
    const rpcUrl = 'https://lcd.osmosis.zone';
    
    const response = await fetch(`${rpcUrl}/ibc/apps/transfer/v1/denom_traces/${hash}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.denom_trace;
  } catch (error) {
    console.error('Error querying denom trace:', error);
    return null;
  }
}

/**
 * Find IBC denom for a source chain token on Osmosis
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceChain = searchParams.get('sourceChain');
    const baseDenom = searchParams.get('baseDenom');
    const channelId = searchParams.get('channelId');

    if (!sourceChain || !baseDenom) {
      return NextResponse.json(
        { error: 'sourceChain and baseDenom parameters required' },
        { status: 400 }
      );
    }

    // Known IBC denoms (cache untuk chains populer)
    const knownDenoms: Record<string, Record<string, string>> = {
      'lumera-mainnet': {
        'ulume': 'ibc/32C4AEE2B3C4F767A351FA821AB0140B10CB690CDED27D9FCC857859B44432B9',
      },
      'cosmoshub-mainnet': {
        'uatom': 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2',
      },
      'noble-mainnet': {
        'uusdc': 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858',
      },
    };

    // Check known denoms first
    const knownDenom = knownDenoms[sourceChain]?.[baseDenom];
    if (knownDenom) {
      return NextResponse.json({
        ibcDenom: knownDenom,
        baseDenom,
        sourceChain,
        method: 'cached',
      });
    }

    // If channel ID provided, calculate IBC denom
    if (channelId) {
      const path = `transfer/${channelId}`;
      const calculatedDenom = calculateIBCDenom(path, baseDenom);

      // Verify with Osmosis
      const trace = await queryDenomTrace(calculatedDenom);
      
      if (trace) {
        return NextResponse.json({
          ibcDenom: calculatedDenom,
          baseDenom: trace.base_denom,
          path: trace.path,
          sourceChain,
          method: 'calculated',
          verified: true,
        });
      }

      return NextResponse.json({
        ibcDenom: calculatedDenom,
        baseDenom,
        path,
        sourceChain,
        method: 'calculated',
        verified: false,
        warning: 'Could not verify denom on Osmosis. It may not exist yet.',
      });
    }

    // Try to find via Osmosis LCD (query all denom traces)
    try {
      const rpcUrl = 'https://lcd.osmosis.zone';
      const response = await fetch(`${rpcUrl}/ibc/apps/transfer/v1/denom_traces?pagination.limit=1000`, {
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        const traces = data.denom_traces || [];

        // Find matching base denom
        const matchingTrace = traces.find((t: any) => 
          t.base_denom === baseDenom && t.path.includes('transfer/')
        );

        if (matchingTrace) {
          const hash = crypto.createHash('sha256')
            .update(`${matchingTrace.path}/${matchingTrace.base_denom}`)
            .digest('hex')
            .toUpperCase();

          return NextResponse.json({
            ibcDenom: `ibc/${hash}`,
            baseDenom: matchingTrace.base_denom,
            path: matchingTrace.path,
            sourceChain,
            method: 'queried',
            verified: true,
          });
        }
      }
    } catch (error) {
      console.error('Error querying denom traces:', error);
    }

    return NextResponse.json(
      { 
        error: 'IBC denom not found. Please provide channelId or ensure the token has been transferred to Osmosis before.',
        sourceChain,
        baseDenom,
        hint: 'Add ?channelId=channel-X to calculate the IBC denom',
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('[Osmosis IBC Denom API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
