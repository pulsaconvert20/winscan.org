
'use client';

import { useState, useEffect, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useParams } from 'next/navigation';
import { ChainData } from '@/types/chain';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import { fetchChains } from '@/lib/apiCache';
import { Coins, Activity, Users } from 'lucide-react';

interface TokenItem {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: string;
  holders?: number;
}

export default function EVMTokensPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    const cachedChains = sessionStorage.getItem('chains');
    if (cachedChains) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = params?.chain as string;
      const chain = chainName 
        ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
        : data[0];
      if (chain) setSelectedChain(chain);
    } else {
      fetchChains()
        .then(data => {
          sessionStorage.setItem('chains', JSON.stringify(data));
          setChains(data);
          const chainName = params?.chain as string;
          const chain = chainName 
            ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
            : data[0];
          if (chain) setSelectedChain(chain);
        })
        .catch(err => console.error('Error loading chains:', err));
    }
  }, [params]);

  // Fetch token data from real API
  useEffect(() => {
    if (!selectedChain) return;
    setLoading(true);
    const chainName = selectedChain.chain_name.toLowerCase().replace(/\s+/g, '-');
    fetch(`/api/evm/tokens?chain=${chainName}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.tokens)) {
          setTokens(data.tokens);
        } else {
          setTokens([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch tokens');
        setLoading(false);
      });
  }, [selectedChain]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar selectedChain={selectedChain} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0a0a0a]">
          <div className="container mx-auto px-3 md:px-6 py-6 md:py-8 pt-24 md:pt-8">
            <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">EVM Tokens</h1>
                <p className="text-gray-400 text-sm md:text-base">Tokens for {selectedChain?.chain_name || ''}</p>
              </div>
              {!isRefreshing && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-xs text-gray-400">{loading ? 'Loading' : 'Live'}</span>
                </div>
              )}
            </div>
            {/* Stats Cards (dummy) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">Total Tokens</span>
                  <Coins className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-white">{tokens.length}</p>
              </div>
              {/* Add more cards if needed */}
            </div>
            {/* Table */}
            {loading ? (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-800 rounded"></div>
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
                <p className="text-red-200">{error}</p>
              </div>
            ) : (
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-[#0f0f0f]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Decimals</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Supply</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Holders</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[#1a1a1a] divide-y divide-gray-800">
                      {tokens.map((token, i) => (
                        <tr key={i}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.symbol}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.decimals}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.totalSupply || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{token.holders !== undefined ? token.holders : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
