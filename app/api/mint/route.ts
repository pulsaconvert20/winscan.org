import { createRoute } from '@/lib/routes';
import { findChainConfig, getRestEndpoint } from '@/lib/utils/chain-config';

export const GET = createRoute({
  requiredParams: ['chain'],
  cacheConfig: { ttl: 60000, staleWhileRevalidate: 120000 },
  handler: async ({ chain }) => {
    // Load chain config
    const selectedChain = findChainConfig(chain);

    if (!selectedChain) {
      throw new Error('Chain not found');
    }

    const restEndpoint = getRestEndpoint(selectedChain);
    if (!restEndpoint) {
      throw new Error('No REST endpoint available');
    }

    // Fetch mint data (inflation, annual provisions) from LCD
    const response = await fetch(`${restEndpoint}/cosmos/mint/v1beta1/inflation`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      // If mint module not available (501 or 404), return default values
      if (response.status === 501 || response.status === 404) {
        console.log(`Chain ${chain} does not support mint module (${response.status})`);
        return {
          inflation: '0',
          annualProvisions: null,
          note: 'Mint module not available for this chain'
        };
      }
      throw new Error(`LCD request failed: ${response.status}`);
    }

    const inflationData = await response.json();
    
    // Also fetch annual provisions
    let annualProvisions = null;
    try {
      const provisionsResponse = await fetch(`${restEndpoint}/cosmos/mint/v1beta1/annual_provisions`, {
        headers: { 'Accept': 'application/json' }
      });
      if (provisionsResponse.ok) {
        const provisionsData = await provisionsResponse.json();
        annualProvisions = provisionsData.annual_provisions;
      }
    } catch (err) {
      console.log('Could not fetch annual provisions:', err);
    }

    return {
      inflation: inflationData.inflation,
      annualProvisions
    };
  }
});
