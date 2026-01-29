'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChainData } from '@/types/chain';

export default function RelayersPage() {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [relayers, setRelayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chains', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setChains(data);
        const defaultChain = data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
        if (defaultChain) setSelectedChain(defaultChain);
      })
      .catch(err => console.error('Error loading chains:', err));
  }, []);

  // Mock relayer data - replace with actual API call
  useEffect(() => {
    const mockRelayers = [
      {
        id: 'relayer-1',
        name: 'Lumera-Osmosis Relayer',
        sourceChain: 'lumera_1916-1',
        destChain: 'osmosis-1',
        channelId: 'channel-0',
        status: 'active',
        packetsRelayed: 1234,
        uptime: '99.8%',
        lastActivity: new Date().toISOString(),
      },
      {
        id: 'relayer-2', 
        name: 'Osmosis-Lumera Relayer',
        sourceChain: 'osmosis-1',
        destChain: 'lumera_1916-1',
        channelId: 'channel-1',
        status: 'active',
        packetsRelayed: 987,
        uptime: '99.5%',
        lastActivity: new Date().toISOString(),
      }
    ];
    
    setTimeout(() => {
      setRelayers(mockRelayers);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <div className="flex-1 flex flex-col">
        <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />

        <main className="flex-1 mt-32 lg:mt-16 p-4 md:p-6 overflow-auto">
          
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                IBC Relayers
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Monitor and manage IBC relayers for cross-chain packet transmission.
                Real-time status and performance metrics.
              </p>
            </div>

            {/* Relayers Table */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Active Relayers</h2>
              </div>
              
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading relayers...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0f0f0f]">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Relayer</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Route</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Channel</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Packets</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Uptime</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {relayers.map((relayer) => (
                        <tr key={relayer.id} className="hover:bg-[#0f0f0f] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">{relayer.name}</div>
                            <div className="text-sm text-gray-400">{relayer.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-white text-sm">{relayer.sourceChain}</span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                              <span className="text-white text-sm">{relayer.destChain}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-blue-400 font-mono text-sm">{relayer.channelId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              relayer.status === 'active' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                relayer.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                              {relayer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-mono">{relayer.packetsRelayed.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-green-400 font-medium">{relayer.uptime}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-400 text-sm">
                              {new Date(relayer.lastActivity).toLocaleString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Relayers</p>
                    <p className="text-2xl font-bold text-white">{relayers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Active Relayers</p>
                    <p className="text-2xl font-bold text-green-400">
                      {relayers.filter(r => r.status === 'active').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Packets</p>
                    <p className="text-2xl font-bold text-white">
                      {relayers.reduce((sum, r) => sum + r.packetsRelayed, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}