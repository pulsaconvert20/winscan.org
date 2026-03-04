'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ValidatorAvatar from '@/components/ValidatorAvatar';
import { ChainData } from '@/types/chain';
import { Activity, CheckCircle, XCircle, AlertTriangle, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import { TendermintWebSocket } from '@/lib/websocket';

interface ValidatorUptime {
  rank?: number;
  moniker: string;
  operator_address: string;
  consensus_address: string;
  identity: string;
  uptime: number;
  missedBlocks: number;
  signedBlocks: number;
  missedBlocksIn100?: number;
  signedBlocksTotal?: number;
  signingWindow?: number;
  maxMissedBlocks?: number;
  jailed: boolean;
  jailedUntil?: string | null;
  tombstoned?: boolean;
  willBeJailed?: boolean;
  status: string;
  votingPower: string;
  blockSignatures: boolean[];
  isDataLoaded?: boolean; // Track if real data has been loaded
}

export default function UptimePage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [uptimeData, setUptimeData] = useState<ValidatorUptime[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [blocksToCheck, setBlocksToCheck] = useState(100);
  const [signingWindow, setSigningWindow] = useState<number>(100);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [previousBlock, setPreviousBlock] = useState<number>(0);
  const [blockUpdateKey, setBlockUpdateKey] = useState<number>(0);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<TendermintWebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockCheckRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize lastUpdate on client side only
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  useEffect(() => {
    const cachedChains = sessionStorage.getItem('chains');

    if (cachedChains) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = params?.chain as string;
      const chain = chainName
        ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
        : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
      if (chain) setSelectedChain(chain);
    } else {
      fetch('/api/chains')
        .then(res => res.json())
        .then(data => {
          sessionStorage.setItem('chains', JSON.stringify(data));
          setChains(data);
          const chainName = params?.chain as string;
          const chain = chainName
            ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
            : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
          if (chain) setSelectedChain(chain);
        });
    }
  }, [params]);

  // Fetch signing window parameters
  useEffect(() => {
    if (!selectedChain) return;

    const fetchSigningWindow = async () => {
      try {
        // Try to get slashing params from API
        const apis = selectedChain.api || [];
        if (apis.length === 0) {
          console.log('[Uptime] No API available, using default: 100');
          setSigningWindow(100);
          setBlocksToCheck(100);
          return;
        }

        const api = apis[0].address;
        const res = await fetch(`${api}/cosmos/slashing/v1beta1/params`, {
          signal: AbortSignal.timeout(500) // 5 second timeout
        });

        if (res.ok) {
          const data = await res.json();
          const window = parseInt(data.params?.signed_blocks_window || '100');
          // Limit to max 1000 blocks for performance
          const limitedWindow = Math.min(window, 1000);
          console.log(`[Uptime] Signing window for ${selectedChain.chain_name}: ${window}, using: ${limitedWindow}`);
          setSigningWindow(limitedWindow);
          setBlocksToCheck(limitedWindow);
        } else {
          console.log('[Uptime] API error, using default: 100');
          setSigningWindow(100);
          setBlocksToCheck(100);
        }
      } catch (error) {
        console.error('[Uptime] Error fetching signing window:', error);
        setSigningWindow(100);
        setBlocksToCheck(100);
      }
    };

    fetchSigningWindow();
  }, [selectedChain?.chain_name]);

  // WebSocket connection for real-time block updates - DISABLED (using polling instead)
  // Most chains don't support WebSocket properly
  /*
  useEffect(() => {
    ... WebSocket code disabled ...
  }, [selectedChain?.chain_name, isLive]);
  */

  // Fetch uptime data for a specific block (real-time update)
  const fetchUptimeForBlock = useCallback(async (blockHeight: number) => {
    if (!selectedChain) return;

    try {
      const apiUrl = `/api/uptime?chain=${selectedChain.chain_id || selectedChain.chain_name}&blocks=${blocksToCheck}&height=${blockHeight}`;

      const res = await fetch(apiUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) return;

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        // Smooth update - only shift block signatures
        setUptimeData(prevData => {
          if (prevData.length === 0) {
            return data.map(v => ({ ...v, isDataLoaded: true }));
          }

          return data.map((newValidator: ValidatorUptime) => {
            const oldValidator = prevData.find(v => v.operator_address === newValidator.operator_address);

            if (oldValidator?.blockSignatures && newValidator.blockSignatures) {
              // Shift left: remove first, add new at end
              const updatedSignatures = [...oldValidator.blockSignatures];
              updatedSignatures.shift();
              updatedSignatures.push(newValidator.blockSignatures[newValidator.blockSignatures.length - 1]);

              // Recalculate stats
              const signedCount = updatedSignatures.filter(s => s).length;
              const missedCount = updatedSignatures.length - signedCount;

              return {
                ...newValidator,
                blockSignatures: updatedSignatures,
                signedBlocks: signedCount,
                missedBlocks: missedCount,
                uptime: (signedCount / updatedSignatures.length) * 100,
                isDataLoaded: true
              };
            }

            return { ...newValidator, isDataLoaded: true };
          });
        });
      }
    } catch (error) {
      // Silent fail
    }
  }, [selectedChain, blocksToCheck]);

  // Simplified polling for real-time block updates
  useEffect(() => {
    if (!selectedChain || !isLive) return;

    const checkNewBlock = async () => {
      try {
        const rpcEndpoints = selectedChain.rpc || [];
        if (rpcEndpoints.length === 0) return;

        const rpcUrl = typeof rpcEndpoints[0] === 'string'
          ? rpcEndpoints[0]
          : rpcEndpoints[0].address;

        const res = await fetch(`${rpcUrl}/status`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(2000)
        });

        if (!res.ok) return;

        const data = await res.json();
        const latestHeight = parseInt(data.result?.sync_info?.latest_block_height || '0');

        if (latestHeight > 0) {
          if (currentBlock === 0) {
            // Initial block
            setCurrentBlock(latestHeight);
          } else if (latestHeight > currentBlock) {
            // New block detected - fetch fresh data
            console.log(`[Uptime] 🆕 Block ${currentBlock} → ${latestHeight}`);

            setCurrentBlock(latestHeight);
            setBlockUpdateKey(prev => prev + 1);
            setLastUpdate(new Date());

            // Fetch new uptime data
            fetchUptimeForBlock(latestHeight);
          }
        }
      } catch (error) {
        // Silent fail - don't spam console
      }
    };

    // Check immediately
    checkNewBlock();

    // Poll every 2 seconds
    const pollInterval = setInterval(checkNewBlock, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedChain?.chain_id, isLive, currentBlock, fetchUptimeForBlock]);

  // Memoized fetch function dengan debounce
  const fetchUptime = useCallback(async (force = false) => {
    if (!selectedChain || !isLive) return;

    const cacheKey = `uptime_v5_${selectedChain.chain_name}_${blocksToCheck}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached && !force) {
        const { data, timestamp } = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          setUptimeData(data.map(v => ({ ...v, isDataLoaded: true })));
        }

        if (Date.now() - timestamp < 60000) {
          return;
        }
      }
    } catch (e) {
      // Silent
    }

    if (loading) return;

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const apiUrl = `/api/uptime?chain=${selectedChain.chain_id || selectedChain.chain_name}&blocks=${blocksToCheck}`;

      const res = await fetch(apiUrl, {
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        // Recalculate uptime from blockSignatures
        data.forEach((validator: ValidatorUptime) => {
          if (validator.blockSignatures && Array.isArray(validator.blockSignatures)) {
            const totalBlocks = validator.blockSignatures.length;
            const signedCount = validator.blockSignatures.filter(signed => signed === true).length;
            const missedCount = totalBlocks - signedCount;

            validator.uptime = totalBlocks > 0 ? (signedCount / totalBlocks) * 100 : 0;
            validator.signedBlocks = signedCount;
            validator.missedBlocks = missedCount;
            validator.isDataLoaded = true;
          }
        });

        setUptimeData(data);
        setLastUpdate(new Date());

        // Preload keybase avatars
        const identities = data
          .map((v: any) => v.identity)
          .filter((id: string) => id && id.length >= 16);

        if (identities.length > 0) {
          import('@/lib/keybaseUtils').then(({ getValidatorAvatarsBatch }) => {
            getValidatorAvatarsBatch(identities).catch(() => { });
          });
        }

        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: Date.now()
          }));

          // Cleanup old cache
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('uptime_') && !key.startsWith('uptime_v5_')) {
              sessionStorage.removeItem(key);
            }
          });
        } catch (e) {
          // Silent
        }
      }
    } catch (error: any) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [selectedChain, blocksToCheck, isLive, loading]);

  // Initial fetch when chain changes
  useEffect(() => {
    if (selectedChain && isLive) {
      console.log('[Uptime Page] Initial fetch for:', selectedChain.chain_name);
      fetchUptime(true);
    }
  }, [selectedChain?.chain_name]); // Only re-run when chain actually changes

  // Pause updates when tab is not visible (performance optimization)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsLive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        setIsLive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const validUptimeData = Array.isArray(uptimeData) ? uptimeData : [];

  const filteredValidators = validUptimeData.filter(v => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      v.moniker.toLowerCase().includes(query) ||
      v.operator_address.toLowerCase().includes(query)
    );
  });

  const chainPath = selectedChain?.chain_name.toLowerCase().replace(/\s+/g, '-') || '';

  const sortedValidators = [...filteredValidators].sort((a, b) => {
    if (a.status === 'BOND_STATUS_BONDED' && b.status !== 'BOND_STATUS_BONDED') return -1;
    if (a.status !== 'BOND_STATUS_BONDED' && b.status === 'BOND_STATUS_BONDED') return 1;

    const powerA = parseFloat(a.votingPower || '0');
    const powerB = parseFloat(b.votingPower || '0');
    return powerB - powerA;
  });

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-500';
    if (uptime >= 95) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUptimeBgColor = (uptime: number) => {
    if (uptime >= 99) return 'bg-green-500/10 border-green-500/20';
    if (uptime >= 95) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <style jsx>{`
        .block-bar-container {
          position: relative;
          overflow: hidden;
        }
        
        .block-bar-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 3px;
          align-content: flex-start;
        }
        
        .block-bar {
          width: 14px;
          height: 14px;
          cursor: pointer;
          transition: all 0.1s ease;
          border-radius: 2px;
          flex-shrink: 0;
        }
        
        .block-bar:hover {
          transform: scale(1.4);
          transition: transform 0.1s ease;
          z-index: 10;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-3px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .data-row {
          animation: slideIn 0.1s ease-out;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .loading-bar {
          animation: pulse 0.8s ease-in-out infinite;
        }
      `}</style>

      <Sidebar selectedChain={selectedChain} />

      <div className="flex-1 flex flex-col">
        <Header
          chains={chains}
          selectedChain={selectedChain}
          onSelectChain={setSelectedChain}
        />

        <main className="flex-1 mt-32 lg:mt-16 p-4 md:p-6">
          {/* Header with Live Indicator */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                <h1 className="text-xl md:text-3xl font-bold text-white">{t('uptime.title')}</h1>

                {/* Live Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-green-400 font-medium">LIVE</span>
                </div>

                {/* Current Block */}
                {currentBlock > 0 && (
                  <div
                    key={`block-${blockUpdateKey}`}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 animate-pulse"
                  >
                    <span className="text-xs text-blue-400 font-mono">#{currentBlock.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Last Update Time */}
              <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
                <span>Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}</span>
              </div>
            </div>
            <p className="text-sm md:text-base text-gray-400">
              {t('uptime.subtitle')}
            </p>
          </div>

          {/* Controls */}
          <div className="mb-4 md:mb-6 flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 items-stretch md:items-center md:justify-between">
            {/* Search Input */}
            <div className="w-full md:flex-1 md:max-w-md">
              <input
                type="text"
                placeholder={t('uptime.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-xs md:text-sm">
                <span className="text-gray-400">{t('uptime.totalValidators')} </span>
                <span className="text-white font-bold">{validUptimeData.length}</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                <span className="text-xs text-gray-400">Window:</span>
                <span className="text-xs text-purple-400 font-mono font-bold">{signingWindow.toLocaleString()}</span>
              </div>
              {searchQuery && (
                <div className="text-xs md:text-sm">
                  <span className="text-gray-400">{t('uptime.filtered')} </span>
                  <span className="text-blue-400 font-bold">{filteredValidators.length}</span>
                </div>
              )}
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2">
              {loading && uptimeData.length > 0 ? (
                <div className="flex items-center gap-2 text-xs md:text-sm text-blue-400">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>{t('uptime.updating')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{t('uptime.autoRefresh')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Validators Table */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
            <div
              className="overflow-x-auto scroll-smooth"
              style={{
                maxHeight: 'calc(100vh - 400px)',
                minHeight: '500px',
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: '#374151 #1a1a1a'
              }}
            >
              <table className="w-full">
                <thead className="bg-[#0f0f0f] border-b border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                      Validator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Last 50 Blocks
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">
                      Uptime
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-40">
                      Last Jailed Time
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                      Signed Precommits
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">
                      Start Height
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">
                      Tombstoned
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading && uptimeData.length === 0 ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-gray-800" />
                            <div className="w-10 h-10 rounded-full bg-gray-800" />
                            <div className="h-4 w-32 bg-gray-800 rounded" />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-full bg-gray-800 rounded" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-16 bg-gray-800 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-12 bg-gray-800 rounded mx-auto" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-20 bg-gray-800 rounded mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : sortedValidators.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                        {t('uptime.noValidators')}
                      </td>
                    </tr>
                  ) : (
                    sortedValidators.map((validator, index) => (
                      <tr
                        key={validator.operator_address}
                        className="hover:bg-[#0f0f0f]/50 transition-colors duration-150 border-b border-gray-800/30"
                      >
                        {/* Rank */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-400 font-medium">{index + 1}</span>
                        </td>

                        {/* Validator Name with Avatar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ValidatorAvatar
                              moniker={validator.moniker}
                              identity={validator.identity}
                              size="sm"
                            />
                            <Link
                              href={`/${chainPath}/validators/${validator.operator_address}`}
                              className="text-white text-sm hover:text-blue-400 transition-colors truncate max-w-[180px]"
                              title={validator.moniker}
                            >
                              {validator.moniker}
                            </Link>
                          </div>
                        </td>

                        {/* Block Signing Bars */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 block-bar-container">
                              <div className="block-bar-wrapper">
                                {validator.blockSignatures && validator.blockSignatures.length > 0 ? (
                                  validator.blockSignatures.slice(-50).map((isSigned, idx) => (
                                    <div
                                      key={`${validator.operator_address}-${idx}-${blockUpdateKey}`}
                                      className={`block-bar ${!validator.isDataLoaded ? 'loading-bar' : ''}`}
                                      style={{
                                        backgroundColor: validator.isDataLoaded
                                          ? (isSigned ? '#10b981' : '#ef4444')
                                          : '#374151',
                                        opacity: validator.isDataLoaded ? 1 : 0.4
                                      }}
                                      title={validator.isDataLoaded
                                        ? `Block ${currentBlock - 50 + idx + 1}: ${isSigned ? 'Signed ✓' : 'Missed ✗'}`
                                        : 'Loading...'
                                      }
                                    />
                                  ))
                                ) : (
                                  Array.from({ length: 50 }).map((_, idx) => (
                                    <div
                                      key={`empty-${idx}`}
                                      className="block-bar loading-bar"
                                      style={{
                                        backgroundColor: '#374151',
                                        opacity: 0.3
                                      }}
                                    />
                                  ))
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-end min-w-[50px]">
                              <span className={`text-sm font-bold tabular-nums ${validator.isDataLoaded && validator.missedBlocks > 0
                                ? 'text-red-400'
                                : 'text-gray-600'
                                }`}>
                                {validator.isDataLoaded ? validator.missedBlocks : '-'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Uptime Percentage */}
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${getUptimeColor(validator.uptime)}`}>
                            {validator.uptime.toFixed(1)}%
                          </span>
                        </td>

                        {/* Last Jailed Time */}
                        <td className="px-4 py-3">
                          {validator.jailedUntil && !validator.jailedUntil.startsWith('1970') ? (
                            <span className="text-xs text-gray-400">
                              {new Date(validator.jailedUntil).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">-</span>
                          )}
                        </td>

                        {/* Signed Precommits */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-gray-300 tabular-nums">
                            {validator.signedBlocks || 0}
                          </span>
                        </td>

                        {/* Start Height */}
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs text-gray-400 tabular-nums">
                            -
                          </span>
                        </td>

                        {/* Tombstoned */}
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium ${validator.tombstoned ? 'text-red-400' : 'text-gray-600'}`}>
                            {validator.tombstoned ? 'Yes' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Note */}
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-blue-400 font-medium mb-2">{t('uptime.aboutTitle')}</p>
                <div className="text-gray-400 text-sm space-y-2">
                  <p>
                    Uptime is calculated from the last <span className="text-blue-400 font-mono">{signingWindow.toLocaleString()} blocks</span> based on this chain's signing window parameter.
                    Green bars represent signed blocks, red bars show missed blocks.
                  </p>
                  <p>
                    Each chain has its own signing window configuration - this chain uses <span className="text-blue-400 font-mono">{signingWindow.toLocaleString()}</span> blocks.
                    The page automatically adapts to each chain's specific parameters.
                  </p>
                  <p className="text-xs text-gray-500">
                    💡 Data updates in real-time every 2 seconds as new blocks arrive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
