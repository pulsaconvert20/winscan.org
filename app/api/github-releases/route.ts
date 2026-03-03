import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo');

    if (!repo) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Extract owner and repo name from GitHub URL
    // e.g., https://github.com/paxi-web3/paxi -> paxi-web3/paxi
    const match = repo.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repoName] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/releases/latest`;

    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'WinScan-Explorer'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'No releases found for this repository' },
          { status: 404 }
        );
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      version: data.tag_name,
      name: data.name,
      published_at: data.published_at,
      body: data.body,
      html_url: data.html_url,
      assets: data.assets.map((asset: any) => ({
        name: asset.name,
        size: asset.size,
        download_url: asset.browser_download_url
      }))
    });
  } catch (error) {
    console.error('Error fetching GitHub releases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch release information' },
      { status: 500 }
    );
  }
}
