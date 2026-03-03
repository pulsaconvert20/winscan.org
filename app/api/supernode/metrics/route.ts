import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') || '200';
    
    const response = await fetch(
      `https://snscope.lumera.io/v1/supernodes/metrics?limit=${limit}`,
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
    console.error('Error fetching supernode metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supernode metrics', message: error.message },
      { status: 500 }
    );
  }
}
