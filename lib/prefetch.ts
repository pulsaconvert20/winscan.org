import { getCacheKey, setCache, getStaleCache } from './cacheUtils';
import { fetchApi } from './api';
import { idbCache } from './indexedDBCache';

const PREFETCH_ENDPOINTS = [
  { key: 'validators', url: '/api/validators', ttl: 60000 },
  { key: 'blocks', url: '/api/blocks', ttl: 30000, params: { limit: 30 } },
  { key: 'transactions', url: '/api/transactions', ttl: 30000, params: { limit: 20 } },
  { key: 'network', url: '/api/network', ttl: 30000 },
];

export async function prefetchChainData(chainName: string, chainId?: string) {
  const chain = chainId || chainName;
  
  const promises = PREFETCH_ENDPOINTS.map(async (endpoint) => {
    const cacheKey = getCacheKey(endpoint.key, chainName);
    const cached = getStaleCache(cacheKey);
    
    if (cached) return;
    
    try {
      const urlParams = new URLSearchParams({ chain });
      if (endpoint.params) {
        Object.entries(endpoint.params).forEach(([key, value]) => {
          urlParams.append(key, String(value));
        });
      }
      const response = await fetchApi(`${endpoint.url}?${urlParams}`);
      const data = await response.json();
      setCache(cacheKey, data);
      await idbCache.set(cacheKey, data, endpoint.ttl);
    } catch (err) {
    }
  });
  
  await Promise.allSettled(promises);
}

export function prefetchOnIdle(chainName: string, chainId?: string) {
  if (typeof window === 'undefined') return;
  
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      prefetchChainData(chainName, chainId);
    }, { timeout: 2000 });
  } else {
    setTimeout(() => {
      prefetchChainData(chainName, chainId);
    }, 1000);
  }
}

export function warmupCache(chains: Array<{ chain_name: string; chain_id?: string }>) {
  if (typeof window === 'undefined') return;
  
  const mainChain = chains.find(c => c.chain_name === 'lumera-mainnet') || chains[0];
  if (mainChain) {
    prefetchOnIdle(mainChain.chain_name, mainChain.chain_id);
  }
  
  setTimeout(() => {
    chains.slice(0, 3).forEach((chain, index) => {
      setTimeout(() => {
        prefetchOnIdle(chain.chain_name, chain.chain_id);
      }, index * 2000);
    });
  }, 5000);
}
