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

export default function ValidatorsPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [validators, setValidators] = useState<ValidatorData[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [signingWindow, setSigningWindow] = useState<number>(100);

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

  // Fetch signing window parameters
  useEffect(() => {
    if (!selectedChain) return;

    const fetchSigningWindow = async () => {
      try {
        const apis = selectedChain.api || [];
        if (apis.length === 0) {
          setSigningWindow(100);
          return;
        }

        const api = apis[0].address;
        const res = await fetch(`${api}/cosmos/slashing/v1beta1/params`, {
          signal: AbortSignal.timeout(5000)
        });

        if (res.ok) {
          const data = await res.json();
          const window = parseInt(data.params?.signed_blocks_window || '100');
          const limitedWindow = Math.min(window, 1000);
          setSigningWindow(limitedWindow);
        } else {
          setSigningWindow(100);
        }
      } catch (error) {
        setSigningWindow(100);
      }
    };

    fetchSigningWindow();
  }, [selectedChain?.chain_name]);

  const fetchValidators = useCallback(async () => {
    if (!selectedChain) return;

    // Don't cache validators - always fetch fresh
    try {
      const chainPath = params?.chain as string;

      // Strategy 1: Try backend API first (fastest, includes all data)
      try {
        console.log(`[Validators] Fetching fresh data for ${selectedChain.chain_name}`);
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ssl.winsnip.xyz';
        const apiResponse = await fetch(`${API_URL}/api/validators?chain=${chainPath}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(10000),
          cache: 'no-store' // Force fresh
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (Array.isArray(apiData.validators) && apiData.validators.length > 0) {
            console.log(`[Validators] ✓ Got ${apiData.validators.length} validators from backend API`);

            const formattedValidators = apiData.validators
              .map((v: any) => ({
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
                uptime: 100, // Will be updated from uptime API
                consensus_pubkey: v.consensus_pubkey,
              }));

            // Calculate 24h changes using historical data
            const chainId = selectedChain.chain_id || selectedChain.chain_name;
            const changes24h = get24hChanges(chainId, formattedValidators);

            // Add 24h changes to validators
            const validatorsWithChanges = formattedValidators.map((v: any) => ({
              ...v,
              votingPowerChange24h: changes24h.get(v.address) || '0',
            }));

            // Save snapshot if needed (once per 24h)
            if (shouldSaveSnapshot(chainId)) {
              saveValidatorSnapshot(chainId, formattedValidators);
            }

            startTransition(() => {
              setValidators(validatorsWithChanges);
              // DON'T cache - let uptime useEffect handle it
            });

            // 🚀 Batch preload keybase avatars for all validators with identity
            const identities = formattedValidators
              .map((v: any) => v.identity)
              .filter((id: string) => id && id.length >= 16);

            if (identities.length > 0) {
              import('@/lib/keybaseUtils').then(({ getValidatorAvatarsBatch }) => {
                getValidatorAvatarsBatch(identities)
                  .then(() => {
                    console.log(`[Validators] ✅ Preloaded ${identities.length} keybase avatars`);
                  })
                  .catch(err => {
                    console.warn('[Validators] Keybase batch preload failed:', err);
                  });
              });
            }

            return; // Success, exit
          }
        }
      } catch (apiError) {
        console.warn('[Validators] Backend API failed, falling back to LCD:', apiError);
      }

      // Strategy 2: Direct LCD fetch (fallback)
      const lcdEndpoints = selectedChain.api?.map(api => ({
        address: api.address,
        provider: api.provider || 'Unknown'
      })) || [];

      if (lcdEndpoints.length > 0) {
        console.log(`[Validators] Using direct LCD fetch for ${selectedChain.chain_name}`);

        try {
          // Fetch ALL validators (bonded + unbonding + unbonded) for filters to work
          const [bondedValidators, unbondingValidators, unbondedValidators] = await Promise.all([
            fetchValidatorsDirectly(lcdEndpoints, 'BOND_STATUS_BONDED', 300),
            fetchValidatorsDirectly(lcdEndpoints, 'BOND_STATUS_UNBONDING', 300).catch(() => []),
            fetchValidatorsDirectly(lcdEndpoints, 'BOND_STATUS_UNBONDED', 300).catch(() => [])
          ]);

          const validators = [...bondedValidators, ...unbondingValidators, ...unbondedValidators];

          // Transform to match our ValidatorData interface
          const formattedValidators = validators
            .map((v: any) => ({
              address: v.operator_address,
              moniker: v.description?.moniker || 'Unknown',
              identity: v.description?.identity,
              website: v.description?.website,
              details: v.description?.details,
              status: v.status,
              jailed: v.jailed,
              votingPower: v.tokens || '0',
              commission: v.commission?.commission_rates?.rate || '0',
              delegatorsCount: 0, // Will be fetched separately
              uptime: 100, // Will be fetched separately
              consensus_pubkey: v.consensus_pubkey,
            }))
            .sort((a: any, b: any) => {
              const tokensA = BigInt(a.votingPower);
              const tokensB = BigInt(b.votingPower);
              return tokensB > tokensA ? 1 : tokensB < tokensA ? -1 : 0; // Sort by tokens descending
            });

          // Calculate 24h changes using historical data
          const chainId = selectedChain.chain_id || selectedChain.chain_name;
          const changes24h = get24hChanges(chainId, formattedValidators);

          // Add 24h changes to validators
          const validatorsWithChanges = formattedValidators.map((v: any) => ({
            ...v,
            votingPowerChange24h: changes24h.get(v.address) || '0',
          }));

          // Save snapshot if needed (once per 24h)
          if (shouldSaveSnapshot(chainId)) {
            saveValidatorSnapshot(chainId, formattedValidators);
          }

          startTransition(() => {
            setValidators(validatorsWithChanges);
            // DON'T cache
          });

          // 🚀 OPTIMIZED: Batch fetch delegators count for ALL validators
          const chainPath = params?.chain as string;
          const validatorAddresses = formattedValidators.map((v: any) => v.address);

          fetch('/api/validators-delegators-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validators: validatorAddresses,
              chain: chainId
            }),
            signal: AbortSignal.timeout(60000)
          })
            .then(res => res.json())
            .then((data) => {
              const delegatorsMap = new Map(
                data.results.map((r: any) => [r.validator, r.count])
              );

              setValidators(prev => prev.map(v => ({
                ...v,
                delegatorsCount: (delegatorsMap.get(v.address) || v.delegatorsCount || 0) as number
              })));

              console.log(`[Validators] ✅ Loaded delegators for ${data.results.length} validators`);
            })
            .catch(err => {
              console.warn('[Validators] Failed to fetch delegators:', err);
            });

          // Batch fetch uptime for ALL validators using the correct uptime API
          fetch(`/api/uptime?chain=${chainId}&blocks=${signingWindow}`)
            .then(res => res.json())
            .then((uptimeData: any[]) => {
              if (Array.isArray(uptimeData) && uptimeData.length > 0) {
                // Create map of operator_address -> uptime
                const uptimeMap = new Map(
                  uptimeData.map(v => [v.operator_address, v.uptime])
                );

                setValidators(prev => prev.map(v => ({
                  ...v,
                  uptime: uptimeMap.get(v.address) || 100
                })));

                console.log(`[Validators] ✅ Loaded uptime for ${uptimeData.length} validators (window: ${signingWindow})`);
              }
            })
            .catch(err => {
              console.warn('[Validators] Uptime fetch failed:', err);
            });

          // 🚀 Batch preload keybase avatars for all validators with identity
          const identities = formattedValidators
            .map((v: any) => v.identity)
            .filter((id: string) => id && id.length >= 16);

          if (identities.length > 0) {
            import('@/lib/keybaseUtils').then(({ getValidatorAvatarsBatch }) => {
              getValidatorAvatarsBatch(identities)
                .then(() => {
                  console.log(`[Validators] ✅ Preloaded ${identities.length} keybase avatars`);
                })
                .catch(err => {
                  console.warn('[Validators] Keybase batch preload failed:', err);
                });
            });
          }

          return;
        } catch (directError) {
          console.warn('[Validators] Direct LCD fetch failed, trying server API fallback:', directError);
        }
      }

      // Fallback: Try server API if direct fetch fails
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(`/api/validators?chain=${selectedChain.chain_id || selectedChain.chain_name}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          startTransition(() => {
            setValidators(data);
            // DON'T cache
          });
          return;
        }
      }

    } catch (err) {
      console.error('[Validators] All fetch strategies failed:', err);
    }
  }, [selectedChain, signingWindow]);

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

          {/* Filter Tabs and Search Bar */}
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('active')}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'active'
                    ? 'bg-white text-gray-900'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-gray-800'
                  }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilter('inactive')}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${filter === 'inactive'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-gray-800'
                  }`}
              >
                Inactive
              </button>
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

          <ValidatorsTable
            validators={filteredValidators}
            chainName={selectedChain?.chain_name || ''}
            asset={selectedChain?.assets[0]}
            chain={selectedChain}
          />
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

