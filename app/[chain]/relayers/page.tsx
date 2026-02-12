'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import IBCBridgeModal from '@/components/IBCBridgeModal';
import IBCSwapInterface from '@/components/IBCSwapInterface';
import IBCChannelTransactions from '@/components/IBCChannelTransactions';
import { ChainData } from '@/types/chain';
import { Network, Globe, CheckCircle, XCircle, ArrowRightLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface Channel {
  channel_id: string;
  port_id: string;
  state: string;
  ordering: string;
  counterparty: {
    port_id: string;
    channel_id: string;
  };
  connection_hops: string[];
  version: string;
  packets_sent: number;
  packets_received: number;
}

interface RelayerDetail {
  chainId: string;
  chainName: string;
  logo: string | null;
  channels: Channel[];
}

// Component to fetch and display Osmosis channels
function OsmosisChannelsSection({ 
  chainName, 
  chainPath, 
  relayerId,
  relayerName 
}: { 
  chainName: string; 
  chainPath: string; 
  relayerId: string;
  relayerName: string;
}) {
  const [relayerDetail, setRelayerDetail] = useState<RelayerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRelayerDetail = async () => {
      setLoading(true);
      try {
        const response = await fetchApi(`/api/relayers/detail?chain=${chainName}&relayerId=${relayerId}`);
        const data = await response.json();
        setRelayerDetail(data);
      } catch (error) {
        console.error('Error fetching Osmosis relayer detail:', error);
        setRelayerDetail(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRelayerDetail();
  }, [chainName, relayerId]);

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500/20 border-t-purple-500 mb-4"></div>
        <p className="text-gray-400">Loading channels...</p>
      </div>
    );
  }

  if (!relayerDetail || relayerDetail.channels.length === 0) {
    return null;
  }

  return (
    <>
      {/* Channels Table */}
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Channels</h2>
          <p className="text-gray-400 text-sm mt-1">Active IBC channels with {relayerName}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111111] border-b border-gray-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Source Channel
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Destination Channel
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Receive
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Send
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {relayerDetail.channels.map((channel, index) => (
                <tr 
                  key={index}
                  className="hover:bg-[#111111] transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 text-xs font-bold">S</span>
                      </div>
                      <span className="text-white font-mono text-sm">{channel.channel_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 text-xs font-bold">D</span>
                      </div>
                      <span className="text-white font-mono text-sm">{channel.counterparty.channel_id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-medium">{channel.packets_received || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-white font-medium">{channel.packets_sent || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {channel.state === 'STATE_OPEN' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-400 text-sm font-medium">Opened</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-red-400 text-sm font-medium">Closed</span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IBC Channel Transactions */}
      {relayerDetail.channels.map((channel, index) => (
        <IBCChannelTransactions
          key={index}
          chainName={chainName}
          chainPath={chainPath}
          channelId={channel.channel_id}
          counterpartyChannelId={channel.counterparty.channel_id}
          counterpartyChainName={relayerName}
        />
      ))}
    </>
  );
}

interface Relayer {
  chainId: string;
  chainName: string;
  logo: string | null;
  status: string;
  totalChannels: string;
  openChannels: string;
  sended: string | null;
  received: string | null;
}

export default function RelayersPage() {
  const params = useParams();
  const router = useRouter();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [relayers, setRelayers] = useState<Relayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);

  const chainPath = useMemo(() => 
    selectedChain ? selectedChain.chain_name.toLowerCase().replace(/\s+/g, '-') : '',
    [selectedChain]
  );

  useEffect(() => {
    const cachedChains = sessionStorage.getItem('chains');
    
    if (cachedChains) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = (params?.chain as string)?.trim();
      const chain = chainName 
        ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
        : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
      if (chain) setSelectedChain(chain);
    } else {
      fetchApi('/api/chains')
        .then(res => res.json())
        .then(data => {
          sessionStorage.setItem('chains', JSON.stringify(data));
          setChains(data);
          const chainName = (params?.chain as string)?.trim();
          const chain = chainName 
            ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
            : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
          if (chain) setSelectedChain(chain);
        });
    }
  }, [params]);

  useEffect(() => {
    if (!selectedChain) return;

    let isActive = true;
    let timeoutId: NodeJS.Timeout;

    const fetchRelayers = async (isAutoRefresh = false) => {
      if (!isActive) return;
      
      if (isAutoRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      
      try {
        const response = await fetchApi(`/api/relayers?chain=${selectedChain.chain_name}`);
        if (!isActive) return;
        
        const data = await response.json();
        if (!isActive) return;
        
        setRelayers(data.relayers || []);
      } catch (error) {
        if (!isActive) return;
        console.error('Error fetching relayers:', error);
        setRelayers([]);
      } finally {
        if (!isActive) return;
        
        if (isAutoRefresh) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    };

    fetchRelayers();
    
    // Auto-refresh every 10 minutes
    const scheduleRefresh = () => {
      timeoutId = setTimeout(() => {
        if (isActive) {
          fetchRelayers(true).then(() => {
            if (isActive) scheduleRefresh();
          });
        }
      }, 600000);
    };
    
    scheduleRefresh();
    
    return () => {
      isActive = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedChain]);

  if (loading && !selectedChain) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar selectedChain={selectedChain} />
        <div className="flex-1 flex flex-col">
          <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
          <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/10 animate-pulse"></div>
              </div>
              <p className="text-gray-400 text-sm">Loading relayers...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar selectedChain={selectedChain} />
      <div className="flex-1 flex flex-col">
        <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
        <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 space-y-4 md:space-y-6">
          {/* Swap Section (Osmosis only) */}
          {selectedChain && relayers.length > 0 && 
           (selectedChain.chain_name.toLowerCase().includes('osmosis') || 
            selectedChain.chain_id?.toLowerCase().includes('osmosis')) && (
            <IBCSwapInterface chain={selectedChain} />
          )}

          {/* Header Section */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-xl">
                  <Network className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">IBC Relayers</h1>
                  <p className="text-gray-400 text-sm">Inter-Blockchain Communication connections</p>
                </div>
              </div>
              
              {/* IBC Transfer Button */}
              {selectedChain && relayers.length > 0 && (
                <button
                  onClick={() => setIsBridgeModalOpen(true)}
                  className="bg-white hover:bg-gray-100 text-black font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>IBC Transfer</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#111111] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Connected Chains</span>
                </div>
                <p className="text-2xl font-bold text-white">{relayers.length}</p>
              </div>
              
              <div className="bg-[#111111] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Total Channels</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {relayers.reduce((sum, r) => sum + parseInt(r.totalChannels || '0'), 0)}
                </p>
              </div>
              
              <div className="bg-[#111111] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400 text-sm">Open Channels</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {relayers.reduce((sum, r) => sum + parseInt(r.openChannels || '0'), 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Relayers Table */}
          <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Connected Chains</h2>
              <p className="text-gray-400 text-sm mt-1">List of chains connected via IBC</p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/20 border-t-blue-500 mb-4"></div>
                <p className="text-gray-400">Loading relayers...</p>
              </div>
            ) : relayers.length === 0 ? (
              <div className="p-12 text-center">
                <Network className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No IBC connections found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#111111] border-b border-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Chain
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Total Channels
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Open Channels
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5">
                          <ArrowUpFromLine className="w-3.5 h-3.5" />
                          <span>Transfer Out</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5">
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>Transfer In</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {relayers.map((relayer, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-[#111111] transition-colors cursor-pointer"
                        onClick={() => router.push(`/${chainPath}/relayers/${relayer.chainId}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {relayer.logo ? (
                              <>
                                <img 
                                  src={relayer.logo} 
                                  alt={relayer.chainName || relayer.chainId}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    const parent = e.currentTarget.parentElement;
                                    if (parent) {
                                      e.currentTarget.remove();
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm';
                                      fallback.textContent = (relayer.chainName?.charAt(0) || relayer.chainId.charAt(0)).toUpperCase();
                                      parent.insertBefore(fallback, parent.firstChild);
                                    }
                                  }}
                                />
                              </>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                {(relayer.chainName?.charAt(0) || relayer.chainId.charAt(0)).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-white">{relayer.chainName || relayer.chainId}</div>
                              <div className="text-xs text-gray-500">{relayer.chainId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {relayer.status === 'STATE_OPEN' ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-green-400 text-sm font-medium">Opened</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 text-red-500" />
                                <span className="text-red-400 text-sm font-medium">Closed</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-300">{relayer.totalChannels}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-300">{relayer.openChannels}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <ArrowUpFromLine className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-white font-medium">
                              {relayer.sended || '0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <ArrowDownToLine className="w-3.5 h-3.5 text-green-400" />
                            <span className="text-white font-medium">
                              {relayer.received || '0'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Network className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium mb-1">About IBC Relayers</h3>
                <p className="text-gray-400 text-sm">
                  IBC (Inter-Blockchain Communication) enables different blockchain networks to communicate and transfer assets. 
                  Each connection represents a pathway for cross-chain transactions between {selectedChain?.chain_name} and other networks.
                </p>
              </div>
            </div>
          </div>

          {/* Osmosis Channels & Transactions - Auto-expanded */}
          {selectedChain && relayers.length > 0 && (() => {
            const osmosisRelayer = relayers.find(r => 
              r.chainId.toLowerCase().includes('osmosis') || 
              r.chainName?.toLowerCase().includes('osmosis')
            );
            
            if (!osmosisRelayer) return null;
            
            return (
              <div className="space-y-6">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {osmosisRelayer.logo ? (
                        <img 
                          src={osmosisRelayer.logo} 
                          alt={osmosisRelayer.chainName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          O
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          {osmosisRelayer.chainName || osmosisRelayer.chainId}
                        </h2>
                        <p className="text-gray-400 text-sm">IBC Connection Details</p>
                      </div>
                    </div>
                    <button
                      onClick={() => router.push(`/${chainPath}/relayers/${osmosisRelayer.chainId}`)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                    >
                      View Full Details
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-400 text-xs mb-1">Total Channels</div>
                      <div className="text-white text-xl font-bold">{osmosisRelayer.totalChannels}</div>
                    </div>
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-400 text-xs mb-1">Open Channels</div>
                      <div className="text-green-400 text-xl font-bold">{osmosisRelayer.openChannels}</div>
                    </div>
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-400 text-xs mb-1">Transfer Out</div>
                      <div className="text-blue-400 text-xl font-bold">{osmosisRelayer.sended || '0'}</div>
                    </div>
                    <div className="bg-[#111111] rounded-lg p-3 border border-gray-800">
                      <div className="text-gray-400 text-xs mb-1">Transfer In</div>
                      <div className="text-green-400 text-xl font-bold">{osmosisRelayer.received || '0'}</div>
                    </div>
                  </div>
                </div>

                {/* Fetch and display channels/transactions for Osmosis */}
                <OsmosisChannelsSection 
                  chainName={selectedChain.chain_name}
                  chainPath={chainPath}
                  relayerId={osmosisRelayer.chainId}
                  relayerName={osmosisRelayer.chainName || osmosisRelayer.chainId}
                />
              </div>
            );
          })()}
        </main>

        {/* IBC Bridge Modal */}
        {selectedChain && (
          <IBCBridgeModal
            isOpen={isBridgeModalOpen}
            onClose={() => setIsBridgeModalOpen(false)}
            sourceChain={selectedChain}
            connectedChains={relayers.map(r => ({
              chainId: r.chainId,
              chainName: r.chainName || r.chainId,
              logo: r.logo
            }))}
          />
        )}
      </div>
    </div>
  );
}
