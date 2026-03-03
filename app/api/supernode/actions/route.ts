import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supernode = searchParams.get('supernode');
    const limit = searchParams.get('limit') || '50';
    const includeTransactions = searchParams.get('include_transactions') === 'true';
    
    if (!supernode) {
      return NextResponse.json(
        { error: 'Supernode address is required' },
        { status: 400 }
      );
    }

    // Build the URL with proper parameters
    const url = new URL('https://snscope.lumera.io/v1/actions');
    url.searchParams.set('supernode', supernode);
    url.searchParams.set('limit', limit);
    if (includeTransactions) {
      url.searchParams.set('include_transactions', 'true');
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 30 } // Cache for 30 seconds
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the data in the expected format
    return NextResponse.json({
      items: Array.isArray(data) ? data : (data.items || []),
      total: Array.isArray(data) ? data.length : (data.total || 0)
    });
  } catch (error: any) {
    console.error('Error fetching supernode actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supernode actions', message: error.message },
      { status: 500 }
    );
  }
}
