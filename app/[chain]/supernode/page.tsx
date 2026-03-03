'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { Server, Activity, Database, MapPin, Search, Copy, Check } from 'lucide-react';
import ValidatorAvatar from '@/components/ValidatorAvatar';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const SupernodeMap = dynamic(() => import('@/components/SupernodeMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
    </div>
  )
});

interface Supernode {
  address: string;
  moniker: string;
  status: string;
  location?: string;
  country?: string;
  city?: string;
  flag?: string;
  cpu?: string;
  ram?: string;
  disk?: string;
  specs?: {
    cpu: number;
    ram: number;
    disk: number;
  };
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  validatorAddress?: string;
  identity?: string;
  version?: string;
  participation?: number;
  provider?: string;
  isApiAvailable?: boolean;
  latitude?: number;
  longitude?: number;
}

// Helper function to get country info from IP address or hostname
const getCountryInfo = (ipAddress: string): { flag: string; country: string; city: string } => {
  // Handle domain names and hostnames
  const location = ipAddress.toLowerCase();

  // Domain-based mapping
  if (location.includes('husonode')) return { flag: '🇩🇪', country: 'Germany', city: 'Karlsruhe' };
  if (location.includes('.de') || location.includes('germany')) return { flag: '🇩🇪', country: 'Germany', city: 'Frankfurt' };
  if (location.includes('.us') || location.includes('usa') || location.includes('america')) return { flag: '🇺🇸', country: 'United States', city: 'New York' };
  if (location.includes('.uk') || location.includes('britain') || location.includes('london')) return { flag: '🇬🇧', country: 'United Kingdom', city: 'London' };
  if (location.includes('.fr') || location.includes('france') || location.includes('paris')) return { flag: '🇫🇷', country: 'France', city: 'Paris' };
  if (location.includes('.jp') || location.includes('japan') || location.includes('tokyo')) return { flag: '🇯🇵', country: 'Japan', city: 'Tokyo' };
  if (location.includes('.kr') || location.includes('korea') || location.includes('seoul')) return { flag: '🇰🇷', country: 'South Korea', city: 'Seoul' };
  if (location.includes('.sg') || location.includes('singapore')) return { flag: '🇸🇬', country: 'Singapore', city: 'Singapore' };
  if (location.includes('.au') || location.includes('australia') || location.includes('sydney')) return { flag: '🇦🇺', country: 'Australia', city: 'Sydney' };
  if (location.includes('.ca') || location.includes('canada') || location.includes('toronto')) return { flag: '🇨🇦', country: 'Canada', city: 'Toronto' };
  if (location.includes('.nl') || location.includes('netherlands') || location.includes('amsterdam')) return { flag: '🇳🇱', country: 'Netherlands', city: 'Amsterdam' };
  if (location.includes('.ch') || location.includes('switzerland') || location.includes('zurich')) return { flag: '🇨🇭', country: 'Switzerland', city: 'Zurich' };
  if (location.includes('.se') || location.includes('sweden') || location.includes('stockholm')) return { flag: '🇸🇪', country: 'Sweden', city: 'Stockholm' };
  if (location.includes('.no') || location.includes('norway') || location.includes('oslo')) return { flag: '🇳🇴', country: 'Norway', city: 'Oslo' };
  if (location.includes('.fi') || location.includes('finland') || location.includes('helsinki')) return { flag: '🇫🇮', country: 'Finland', city: 'Helsinki' };
  if (location.includes('.pl') || location.includes('poland') || location.includes('warsaw')) return { flag: '🇵🇱', country: 'Poland', city: 'Warsaw' };
  if (location.includes('.ru') || location.includes('russia') || location.includes('moscow')) return { flag: '🇷🇺', country: 'Russia', city: 'Moscow' };
  if (location.includes('.br') || location.includes('brazil') || location.includes('sao')) return { flag: '🇧🇷', country: 'Brazil', city: 'São Paulo' };
  if (location.includes('.in') || location.includes('india') || location.includes('mumbai')) return { flag: '🇮🇳', country: 'India', city: 'Mumbai' };
  if (location.includes('.cn') || location.includes('china') || location.includes('beijing')) return { flag: '🇨🇳', country: 'China', city: 'Beijing' };

  // Cloud provider detection
  if (location.includes('aws') || location.includes('amazon')) return { flag: '🇺🇸', country: 'United States', city: 'AWS Cloud' };
  if (location.includes('gcp') || location.includes('google')) return { flag: '🇺🇸', country: 'United States', city: 'Google Cloud' };
  if (location.includes('azure') || location.includes('microsoft')) return { flag: '🇺🇸', country: 'United States', city: 'Azure Cloud' };
  if (location.includes('digitalocean')) return { flag: '🇺🇸', country: 'United States', city: 'DigitalOcean' };
  if (location.includes('linode')) return { flag: '🇺🇸', country: 'United States', city: 'Linode' };
  if (location.includes('vultr')) return { flag: '🇺🇸', country: 'United States', city: 'Vultr' };
  if (location.includes('hetzner')) return { flag: '🇩🇪', country: 'Germany', city: 'Hetzner' };
  if (location.includes('ovh')) return { flag: '🇫🇷', country: 'France', city: 'OVH' };

  // IP-based mapping (existing logic)
  if (location.includes('152.53')) return { flag: '🇵🇱', country: 'Poland', city: 'Warsaw' };
  if (location.includes('3.138')) return { flag: '🇺🇸', country: 'United States', city: 'Dublin' };
  if (location.includes('144.91')) return { flag: '🇩🇪', country: 'Germany', city: 'Nuremberg' };

  // City-based detection
  if (location.includes('london')) return { flag: '🇬🇧', country: 'United Kingdom', city: 'London' };
  if (location.includes('paris')) return { flag: '🇫🇷', country: 'France', city: 'Paris' };
  if (location.includes('berlin')) return { flag: '🇩🇪', country: 'Germany', city: 'Berlin' };
  if (location.includes('tokyo')) return { flag: '🇯🇵', country: 'Japan', city: 'Tokyo' };
  if (location.includes('sydney')) return { flag: '🇦🇺', country: 'Australia', city: 'Sydney' };
  if (location.includes('toronto')) return { flag: '🇨🇦', country: 'Canada', city: 'Toronto' };
  if (location.includes('singapore')) return { flag: '🇸🇬', country: 'Singapore', city: 'Singapore' };
  if (location.includes('mumbai')) return { flag: '🇮🇳', country: 'India', city: 'Mumbai' };
  if (location.includes('seoul')) return { flag: '🇰🇷', country: 'South Korea', city: 'Seoul' };

  // Default fallback
  return { flag: '🌍', country: 'Global', city: 'Unknown' };
};

