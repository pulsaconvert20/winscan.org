'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LumeOsmoBridge from '@/components/LumeOsmoBridge';
import { ChainData } from '@/types/chain';

export default function BridgePage() {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);

  useEffect(() => {
    fetch('/api/chains', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setChains(data);
        // Default to lumera-mainnet for bridge
        const defaultChain = data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
        if (defaultChain) setSelectedChain(defaultChain);
      })
      .catch(err => console.error('Error loading chains:', err));
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
                Cross-Chain Bridge
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                Seamlessly transfer tokens between Lumera and Osmosis networks using secure IBC protocol.
                Fast, reliable, and decentralized cross-chain transfers.
              </p>
            </div>

            {/* Bridge Component */}
            <div className="flex justify-center">
              <LumeOsmoBridge />
            </div>

            {/* Info Section */}
            <div className="mt-12 max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8">
                {/* How it Works */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    How IBC Bridge Works
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-semibold">1</span>
                      </div>
                      <p className="text-gray-400">
                        Connect your wallet and select the source chain
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-semibold">2</span>
                      </div>
                      <p className="text-gray-400">
                        Enter amount and destination address
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500/20 border border-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-400 text-sm font-semibold">3</span>
                      </div>
                      <p className="text-gray-400">
                        Sign transaction and wait for IBC relay (3-5 minutes)
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-green-400 text-sm font-semibold">✓</span>
                      </div>
                      <p className="text-gray-400">
                        Tokens arrive on destination chain
                      </p>
                    </div>
                  </div>
                </div>

                {/* Supported Routes */}
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Supported Routes
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src="/logos/lume.png" alt="LUME" className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-white">LUME</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                      </svg>
                      <div className="flex items-center space-x-3">
                        <img src="/logos/osmo.png" alt="OSMO" className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-white">OSMO</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border border-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img src="/logos/osmo.png" alt="OSMO" className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-white">OSMO</span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                      </svg>
                      <div className="flex items-center space-x-3">
                        <img src="/logos/lume.png" alt="LUME" className="w-6 h-6 rounded-full" />
                        <span className="font-medium text-white">LUME</span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <p className="text-blue-400 text-sm">
                        💡 More routes coming soon! Request new bridges in our Discord.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div className="mt-8 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-4">
                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-3 bg-[#0f0f0f] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                      <span className="font-medium text-white">How long does a bridge transfer take?</span>
                      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-3 p-3 text-gray-400">
                      IBC transfers typically take 3-5 minutes to complete. The time depends on block times of both chains and relayer activity.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-3 bg-[#0f0f0f] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                      <span className="font-medium text-white">What are the fees?</span>
                      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-3 p-3 text-gray-400">
                      You only pay the network transaction fee on the source chain (typically ~0.01 tokens). There are no additional bridge fees.
                    </div>
                  </details>

                  <details className="group">
                    <summary className="flex justify-between items-center cursor-pointer p-3 bg-[#0f0f0f] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
                      <span className="font-medium text-white">Is it safe?</span>
                      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="mt-3 p-3 text-gray-400">
                      Yes! IBC is a secure, battle-tested protocol used across the Cosmos ecosystem. Your funds are protected by cryptographic proofs and cannot be intercepted.
                    </div>
                  </details>
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