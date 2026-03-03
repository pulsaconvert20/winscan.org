import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'ACTION_TYPE_CASCADE';
    
    if (!address) {
      return NextResponse.json(
        { error: 'Supernode address is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://snscope.lumera.io/v1/supernodes/action-stats?address=${address}&type=${type}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 30 } // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching supernode action stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supernode action stats', message: error.message },
      { status: 500 }
    );
  }
}