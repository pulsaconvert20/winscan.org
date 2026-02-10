// GeoIP utility using ip-api.com free API (fallback from MaxMind databases)
import maxmind, { CityResponse, AsnResponse, Reader } from 'maxmind';
import path from 'path';

let cityLookup: Reader<CityResponse> | null = null;
let asnLookup: Reader<AsnResponse> | null = null;
let useApiMode = false;

// Initialize GeoIP City reader
export async function initGeoIP(): Promise<Reader<CityResponse> | null> {
  if (cityLookup) return cityLookup;
  if (useApiMode) return null;

  try {
    const dbPath = path.join(process.cwd(), 'data', 'GeoLite2-City.mmdb');
    cityLookup = await maxmind.open<CityResponse>(dbPath);
    console.log('[GeoIP] ✅ GeoLite2-City database loaded');
    return cityLookup;
  } catch (error: any) {
    console.warn('[GeoIP] Failed to load City database, switching to API mode:', error.message);
    useApiMode = true;
    return null;
  }
}

// Initialize GeoIP ASN reader
export async function initASN(): Promise<Reader<AsnResponse> | null> {
  if (asnLookup) return asnLookup;
  if (useApiMode) return null;

  try {
    const dbPath = path.join(process.cwd(), 'data', 'GeoLite2-ASN.mmdb');
    asnLookup = await maxmind.open<AsnResponse>(dbPath);
    console.log('[GeoIP] ✅ GeoLite2-ASN database loaded');
    return asnLookup;
  } catch (error: any) {
    console.warn('[GeoIP] Failed to load ASN database, switching to API mode:', error.message);
    useApiMode = true;
    return null;
  }
}

