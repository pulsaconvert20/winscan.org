'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StakingCalculator from '@/components/StakingCalculator';
import { ChainData } from '@/types/chain';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';

export default function StakingCalculatorPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);

  useEffect(() => {
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

  const handleSelectChain = (chain: ChainData) => {
    setSelectedChain(chain);
  };

  if (!selectedChain) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar selectedChain={selectedChain} />
      <Header 
        chains={chains} 
        selectedChain={selectedChain} 
        onSelectChain={handleSelectChain}
      />
      
      <main className="pt-16 md:pt-16 lg:pt-24">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t('menu.stakingCalculator')}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Calculate your potential staking rewards for {selectedChain.chain_name}
            </p>
          </div>

          {/* Calculator Component */}
          <StakingCalculator selectedChain={selectedChain} />

          {/* Additional Info */}
          <div className="mt-6 bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-3">How Staking Works</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <p>
                <strong className="text-gray-300">Staking</strong> is the process of locking your tokens 
                to support network operations and earn rewards.
              </p>
              <p>
                <strong className="text-gray-300">APR (Annual Percentage Rate)</strong> represents the 
                yearly return on your staked tokens without compounding.
              </p>
              <p>
                <strong className="text-gray-300">Compound Interest</strong> means reinvesting your rewards 
                to earn additional returns over time.
              </p>
              <p>
                <strong className="text-gray-300">Validator Commission</strong> is typically deducted from 
                your rewards. Check individual validator rates before staking.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
