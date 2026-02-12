import { createRoute } from '@/lib/routes';
import { findChainConfig, getAllRestEndpoints, getMainDenom } from '@/lib/utils/chain-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: { ttl: 60000, staleWhileRevalidate: 120000 },
  handler: async ({ chain }) => {
    const chainConfig = findChainConfig(chain);

    if (!chainConfig) {
      console.log(`Chain not found: ${chain}`);
      throw new Error('Chain not found');
    }

    const lcdEndpoints = getAllRestEndpoints(chainConfig);
    if (lcdEndpoints.length === 0) {
      throw new Error('No LCD endpoints available');
    }

    for (const endpoint of lcdEndpoints) {
      try {
        const supplyUrl = `${endpoint.address}/cosmos/bank/v1beta1/supply`;
        console.log(`Fetching supply from: ${supplyUrl}`);

        const response = await fetch(supplyUrl, {
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          console.log(`${endpoint.provider}: HTTP ${response.status}`);
          continue;
        }

        const data = await response.json();

        const supply = data.supply || [];
        const mainDenom = getMainDenom(chainConfig) || supply[0]?.denom;
        const mainSupply = supply.find((s: any) => s.denom === mainDenom);
        
        const totalSupply = mainSupply?.amount || '0';

        console.log(`✓ Supply from ${endpoint.provider}: ${totalSupply}`);

        return {
          totalSupply,
          denom: mainDenom,
          allSupply: supply
        };

      } catch (error: any) {
        console.error(`${endpoint.provider || endpoint.address}: ${error.message}`);
        continue;
      }
    }

    throw new Error('All LCD endpoints failed');
  }
});
