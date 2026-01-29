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

    // Fetch community pool from LCD
    const response = await fetch(`${restEndpoint}/cosmos/distribution/v1beta1/community_pool`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`LCD request failed: ${response.status}`);
    }

    return await response.json();
  }
});
