'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ValidatorsTable from '@/components/ValidatorsTable';
import { ChainData, ValidatorData } from '@/types/chain';
import { getCacheKey, setCache, getStaleCache } from '@/lib/cacheUtils';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import { fetchValidatorsDirectly, shouldUseDirectFetch, fetchValidatorDelegatorsCount, fetchValidatorUptime } from '@/lib/cosmos-client';
import { saveValidatorSnapshot, get24hChanges, shouldSaveSnapshot } from '@/lib/validatorHistory';
import { cachedFetch, parallelFetch } from '@/lib/optimizedFetch';
import { TableSkeleton } from '@/components/SkeletonLoader';

export default function ValidatorsPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [validators, setValidators] = useState<ValidatorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    // Cache version - increment to force refresh
    const CACHE_VERSION = 'v2';
    const cachedVersion = sessionStorage.getItem('chainsVersion');
    const cachedChains = sessionStorage.getItem('chains');
    
    if (cachedChains && cachedVersion === CACHE_VERSION) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = (params?.chain as string)?.trim();
      const chain = chainName 
        ? data.find((c: ChainData) => 
            c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase() ||
            c.chain_id?.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase()
          )
        : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
      if (chain) setSelectedChain(chain);
      return;
    }

    fetch('/api/chains')
      .then(res => res.json())
      .then(data => {
        sessionStorage.setItem('chains', JSON.stringify(data));
        sessionStorage.setItem('chainsVersion', CACHE_VERSION);
        setChains(data);
        const chainName = (params?.chain as string)?.trim();
        const chain = chainName 
          ? data.find((c: ChainData) => 
              c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase() ||
              c.chain_id?.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase()
            )
          : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
        if (chain) setSelectedChain(chain);
      });
  }, [params]);

  const fetchValidators = useCallback(async () => {
    if (!selectedChain) return;
    
    const cacheKey = getCacheKey('validators', selectedChain.chain_name);
    const cachedData = getStaleCache<ValidatorData[]>(cacheKey);
    
    // Show cached data immediately if available
    if (cachedData && cachedData.length > 0) {
      setValidators(cachedData);
      setLoading(false);
    } else {
      setLoading(true);
    }
    
    try {
      const chainPath = params?.chain as string;
      const chainId = selectedChain.chain_id || selectedChain.chain_name;
      
      // Try optimized cached fetch first
      try {
        const data = await cachedFetch<any>(
          `/api/validators?chain=${chainPath}`,
          { staleTime: 5 * 60 * 1000 } // 5 minute cache
        );
        
        if (data && Array.isArray(data.validators) && data.validators.length > 0) {
          const formattedValidators = data.validators.map((v: any) => ({
            address: v.address || v.operator_address,
            moniker: v.moniker || 'Unknown',
            identity: v.identity,
            website: v.website,
            details: v.details,
            status: v.status,
            jailed: v.jailed || false,
            votingPower: v.votingPower || v.tokens || '0',
            commission: v.commission || '0',
            delegatorsCount: v.delegatorsCount || 0,
            uptime: v.uptime || 100,
            consensus_pubkey: v.consensus_pubkey,
          }));
          
          // Calculate 24h changes
          const changes24h = get24hChanges(chainId, formattedValidators);
          const validatorsWithChanges = formattedValidators.map((v: any) => ({
            ...v,
            votingPowerChange24h: changes24h.get(v.address) || '0',
          }));
          
          // Save snapshot if needed
          if (shouldSaveSnapshot(chainId)) {
            saveValidatorSnapshot(chainId, formattedValidators);
          }
          
          startTransition(() => {
            setValidators(validatorsWithChanges);
            setCache(cacheKey, validatorsWithChanges);
            setLoading(false);
          });
          
          // Background fetch delegators and uptime
          const validatorAddresses = formattedValidators.map((v: any) => v.address);
          
          fetch('/api/validators-delegators-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validators: validatorAddresses, chain: chainId }),
            signal: AbortSignal.timeout(60000)
          })
          .then(res => res.json())
          .then((data) => {
            const delegatorsMap = new Map(data.results.map((r: any) => [r.validator, r.count]));
            setValidators(prev => prev.map(v => ({
              ...v,
              delegatorsCount: (delegatorsMap.get(v.address) || v.delegatorsCount || 0) as number
            })));
          })
          .catch(() => {});

          // Batch fetch uptime for top 20
          const top20 = formattedValidators.slice(0, 20);
          const consensusAddresses = top20.map((v: any) => v.consensus_pubkey?.key).filter(Boolean) as string[];
          
          if (consensusAddresses.length > 0) {
            fetch('/api/validators/uptime/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chain: chainPath, validators: consensusAddresses })
            })
            .then(res => res.json())
            .then((uptimeMap: { [key: string]: number }) => {
              setValidators(prev => prev.map(v => {
                const consensusKey = v.consensus_pubkey?.key;
                const uptime = consensusKey ? (uptimeMap[consensusKey] || 100) : 100;
                return { ...v, uptime };
              }));
            })
            .catch(() => {});
          }
          
          return; // Success
        }
      } catch (error) {
        console.warn('[Validators] Optimized fetch failed, using fallback:', error);
      }
      
      // Fallback: Use regular fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const res = await fetch(`/api/validators?chain=${chainId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        const validatorsData = data.validators || data;
        
        if (Array.isArray(validatorsData) && validatorsData.length > 0) {
          startTransition(() => {
            setValidators(validatorsData);
            setCache(cacheKey, validatorsData);
            setLoading(false);
          });
          return;
        }
      }
      
      // Last resort: use cached data
      if (cachedData && cachedData.length > 0) {
        setValidators(cachedData);
      }
      setLoading(false);
      
    } catch (err) {
      console.error('[Validators] Error:', err);
      // Use cached data if available
      if (cachedData && cachedData.length > 0) {
        setValidators(cachedData);
      }
      setLoading(false);
    }
  }, [selectedChain, params, startTransition]);

  useEffect(() => {
    fetchValidators();
  }, [fetchValidators]);

  useEffect(() => {
    if (!selectedChain) return;
    
    const interval = setInterval(() => {
      fetchValidators();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChain, fetchValidators]);

  const validValidators = useMemo(() => 
    Array.isArray(validators) ? validators : [], 
    [validators]
  );

  const { active, inactive, all } = useMemo(() => {
    const active = validValidators.filter(v => v.status === 'BOND_STATUS_BONDED' && !v.jailed);
    const inactive = validValidators.filter(v => v.status !== 'BOND_STATUS_BONDED' || v.jailed);
    return { active, inactive, all: validValidators };
  }, [validValidators]);

  const filteredValidators = useMemo(() => {
    let result = all;
    
    if (filter === 'active') result = active;
    else if (filter === 'inactive') result = inactive;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v => 
        v.moniker?.toLowerCase().includes(query) ||
        v.address?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [filter, active, inactive, all, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar selectedChain={selectedChain} />
      
      <div className="flex-1 flex flex-col">
        <Header 
          chains={chains}
          selectedChain={selectedChain}
          onSelectChain={setSelectedChain}
        />

        <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6">
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('validators.title')}</h1>
              <p className="text-gray-400 text-sm md:text-base">
                {t('validators.subtitle')} {selectedChain?.chain_name}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPending ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-xs text-gray-400">{t('overview.live')}</span>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
            {/* Filter Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="appearance-none w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 md:px-4 py-2 pr-10 text-sm md:text-base text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All Validators</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex-1 w-full sm:max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search validator"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-9 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {searchQuery && (
            <p className="mb-4 text-sm text-gray-400">
              {t('validators.found')} <span className="text-blue-400 font-bold">{filteredValidators.length}</span> {t('validators.validator')}{filteredValidators.length !== 1 ? 's' : ''}
            </p>
          )}

          {loading && validators.length === 0 ? (
            <TableSkeleton rows={20} />
          ) : (
            <ValidatorsTable 
              validators={filteredValidators} 
              chainName={selectedChain?.chain_name || ''}
              asset={selectedChain?.assets[0]}
              chain={selectedChain}
            />
          )}
        </main>

        <footer className="border-t border-gray-800 py-6 px-6 mt-auto">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 WinScan. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