// Lookup IP using free API (ip-api.com)
async function lookupIPViaAPI(ip: string): Promise<{
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  provider?: string;
} | null> {
  try {
    // ip-api.com free tier: 45 requests per minute
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,lat,lon,isp,org,as,asname`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.error('[GeoIP API] Request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'success') {
      console.log('[GeoIP API] No data for IP:', ip, data.message);
      return null;
    }

    const city = data.city || 'Unknown';
    const country = data.country || 'Unknown';
    const countryCode = data.countryCode || 'XX';
    const latitude = data.lat || 0;
    const longitude = data.lon || 0;

    if (latitude === 0 && longitude === 0) {
      console.log('[GeoIP API] No valid coordinates for', ip);
      return null;
    }

    // Extract ASN and organization for provider detection
    const asMatch = data.as?.match(/^AS(\d+)/);
    const asn = asMatch ? asMatch[1] : undefined;
    const organization = data.org || data.isp || data.asname;
    const provider = detectProvider(ip, asn, organization);

    console.log('[GeoIP API] ✅ Found location for', ip, ':', { city, country, provider });

    return {
      city,
      country,
      countryCode,
      latitude,
      longitude,
      provider
    };
  } catch (error: any) {
    console.error('[GeoIP API] Lookup error for', ip, ':', error.message);
    return null;
  }
}

// Lookup IP address and get location
export async function lookupIP(ip: string): Promise<{
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  provider?: string;
} | null> {
  // Try local database first
  if (!useApiMode) {
    try {
      const lookup = await initGeoIP();
      if (lookup) {
        const result = lookup.get(ip);
        if (result) {
          const city = result.city?.names?.en || 'Unknown';
          const country = result.country?.names?.en || 'Unknown';
          const countryCode = result.country?.iso_code || 'XX';
          const latitude = result.location?.latitude || 0;
          const longitude = result.location?.longitude || 0;

          // Only return if we have valid coordinates
          if (latitude !== 0 || longitude !== 0) {
            // Get ASN data for provider detection
            let provider = 'Unknown';
            try {
              const asnDb = await initASN();
              if (asnDb) {
                const asnResult = asnDb.get(ip);
                if (asnResult) {
                  const asn = asnResult.autonomous_system_number?.toString();
                  const organization = asnResult.autonomous_system_organization;
                  provider = detectProvider(ip, asn, organization);
                } else {
                  provider = detectProvider(ip);
                }
              } else {
                provider = detectProvider(ip);
              }
            } catch (asnError: any) {
              provider = detectProvider(ip);
            }

            console.log('[GeoIP DB] ✅ Found location for', ip, ':', { city, country, provider });

            return {
              city,
              country,
              countryCode,
              latitude,
              longitude,
              provider
            };
          }
        }
      }
    } catch (error: any) {
      console.warn('[GeoIP DB] Lookup failed, falling back to API:', error.message);
      useApiMode = true;
    }
  }

  // Fallback to API
  return lookupIPViaAPI(ip);
}

// Extract IP from various formats
export function extractIP(address: string): string | null {
  // Remove protocol if present
  address = address.replace(/^(https?|tcp|wss?):\/\//, '');
  
  // Extract IP from address:port format
  const match = address.match(/^([^:]+)/);
  if (!match) return null;
  
  const ip = match[1];
  
  // Validate IP format (basic check)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return ip;
  }
  
  // If it's a domain, we can't geolocate it directly
  return null;
}

// Detect hosting provider based on IP and ASN
export function detectProvider(ip: string, asn?: string, organization?: string): string {
  // Common hosting provider patterns
  const providers: Record<string, RegExp[]> = {
    'AWS': [/amazon/i, /aws/i, /ec2/i, /amazonaws/i],
    'Google Cloud': [/google/i, /gcp/i, /cloud/i, /googleusercontent/i],
    'Microsoft Azure': [/microsoft/i, /azure/i, /msft/i],
    'DigitalOcean': [/digitalocean/i, /do-/i],
    'Hetzner': [/hetzner/i, /hetzner-online/i, /^AS24940$/],
    'OVH': [/ovh/i, /ovhcloud/i, /^AS16276$/],
    'Linode': [/linode/i, /akamai/i, /^AS63949$/],
    'Vultr': [/vultr/i, /choopa/i, /^AS20473$/],
    'Contabo': [/contabo/i, /^AS51167$/],
    'Netcup': [/netcup/i, /^AS197540$/],
    'Scaleway': [/scaleway/i, /online\.net/i, /^AS12876$/],
    'Alibaba Cloud': [/alibaba/i, /aliyun/i, /^AS45102$/],
    'Tencent Cloud': [/tencent/i, /^AS45090$/],
    'IBM Cloud': [/ibm/i, /softlayer/i, /^AS36351$/],
    'Oracle Cloud': [/oracle/i, /oraclecloud/i, /^AS31898$/],
    'Cloudflare': [/cloudflare/i, /^AS13335$/],
    'Fastly': [/fastly/i, /^AS54113$/],
  };

  const searchText = `${organization || ''} ${asn || ''}`.toLowerCase();

  for (const [provider, patterns] of Object.entries(providers)) {
    for (const pattern of patterns) {
      if (pattern.test(searchText)) {
        return provider;
      }
    }
  }

  // IP range-based detection for common providers
  const ipParts = ip.split('.').map(Number);
  if (ipParts.length === 4) {
    const firstOctet = ipParts[0];
    const secondOctet = ipParts[1];
    
    // Hetzner ranges
    if ((firstOctet === 65 && secondOctet === 21) || 
        (firstOctet === 135 && secondOctet === 181) ||
        (firstOctet === 144 && secondOctet === 91) ||
        (firstOctet === 168 && secondOctet === 119)) {
      return 'Hetzner';
    }
    
    // OVH ranges
    if ((firstOctet === 51 && [15, 38, 68, 75, 77, 79, 83, 89, 91, 195, 210, 222, 254, 255].includes(secondOctet)) ||
        (firstOctet === 54 && [36, 37, 38, 39].includes(secondOctet)) ||
        (firstOctet === 137 && [74].includes(secondOctet)) ||
        (firstOctet === 141 && [94, 95].includes(secondOctet)) ||
        (firstOctet === 144 && [217].includes(secondOctet)) ||
        (firstOctet === 145 && [239].includes(secondOctet)) ||
        (firstOctet === 147 && [135].includes(secondOctet)) ||
        (firstOctet === 151 && [80].includes(secondOctet)) ||
        (firstOctet === 152 && [228].includes(secondOctet)) ||
        (firstOctet === 164 && [132].includes(secondOctet)) ||
        (firstOctet === 167 && [114].includes(secondOctet)) ||
        (firstOctet === 178 && [32, 33].includes(secondOctet)) ||
        (firstOctet === 188 && [165].includes(secondOctet)) ||
        (firstOctet === 192 && [95].includes(secondOctet)) ||
        (firstOctet === 193 && [70].includes(secondOctet))) {
      return 'OVH';
    }
    
    // DigitalOcean ranges
    if ((firstOctet === 104 && [131, 236].includes(secondOctet)) ||
        (firstOctet === 134 && [209].includes(secondOctet)) ||
        (firstOctet === 138 && [68, 197].includes(secondOctet)) ||
        (firstOctet === 139 && [59].includes(secondOctet)) ||
        (firstOctet === 142 && [93].includes(secondOctet)) ||
        (firstOctet === 143 && [110, 198, 244].includes(secondOctet)) ||
        (firstOctet === 157 && [230, 245].includes(secondOctet)) ||
        (firstOctet === 159 && [65, 89, 203, 223].includes(secondOctet)) ||
        (firstOctet === 161 && [35].includes(secondOctet)) ||
        (firstOctet === 164 && [90, 92].includes(secondOctet)) ||
        (firstOctet === 165 && [22, 227].includes(secondOctet)) ||
        (firstOctet === 167 && [71, 99, 172].includes(secondOctet)) ||
        (firstOctet === 178 && [62, 128].includes(secondOctet)) ||
        (firstOctet === 188 && [166].includes(secondOctet)) ||
        (firstOctet === 206 && [189].includes(secondOctet)) ||
        (firstOctet === 207 && [154].includes(secondOctet))) {
      return 'DigitalOcean';
    }
    
    // Contabo ranges
    if ((firstOctet === 173 && [249].includes(secondOctet)) ||
        (firstOctet === 207 && [180].includes(secondOctet)) ||
        (firstOctet === 213 && [136, 239].includes(secondOctet))) {
      return 'Contabo';
    }
  }

  return 'Others';
}