// Circular Progress Component
const CircularProgress = ({ percentage, color, size = 60 }: { percentage: number; color: string; size?: number }) => {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const colorMap: { [key: string]: string } = {
    green: '#10b981',
    blue: '#3b82f6',
    purple: '#a855f7',
    orange: '#f97316',
    red: '#ef4444',
  };

  const strokeColor = colorMap[color] || colorMap.green;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="absolute text-xs font-semibold text-white">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

export default function SupernodePage() {
  const params = useParams();
  const router = useRouter();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [supernodes, setSupernodes] = useState<Supernode[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSupernodes, setLoadingSupernodes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: { address: boolean; validator: boolean } }>({});

  const copyToClipboard = (text: string, nodeAddress: string, type: 'address' | 'validator') => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({
      ...prev,
      [nodeAddress]: {
        ...prev[nodeAddress],
        [type]: true
      }
    }));
    setTimeout(() => {
      setCopiedStates(prev => ({
        ...prev,
        [nodeAddress]: {
          ...prev[nodeAddress],
          [type]: false
        }
      }));
    }, 2000);
  };

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
      setLoading(false);
    } else {
      fetch('/api/chains')
        .then(res => res.json())
        .then(data => {
          sessionStorage.setItem('chains', JSON.stringify(data));
          setChains(data);
          const chainName = (params?.chain as string)?.trim();
          const chain = chainName
            ? data.find((c: ChainData) => c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase())
            : data.find((c: ChainData) => c.chain_name === 'lumera-mainnet') || data[0];
          if (chain) setSelectedChain(chain);
          setLoading(false);
        });
    }
  }, [params]);

  useEffect(() => {
    if (!selectedChain) return;

    if (!selectedChain.chain_name.toLowerCase().includes('lumera')) {
      setLoadingSupernodes(false);
      return;
    }

    // Fetch validators first to get identity data
    fetch(`/api/validators?chain=${selectedChain.chain_name}`)
      .then(res => res.json())
      .then(validatorData => {
        console.log('Validator data:', validatorData); // Debug

        // Then fetch supernode metrics
        return fetch('/api/supernode/metrics?limit=200')
          .then(res => res.json())
          .then(async (data) => {
            console.log('Supernode data:', data); // Debug
            if (data.nodes) {
              // Helper function to extract IP without port
              const extractIPOnly = (ipAddress: string): string => {
                if (!ipAddress) return '';
                // Remove port if present (e.g., "3.151.52.219:26656" -> "3.151.52.219")
                return ipAddress.split(':')[0];
              };

              // Collect all unique IPs for batch lookup (without ports)
              const allIPs = data.nodes
                .map((node: any) => extractIPOnly(node.ip_address))
                .filter((ip: any): ip is string => Boolean(ip));
              const uniqueIPs = [...new Set(allIPs)] as string[];

              // Batch lookup IPs to get accurate country/city data
              const ipLocationMap = new Map<string, any>();

              // Lookup each IP using the IP lookup API
              await Promise.all(
                uniqueIPs.map(async (ip) => {
                  try {
                    const response = await fetch(`/api/tools/ip-lookup?query=${encodeURIComponent(ip)}`);
                    const result = await response.json();
                    if (result.success && result.location) {
                      ipLocationMap.set(ip, {
                        country: result.location.country,
                        city: result.location.city,
                        countryCode: result.location.countryCode,
                        flag: getFlagEmoji(result.location.countryCode),
                        provider: result.location.provider || 'Unknown',
                        latitude: result.location.latitude || 0,
                        longitude: result.location.longitude || 0
                      });
                    }
                  } catch (error) {
                    console.error(`Failed to lookup IP ${ip}:`, error);
                  }
                })
              );

              const nodesWithSpecs = data.nodes.map((node: any) => {
                // Extract IP without port
                const ipOnly = extractIPOnly(node.ip_address || '');

                // Get location from IP lookup or fallback to pattern matching
                const ipLocation = ipLocationMap.get(ipOnly);
                const countryInfo = ipLocation || getCountryInfo(ipOnly);

                // Find matching validator by validator_address using validatorData directly
                const matchingValidator = validatorData.find((v: any) =>
                  v.address === node.validator_address
                );

                console.log(`Node ${node.validator_moniker}: validator_address=${node.validator_address}, identity=${matchingValidator?.identity}`); // Debug

                return {
                  address: node.supernode_account || node.validator_address,
                  moniker: node.validator_moniker || 'Unknown',
                  status: node.current_state === 'SUPERNODE_STATE_ACTIVE' ? 'active' : 'postponed',
                  location: ipOnly || 'Unknown', // Store IP without port
                  flag: countryInfo.flag,
                  city: countryInfo.city,
                  country: countryInfo.country,
                  provider: ipLocation?.provider || 'Unknown',
                  validatorAddress: node.validator_address,
                  identity: matchingValidator?.identity || '',
                  isApiAvailable: node.is_status_api_available || false,
                  latitude: ipLocation?.latitude || 0,
                  longitude: ipLocation?.longitude || 0,
                  specs: {
                    cpu: node.cpu_cores || 0,
                    ram: Math.round(node.memory_total_gb || 0),
                    disk: parseFloat((node.storage_total_bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)) || 0
                  },
                  cpuUsage: node.cpu_usage_percent || 0,
                  ramUsage: node.memory_usage_percent || 0,
                  diskUsage: node.storage_usage_percent || 0,
                };
              });

              // Remove duplicates based on supernode address (primary key)
              const uniqueNodes = nodesWithSpecs.filter((node: Supernode, index: number, self: Supernode[]) =>
                index === self.findIndex((n: Supernode) => n.address === node.address)
              );

              // Filter out specific supernode address that should be hidden
              const filteredNodes = uniqueNodes.filter((node: Supernode) =>
                node.address !== 'lumera10gc9x5tkcr8kr06kh48tfgr5pls4avg82jgr46'
              );

              console.log('Processed nodes:', nodesWithSpecs.length, 'Unique nodes:', uniqueNodes.length, 'Filtered nodes:', filteredNodes.length); // Debug
              setSupernodes(filteredNodes);
            }
            setLoadingSupernodes(false);
          });
      })
      .catch(error => {
        console.error('Error fetching supernodes:', error);
        setLoadingSupernodes(false);
      });
  }, [selectedChain]);

  const filteredSupernodes = supernodes.filter(node =>
    node.moniker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.validatorAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeNodes = supernodes.filter(n => n.status === 'active' || !n.status).length;
  const totalCPU = supernodes.reduce((sum, n) => sum + (n.specs?.cpu || 0), 0);
  const totalRAM = supernodes.reduce((sum, n) => sum + (n.specs?.ram || 0), 0);
  const totalDisk = supernodes.reduce((sum, n) => sum + (parseFloat(n.specs?.disk?.toString() || '0') || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex">
        <Sidebar selectedChain={selectedChain} />
        <div className="flex-1 flex flex-col">
          <Header chains={chains} selectedChain={selectedChain} onSelectChain={setSelectedChain} />
          <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500/20 border-t-blue-500"></div>
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
        <main className="flex-1 mt-32 md:mt-16 p-3 md:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Supernodes Explorer</h1>
              <p className="text-gray-400">Network Infrastructure & Parameters</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase">Active Nodes</span>
                <Activity className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{activeNodes}</p>
              <p className="text-gray-500 text-sm">of {supernodes.length} total</p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase">Total CPU</span>
                <Server className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{totalCPU}</p>
              <p className="text-gray-500 text-sm">vCPU cores</p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase">Total RAM</span>
                <Database className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{totalRAM}GB</p>
              <p className="text-gray-500 text-sm">memory capacity</p>
            </div>

            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm uppercase">Total Storage</span>
                <MapPin className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{totalDisk.toFixed(1)}TB</p>
              <p className="text-gray-500 text-sm">disk capacity</p>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Network Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Resource Usage */}
              <div className="bg-[#111111] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Average Resource Usage</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">CPU Usage</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.round(supernodes.reduce((sum, n) => sum + (n.cpuUsage || 0), 0) / supernodes.length) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">RAM Usage</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.round(supernodes.reduce((sum, n) => sum + (n.ramUsage || 0), 0) / supernodes.length) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Disk Usage</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.round(supernodes.reduce((sum, n) => sum + (n.diskUsage || 0), 0) / supernodes.length) : 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Hardware Distribution */}
              <div className="bg-[#111111] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Hardware Distribution</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Min CPU</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.min(...supernodes.map(n => n.specs?.cpu || 0)) : 0} cores
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Max CPU</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.max(...supernodes.map(n => n.specs?.cpu || 0)) : 0} cores
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Avg RAM</span>
                    <span className="text-white font-medium">
                      {supernodes.length > 0 ? Math.round(supernodes.reduce((sum, n) => sum + (n.specs?.ram || 0), 0) / supernodes.length) : 0}GB
                    </span>
                  </div>
                </div>
              </div>

              {/* Network Health */}
              <div className="bg-[#111111] rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Network Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Active Nodes</span>
                    <span className="text-green-400 font-medium">{activeNodes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Postponed</span>
                    <span className="text-orange-400 font-medium">{supernodes.length - activeNodes}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Uptime</span>
                    <span className="text-white font-medium">
                      {activeNodes > 0 ? Math.round((activeNodes / supernodes.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive World Map */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Global Distribution</h2>
              <p className="text-gray-400 text-sm mt-1">{activeNodes} active nodes across multiple regions</p>
            </div>
            <div className="relative h-[700px] bg-[#0a0a0a]">
              {supernodes.length > 0 && (
                <SupernodeMap
                  supernodes={supernodes
                    .filter(node => node.latitude && node.longitude)
                    .map(node => ({
                      lat: node.latitude!,
                      lng: node.longitude!,
                      moniker: node.moniker,
                      address: node.address,
                      identity: node.identity || '',
                      country: node.country || 'Unknown',
                      city: node.city || 'Unknown',
                      status: node.status,
                      flag: node.flag || '🌍'
                    }))}
                />
              )}
            </div>
          </div>

          {/* Top Locations - Keep this for additional info */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Top Locations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(
                supernodes.reduce((acc: any, node) => {
                  const country = node.country || 'Unknown';
                  acc[country] = (acc[country] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort(([, a]: any, [, b]: any) => b - a)
                .slice(0, 3)
                .map(([country, count]: any) => {
                  const node = supernodes.find(n => n.country === country);
                  return (
                    <div key={country} className="bg-[#111111] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{node?.flag || '🌍'}</span>
                        <span className="text-white font-medium">{country}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{count} node{count > 1 ? 's' : ''}</p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Supernodes Table */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Supernode Network</h2>
                  <p className="text-gray-400 text-sm mt-1">Total: {filteredSupernodes.length} Nodes ({activeNodes} Active)</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by validator, location, provider, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] border border-gray-800 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {loadingSupernodes ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/20 border-t-blue-500 mb-4"></div>
                <p className="text-gray-400">Loading supernodes...</p>
              </div>
            ) : filteredSupernodes.length === 0 ? (
              <div className="p-12 text-center">
                <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No supernodes found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table Header */}
                <div className="bg-[#111111] border-b border-gray-800 px-6 py-4">
                  <div className="grid grid-cols-8 gap-4 text-xs font-semibold text-gray-400 uppercase">
                    <div className="col-span-2">Supernode</div>
                    <div>Country</div>
                    <div>Provider</div>
                    <div>State</div>
                    <div>API Status</div>
                    <div>Hardware</div>
                    <div>Specs</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-800">
                  {filteredSupernodes.map((node) => {
                    const copiedAddress = copiedStates[node.address]?.address || false;
                    const copiedValidator = copiedStates[node.address]?.validator || false;

                    return (
                      <div
                        key={node.address}
                        className="px-6 py-4 hover:bg-[#111111] transition-colors"
                      >
                        <div className="grid grid-cols-8 gap-4 items-center">
                          {/* Supernode (Validator Info) */}
                          <div className="col-span-2 flex items-center gap-3">
                            <ValidatorAvatar
                              identity={node.identity}
                              moniker={node.moniker}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <h3
                                className="text-white font-semibold truncate text-sm cursor-pointer hover:text-blue-400"
                                onClick={() => router.push(`/${params.chain}/supernode/${node.address}`)}
                              >
                                {node.moniker || 'Unknown'}
                              </h3>
                              <div className="flex items-center gap-1 group">
                                <p className="text-gray-500 text-xs font-mono truncate">{node.address}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(node.address, node.address, 'address');
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy address"
                                >
                                  {copiedAddress ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                                  )}
                                </button>
                              </div>
                              {node.validatorAddress && (
                                <div className="flex items-center gap-1 group mt-0.5">
                                  <p className="text-gray-600 text-xs font-mono truncate">
                                    {node.validatorAddress.slice(0, 20)}...
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(node.validatorAddress!, node.address, 'validator');
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy validator address"
                                  >
                                    {copiedValidator ? (
                                      <Check className="w-3 h-3 text-green-400" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Country */}
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{node.flag}</span>
                            <div>
                              <p className="text-white text-sm font-medium">{node.country || 'Unknown'}</p>
                              <p className="text-gray-500 text-xs">{node.city || 'N/A'}</p>
                            </div>
                          </div>

                          {/* Provider */}
                          <div>
                            <p className="text-white text-sm font-medium">{node.provider || 'Unknown'}</p>
                          </div>

                          {/* State */}
                          <div>
                            {node.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                POSTPONED
                              </span>
                            )}
                          </div>

                          {/* API Status */}
                          <div>
                            {node.isApiAvailable ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-400">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                ONLINE
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                OFFLINE
                              </span>
                            )}
                          </div>

                          {/* Hardware (Resource Usage) - Larger Size */}
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                              <CircularProgress
                                percentage={node.cpuUsage || 0}
                                color={node.cpuUsage && node.cpuUsage > 80 ? 'red' : node.cpuUsage && node.cpuUsage > 60 ? 'orange' : 'green'}
                                size={70}
                              />
                              <span className="text-xs text-gray-400 font-medium">CPU</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <CircularProgress
                                percentage={node.ramUsage || 0}
                                color={node.ramUsage && node.ramUsage > 80 ? 'red' : node.ramUsage && node.ramUsage > 60 ? 'orange' : 'blue'}
                                size={70}
                              />
                              <span className="text-xs text-gray-400 font-medium">RAM</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                              <CircularProgress
                                percentage={node.diskUsage || 0}
                                color={node.diskUsage && node.diskUsage > 80 ? 'red' : node.diskUsage && node.diskUsage > 60 ? 'orange' : 'purple'}
                                size={70}
                              />
                              <span className="text-xs text-gray-400 font-medium">Disk</span>
                            </div>
                          </div>

                          {/* Specs */}
                          <div>
                            <p className="text-white text-sm">{node.specs?.cpu || 0}c / {node.specs?.ram || 0}GB</p>
                            <p className="text-gray-500 text-xs">{node.specs?.disk || 0}TB disk</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// Helper function to convert country code to flag emoji
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode === 'XX') return '🌍';

  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
