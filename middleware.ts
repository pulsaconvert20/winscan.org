import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Domain whitelist check
function isAllowedDomain(host: string): boolean {
  const allowedDomains = process.env.NEXT_PUBLIC_ALLOWED_DOMAINS;
  
  // If no whitelist configured, allow all
  if (!allowedDomains || allowedDomains.trim() === '') {
    return true;
  }
  
  const whitelist = allowedDomains.split(',').map(d => d.trim().toLowerCase());
  const hostWithoutPort = host.split(':')[0].toLowerCase();
  
  // Check if host matches any whitelisted domain
  return whitelist.some(domain => {
    return hostWithoutPort === domain || hostWithoutPort.endsWith(`.${domain}`);
  });
}

// Chain subdomain mapping
const CHAIN_SUBDOMAINS: Record<string, string> = {
  // Mainnets - format: chainname.winscan.org
  'epix': 'epix-mainnet',
  'osmosis': 'osmosis-mainnet',
  'cosmoshub': 'cosmoshub-mainnet',
  'lumera': 'lumera-mainnet',
  'lumen': 'lumen-mainnet',
  'injective': 'injective-mainnet',
  'noble': 'noble-mainnet',
  'lava': 'lava-mainnet',
  'warden': 'warden-mainnet',
  'zenrock': 'zenrock-mainnet',
  'shido': 'shido-mainnet',
  'kiichain': 'kiichain-mainnet',
  'sunrise': 'sunrise-mainnet',
  'gitopia': 'gitopia-mainnet',
  'humans': 'humans-mainnet',
  'uptick': 'uptick-mainnet',
  'axone': 'axone-mainnet',
  'atomone': 'atomone-mainnet',
  'tellor': 'tellor-mainnet',
  'xrpl': 'xrpl-mainnet',
  'paxi': 'paxi-mainnet',
  'cysic': 'cysic-mainnet',
  'bitbadges': 'bitbadges-1',
  
  // Testnets - format: chainname-testnet.winscan.org
  'epix-testnet': 'epix-test',
  'osmosis-testnet': 'osmosis-test',
  'cosmoshub-testnet': 'cosmoshub-test',
  'lumera-testnet': 'lumera-test',
  'noble-testnet': 'noble-test',
  'kiichain-testnet': 'kiichain-test',
  'warden-testnet': 'warden-test',
  'zenrock-testnet': 'zenrock-test',
  'xrpl-testnet': 'xrpl-test',
  'atomone-testnet': 'atomone-test',
  'empeiria-testnet': 'empeiria-test',
  'republicai-testnet': 'republicai-test',
  'safrochain-testnet': 'safrochain-test',
};

// Reverse mapping: chain folder name -> subdomain
const CHAIN_TO_SUBDOMAIN: Record<string, string> = Object.entries(CHAIN_SUBDOMAINS).reduce(
  (acc, [subdomain, chainName]) => {
    acc[chainName] = subdomain;
    return acc;
  },
  {} as Record<string, string>
);

// Main domains that should NOT be treated as subdomains
const MAIN_DOMAINS = ['winscan.org', 'winscan.winsnip.xyz', 'localhost'];

// Get the main domain from host
function getMainDomain(host: string): string | null {
  const hostWithoutPort = host.split(':')[0];
  for (const mainDomain of MAIN_DOMAINS) {
    if (hostWithoutPort === mainDomain || hostWithoutPort.endsWith(`.${mainDomain}`)) {
      return mainDomain;
    }
  }
  return null;
}

function getSubdomain(host: string): string | null {
  // Remove port if present
  const hostWithoutPort = host.split(':')[0];
  
  // Check if it's a main domain
  for (const mainDomain of MAIN_DOMAINS) {
    if (hostWithoutPort === mainDomain || hostWithoutPort === `www.${mainDomain}`) {
      return null;
    }
    
    // Check for subdomain pattern (e.g., epix.winscan.org)
    if (hostWithoutPort.endsWith(`.${mainDomain}`)) {
      const subdomain = hostWithoutPort.replace(`.${mainDomain}`, '');
      // Ignore www
      if (subdomain === 'www') return null;
      return subdomain;
    }
  }
  
  return null;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  // Check domain whitelist
  if (!isAllowedDomain(host)) {
    return new NextResponse(
      JSON.stringify({
        error: 'Access Denied',
        message: 'This domain is not authorized to access this service.',
        code: 'DOMAIN_NOT_WHITELISTED'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
  
  const subdomain = getSubdomain(host);
  const mainDomain = getMainDomain(host);
  const pathname = request.nextUrl.pathname;
  
  // Check if path starts with a different chain (user switched chain via selector)
  // Redirect to correct subdomain
  if (subdomain && mainDomain) {
    const pathParts = pathname.split('/').filter(Boolean);
    const firstPathSegment = pathParts[0];
    
    // Check if first path segment is a chain
    if (firstPathSegment && CHAIN_TO_SUBDOMAIN[firstPathSegment]) {
      const targetSubdomain = CHAIN_TO_SUBDOMAIN[firstPathSegment];
      
      // If same chain as subdomain, remove chain from path (avoid duplication)
      // e.g., kiichain.winscan.org/kiichain-mainnet/blocks -> kiichain.winscan.org/blocks
      if (targetSubdomain === subdomain) {
        const restOfPath = pathParts.slice(1).join('/');
        if (restOfPath) {
          const newUrl = `https://${subdomain}.${mainDomain}/${restOfPath}`;
          return NextResponse.redirect(newUrl);
        }
      } else {
        // If navigating to a different chain, redirect to its subdomain
        const restOfPath = pathParts.slice(1).join('/');
        const newUrl = `https://${targetSubdomain}.${mainDomain}${restOfPath ? '/' + restOfPath : ''}`;
        return NextResponse.redirect(newUrl);
      }
    }
  }
  
  // Handle subdomain routing
  if (subdomain) {
    const chainName = CHAIN_SUBDOMAINS[subdomain];
    
    if (chainName) {
      // Don't rewrite if already has chain in path or is API/static
      if (
        !pathname.startsWith(`/${chainName}`) &&
        !pathname.startsWith('/api/') &&
        !pathname.startsWith('/_next/') &&
        !pathname.startsWith('/icon') &&
        pathname !== '/favicon.ico'
      ) {
        // Rewrite to chain-specific path
        const url = request.nextUrl.clone();
        url.pathname = `/${chainName}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // Clean URL parameters - remove leading/trailing spaces from path segments
  const cleanedPathname = pathname
    .split('/')
    .map(segment => decodeURIComponent(segment).trim())
    .map(segment => encodeURIComponent(segment))
    .join('/');
  
  // Redirect if pathname has changed after cleaning
  if (cleanedPathname !== pathname && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = cleanedPathname;
    return NextResponse.redirect(url);
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Force no-cache for API routes
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: response.headers 
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)', '/api/:path*'],
};
