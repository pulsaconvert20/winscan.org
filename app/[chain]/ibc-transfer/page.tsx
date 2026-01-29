'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import IBCTransferInterface from '@/components/IBCTransferInterface';
import { ChainData } from '@/types/chain';
import { ArrowRightLeft, Network, Globe, CheckCircle, Zap, Clock, Shield, Info } from 'lucide-react';
import { fetchApi } from '@/lib/api';

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

export default function IBCTransferPage() {
  const params = useParams();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relayers, setRelayers] = useState<Relayer[]>([]);
  const [loadingRelayers, setLoadingRelayers] = useState(false);

  useEffect(() => {
    const cachedChains = sessionStorage.getItem('chains');
    
    if (cachedChains) {
      const data = JSON.parse(cachedChains);
      setChains(data);
      const chainName = (params?.chain as string)?.trim();
      const chain = chainName 
        ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
        : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
      if (chain) {
        setSelectedChain(chain);
        setLoading(false);
      }
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
          if (chain) {
            setSelectedChain(chain);
            setLoading(false);
          }
        });
    }
  }, [params]);

  // Load relayers for stats display
  useEffect(() => {
    if (!selectedChain) return;

    const fetchRelayers = async () => {
      setLoadingRelayers(true);
      try {
        const response = await fetchApi(`/api/relayers?chain=${selectedChain.chain_name}`);
        const data = await response.json();
        setRelayers(data.relayers || []);
      } catch (error) {
        console.error('Error fetching relayers:', error);
        setRelayers([]);
      } finally {
        setLoadingRelayers(false);
      }
    };

    fetchRelayers();
  }, [selectedChain]);

  if (loading && !selectedChain) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <div className="flex-1 flex flex-col">
          <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
          <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
              </div>
              <p className="text-gray-400">Loading chain data...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!selectedChain) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <div className="flex-1 flex flex-col">
          <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
          <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 flex items-center justify-center">
            <p className="text-gray-400">Chain not found</p>
          </main>
        </div>
      </div>
    );
  }

  const connectedChains = relayers.filter(r => r.status === 'active');

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <Sidebar selectedChain={selectedChain} />
      <div className="flex-1 flex flex-col">
        <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
        <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6">
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <ArrowRightLeft className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl md:text-3xl font-bold text-white">IBC Transfer</h1>
            </div>
            <p className="text-gray-400">
              Transfer tokens across IBC-enabled chains securely and efficiently
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Network className="w-5 h-5 text-blue-500" />
                <span className="text-gray-400 text-sm">Connected Chains</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loadingRelayers ? '...' : connectedChains.length}
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-5 h-5 text-green-500" />
                <span className="text-gray-400 text-sm">Active Channels</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loadingRelayers ? '...' : relayers.reduce((sum, r) => sum + parseInt(r.openChannels || '0'), 0)}
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-5 h-5 text-purple-500" />
                <span className="text-gray-400 text-sm">Total Transfers</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loadingRelayers ? '...' : relayers.reduce((sum, r) => sum + parseInt(r.sended || '0') + parseInt(r.received || '0'), 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <Zap className="w-6 h-6 text-yellow-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">Fast Transfers</h3>
              <p className="text-gray-400 text-sm">
                Complete transfers in minutes with IBC protocol
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <Shield className="w-6 h-6 text-green-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">Secure</h3>
              <p className="text-gray-400 text-sm">
                Trustless cross-chain transfers with cryptographic proofs
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
              <Clock className="w-6 h-6 text-blue-500 mb-2" />
              <h3 className="text-white font-semibold mb-1">Real-time Tracking</h3>
              <p className="text-gray-400 text-sm">
                Monitor your transfer status in real-time
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">About IBC Transfers</h4>
                <p className="text-gray-400 text-sm">
                  IBC (Inter-Blockchain Communication) enables secure token transfers between different blockchains. 
                  Transfers typically complete within 1-3 minutes. Make sure you have enough tokens for transaction fees on both chains.
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Interface */}
          <IBCTransferInterface sourceChain={selectedChain} />
        </main>
        <Footer />
      </div>
    </div>
  );
}