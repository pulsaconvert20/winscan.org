import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const KEYBASE_API = 'https://keybase.io/_/api/1.0/user/lookup.json';

interface KeybaseResponse {
  status: {
    code: number;
    name: string;
  };
  them?: Array<{
    pictures?: {
      primary?: {
        url: string;
      };
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identities = body.identities as string[];

    if (!identities || !Array.isArray(identities) || identities.length === 0) {
      return NextResponse.json(
        { error: 'Invalid identities array' },
        { status: 400 }
      );
    }

    // Filter valid identities (16 chars)
    const validIdentities = identities.filter(id => id && id.length >= 16);

    if (validIdentities.length === 0) {
      return NextResponse.json(
        { error: 'No valid identities provided' },
        { status: 400 }
      );
    }

    // Batch request to Keybase (max 50 at a time)
    const batchSize = 50;
    const results: Record<string, string | null> = {};

    for (let i = 0; i < validIdentities.length; i += batchSize) {
      const batch = validIdentities.slice(i, i + batchSize);
      
      // Request all in parallel
      const promises = batch.map(async (identity) => {
        try {
          const response = await fetch(
            `${KEYBASE_API}?key_suffix=${identity}&fields=pictures`,
            {
              headers: {
                'User-Agent': 'WinScan-Explorer/1.0',
              },
              next: { revalidate: 86400 }
            }
          );

          if (!response.ok) {
            return { identity, avatarUrl: null };
          }

          const data: KeybaseResponse = await response.json();

          if (data.status.code !== 0) {
            return { identity, avatarUrl: null };
          }

          const avatarUrl = data.them?.[0]?.pictures?.primary?.url || null;
          return { identity, avatarUrl };
        } catch (error) {
          return { identity, avatarUrl: null };
        }
      });

      const batchResults = await Promise.all(promises);
      
      // Merge results
      batchResults.forEach(({ identity, avatarUrl }) => {
        results[identity] = avatarUrl;
      });
    }

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      }
    );
  } catch (error) {
    console.error('[Keybase Batch] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
