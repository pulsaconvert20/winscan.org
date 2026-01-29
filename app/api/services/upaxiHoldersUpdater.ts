import axios from 'axios';

interface HolderBalance {
  address: string;
  balance: string;
  percentage?: number;
}

interface HoldersCache {
  lastUpdate: number;
  totalSupply: string;
  holders: HolderBalance[];
}

const BACKEND_URL = 'https://ssl.winsnip.xyz';

export async function loadHoldersCache(): Promise<HoldersCache> {
  try {
    // Fetch from backend cache endpoint
    const response = await axios.get(`${BACKEND_URL}/api/holders?chain=paxi-mainnet&denom=upaxi&limit=10000`, {
      timeout: 30000
    });
    
    if (response.data && response.data.from_cache) {
      return {
        lastUpdate: response.data.lastUpdate || Date.now(),
        totalSupply: response.data.totalSupply || '0',
        holders: response.data.holders || []
      };
    }
  } catch (error) {
    console.error('[UPAXI Holders] Error loading cache from backend:', error);
  }
  
  return {
    lastUpdate: 0,
    totalSupply: '0',
    holders: []
  };
}
