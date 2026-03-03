'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChainData } from '@/types/chain';
import { Globe, TrendingUp, Network } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Check if homepage is disabled (default: enabled)
  const disableHomepage = process.env.NEXT_PUBLIC_DISABLE_HOMEPAGE === '1';
  const defaultChain = process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'paxi-mainnet';

  useEffect(() => {
    // If homepage disabled, redirect to default chain
    if (disableHomepage) {
      router.replace(`/${defaultChain}`);
      return;
    }

    // Load chains for homepage
    fetch('/api/chains')
      .then(res => res.json())
      .then(data => {
        setChains(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading chains:', error);
        setLoading(false);
      });
  }, [disableHomepage, defaultChain, router]);

  const filteredChains = chains.filter(chain => 
    chain.chain_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.chain_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mainnets = filteredChains.filter(c => !c.chain_name.includes('test'));
  const testnets = filteredChains.filter(c => c.chain_name.includes('test'));

  // Show loading while checking config or loading chains
  if (disableHomepage || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">
            {disableHomepage ? 'Redirecting...' : 'Loading chains...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-gray-800 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Winscan" width={40} height={40} />
              <div>
                <h1 className="text-xl font-bold text-white">Winscan Explorer</h1>
                <p className="text-xs text-gray-400">Multi-chain blockchain explorer</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-lg border border-blue-500/20">
                {chains.length} Networks
              </span>
              <select className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">
                <option>🇺🇸 English</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-400 text-sm font-medium">Powered by Cosmos SDK</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Explore the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 animate-gradient">
              Cosmos Universe
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your gateway to explore, analyze, and interact with{' '}
            <span className="text-blue-400 font-semibold">{chains.length}+ blockchain networks</span>
            {' '}in the Cosmos ecosystem
          </p>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a]/50 backdrop-blur-sm border border-gray-800 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300 font-medium">Real-time Updates</span>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a]/50 backdrop-blur-sm border border-gray-800 rounded-xl">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300 font-medium">Multi-Chain Support</span>
            </div>
            <div className="flex items-center justify-center gap-3 px-6 py-4 bg-[#1a1a1a]/50 backdrop-blur-sm border border-gray-800 rounded-xl">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300 font-medium">Advanced Analytics</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search for any blockchain network..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-2xl px-8 py-5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl">
                  <Globe className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total Networks</p>
                  <p className="text-4xl font-bold text-white">{chains.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Mainnets</p>
                  <p className="text-4xl font-bold text-white">{mainnets.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
            <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl">
                  <Network className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Testnets</p>
                  <p className="text-4xl font-bold text-white">{testnets.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mainnet Chains */}
        {mainnets.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">Mainnet Networks</h2>
                <span className="px-4 py-1.5 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 text-blue-400 text-sm font-semibold rounded-full">
                  {mainnets.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {mainnets.map((chain) => (
                <button
                  key={chain.chain_name}
                  onClick={() => router.push(`/${chain.chain_name.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-gray-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 rounded-2xl transition-all"></div>
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                      <Image
                        src={chain.logo}
                        alt={chain.chain_name}
                        width={64}
                        height={64}
                        className="relative rounded-full transition-transform group-hover:scale-110 ring-2 ring-gray-800 group-hover:ring-blue-500/50"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-white text-center line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {chain.chain_name.replace('-mainnet', '').replace('-test', '')}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Testnet Chains */}
        {testnets.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-white">Testnet Networks</h2>
                <span className="px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border border-purple-500/30 text-purple-400 text-sm font-semibold rounded-full">
                  {testnets.length}
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {testnets.map((chain) => (
                <button
                  key={chain.chain_name}
                  onClick={() => router.push(`/${chain.chain_name.toLowerCase().replace(/\s+/g, '-')}`)}
                  className="group relative bg-gradient-to-br from-[#1a1a2e] to-[#16162a] border border-gray-800 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-2xl transition-all"></div>
                  <div className="relative flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                      <Image
                        src={chain.logo}
                        alt={chain.chain_name}
                        width={64}
                        height={64}
                        className="relative rounded-full transition-transform group-hover:scale-110 ring-2 ring-gray-800 group-hover:ring-purple-500/50"
                      />
                    </div>
                    <h3 className="text-sm font-semibold text-white text-center line-clamp-2 group-hover:text-purple-400 transition-colors">
                      {chain.chain_name.replace('-mainnet', '').replace('-test', '')}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0f0f0f] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400 text-sm">
          © 2025 Winscan. Multi-chain blockchain explorer.
        </div>
      </footer>
    </div>
  );
}
