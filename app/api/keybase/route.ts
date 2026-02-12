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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identity = searchParams.get('identity');

    if (!identity || identity.length < 16) {
      return NextResponse.json(
        { error: 'Invalid identity' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: 'Keybase API error' },
        { status: response.status }
      );
    }

    const data: KeybaseResponse = await response.json();

    if (data.status.code !== 0) {
      return NextResponse.json(
        { error: 'Identity not found' },
        { status: 404 }
      );
    }

    const avatarUrl = data.them?.[0]?.pictures?.primary?.url;

    if (!avatarUrl) {
      return NextResponse.json(
        { error: 'No avatar found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { avatarUrl },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
