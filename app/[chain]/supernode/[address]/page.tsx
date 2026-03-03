'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { Server, Activity, Cpu, HardDrive, Database, MapPin, ArrowLeft, Clock, CheckCircle, XCircle, ExternalLink, Copy, Check } from 'lucide-react';
import ValidatorAvatar from '@/components/ValidatorAvatar';
import SupernodeRecentActivity from '@/components/SupernodeRecentActivity';

interface SupernodeDetail {
  address: string;
  moniker: string;
  status: string;
  location?: string;
  country?: string;
  city?: string;
  flag?: string;
  specs?: {
    cpu: number;
    ram: number;
    disk: number;
  };
  cpuUsage?: number;
  ramUsage?: number;
  diskUsage?: number;
  uptime?: number;
  version?: string;
  peers?: number;
  validatorAddress?: string;
  identity?: string;
  protocolVersion?: string;
  actualVersion?: string;
  p2pPort?: number;
  rank?: number;
  p2pDbSizeMb?: number;
  p2pRecords?: number;
  lastStatusCheck?: string;
  isStatusApiAvailable?: boolean;
  failedProbeCounter?: number;
  lastSuccessfulProbe?: string;
}

interface Action {
  id: string;
  type: string;
  creator: string;
  state: string;
  block_height: number;
  register_tx_id?: string;
  finalize_tx_id?: string;
  register_tx_time?: string;
  finalize_tx_time?: string;
  mime_type?: string;
  size?: number;
  price?: {
    denom: string;
    amount: string;
  };
  decoded?: {
    data_hash?: string;
    file_name?: string;
    public?: boolean;
    rq_ids_ic?: number;
    rq_ids_ids?: string[];
    rq_ids_max?: number;
    signatures?: string;
  };
  transactions?: Array<{
    tx_type: string;
    tx_hash: string;
    height: number;
    block_time: string;
    gas_wanted: number;
    gas_used: number;
    action_price?: string;
    action_price_denom?: string;
    flow_payer?: string;
    flow_payee?: string;
    tx_fee?: string;
    tx_fee_denom?: string;
  }>;
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

// Format uptime
const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function SupernodeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [supernode, setSupernode] = useState<SupernodeDetail | null>(null);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedValidator, setCopiedValidator] = useState(false);

  const address = params.address as string;

  const copyToClipboard = (text: string, type: 'address' | 'validator') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedValidator(true);
      setTimeout(() => setCopiedValidator(false), 2000);
    }
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
    if (!selectedChain || !address) return;

    // Fetch validators first to get identity data
    fetch(`/api/validators?chain=${selectedChain.chain_name}`)
      .then(res => res.json())
      .then(validatorData => {
        // Use the working general metrics API and filter for specific supernode
        return fetch('/api/supernode/metrics?limit=200')
          .then(res => res.json())
          .then(data => {
            if (data.nodes) {
              const node = data.nodes.find((n: any) =>
                n.supernode_account === address || n.validator_address === address
              );

              if (node) {
                const countryInfo = getCountryInfo(node.ip_address || '');

                // Find matching validator by validator_address
                const matchingValidator = validatorData.find((v: any) =>
                  v.address === node.validator_address
                );

                setSupernode({
                  address: node.supernode_account || node.validator_address,
                  moniker: node.validator_moniker || 'Unknown',
                  status: node.current_state === 'SUPERNODE_STATE_ACTIVE' ? 'active' : 'postponed',
                  location: node.ip_address || 'Unknown',
                  flag: countryInfo.flag,
                  city: countryInfo.city,
                  country: countryInfo.country,
                  validatorAddress: node.validator_address,
                  identity: matchingValidator?.identity || '',
                  specs: {
                    cpu: node.cpu_cores || 0,
                    ram: Math.round(node.memory_total_gb || 0),
                    disk: parseFloat((node.storage_total_bytes / (1024 * 1024 * 1024 * 1024)).toFixed(1)) || 0
                  },
                  cpuUsage: node.cpu_usage_percent || 0,
                  ramUsage: node.memory_usage_percent || 0,
                  diskUsage: node.storage_usage_percent || 0,
                  uptime: node.uptime_seconds || 0,
                  version: node.actual_version || node.protocol_version || 'Unknown',
                  peers: node.peers_count || 0,
                  // Additional fields from API
                  protocolVersion: node.protocol_version || 'Unknown',
                  actualVersion: node.actual_version || 'Unknown',
                  p2pPort: node.p2p_port || 0,
                  rank: node.rank || 0,
                  p2pDbSizeMb: node.p2p_db_size_mb || 0,
                  p2pRecords: node.p2p_records || 0,
                  lastStatusCheck: node.last_status_check || '',
                  isStatusApiAvailable: node.is_status_api_available || false,
                  failedProbeCounter: node.failed_probe_counter || 0,
                  lastSuccessfulProbe: node.last_successful_probe || '',
                });
              }
            }
          });
      })
      .catch(error => {
        console.error('Error fetching supernode details:', error);
      });

    // Fetch actions using the working actions API
    fetch(`/api/supernode/actions?supernode=${address}&limit=50&include_transactions=true`)
      .then(res => res.json())
      .then(data => {
        console.log('Actions data:', data); // Debug
        if (data && data.items && Array.isArray(data.items)) {
          console.log('Actions items:', data.items.length); // Debug
          setActions(data.items);
        } else if (data && Array.isArray(data)) {
          // Handle case where data is directly an array
          console.log('Actions array:', data.length); // Debug
          setActions(data);
        } else {
          console.log('No valid actions data found:', data); // Debug
          setActions([]);
        }
        setLoadingActions(false);
      })
      .catch(error => {
        console.error('Error fetching actions:', error);
        setActions([]);
        setLoadingActions(false);
      });
  }, [selectedChain, address]);

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
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Supernodes
          </button>

          {supernode ? (
            <>
              {/* Header */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <ValidatorAvatar
                      identity={supernode.identity}
                      moniker={supernode.moniker}
                      size="xl"
                    />
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">{supernode.moniker}</h1>
                      <div className="flex items-center gap-2 group">
                        <p className="text-gray-500 text-sm font-mono">{supernode.address}</p>
                        <button
                          onClick={() => copyToClipboard(supernode.address, 'address')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Copy address"
                        >
                          {copiedAddress ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                          )}
                        </button>
                      </div>
                      {supernode.validatorAddress && (
                        <div className="flex items-center gap-2 group mt-1">
                          <p className="text-gray-600 text-xs font-mono">{supernode.validatorAddress}</p>
                          <button
                            onClick={() => copyToClipboard(supernode.validatorAddress!, 'validator')}
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
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xl">{supernode.flag}</span>
                        <span className="text-white text-sm">{supernode.country}, {supernode.city}</span>
                      </div>
                    </div>
                  </div>
                  {supernode.status === 'active' ? (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-green-500/20 text-green-400 border border-green-500/50">
                      <Activity className="w-4 h-4" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/50">
                      <Activity className="w-4 h-4" />
                      POSTPONED
                    </span>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#111111] rounded-lg p-4 text-center">
                    <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Uptime</p>
                    <p className="text-lg text-white font-bold">{formatUptime(supernode.uptime || 0)}</p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-4 text-center">
                    <Server className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Version</p>
                    <p className="text-lg text-white font-bold">{supernode.version}</p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-4 text-center">
                    <Database className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Peers</p>
                    <p className="text-lg text-white font-bold">{supernode.peers}</p>
                  </div>
                  <div className="bg-[#111111] rounded-lg p-4 text-center">
                    <MapPin className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Location</p>
                    <p className="text-lg text-white font-bold">{supernode.location}</p>
                  </div>
                </div>
              </div>

              {/* Resource Usage */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Resource Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <CircularProgress
                      percentage={supernode.cpuUsage || 0}
                      color={supernode.cpuUsage && supernode.cpuUsage > 80 ? 'red' : supernode.cpuUsage && supernode.cpuUsage > 60 ? 'orange' : 'green'}
                      size={120}
                    />
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Cpu className="w-5 h-5 text-green-500" />
                        <p className="text-sm text-gray-500 uppercase font-semibold">CPU Usage</p>
                      </div>
                      <p className="text-xl text-white font-bold">{supernode.specs?.cpu || 0} cores</p>
                      <p className="text-sm text-gray-400">{Math.round(supernode.cpuUsage || 0)}% utilized</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <CircularProgress
                      percentage={supernode.ramUsage || 0}
                      color={supernode.ramUsage && supernode.ramUsage > 80 ? 'red' : supernode.ramUsage && supernode.ramUsage > 60 ? 'orange' : 'blue'}
                      size={120}
                    />
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Database className="w-5 h-5 text-blue-500" />
                        <p className="text-sm text-gray-500 uppercase font-semibold">RAM Usage</p>
                      </div>
                      <p className="text-xl text-white font-bold">{supernode.specs?.ram || 0}GB</p>
                      <p className="text-sm text-gray-400">{Math.round(supernode.ramUsage || 0)}% utilized</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <CircularProgress
                      percentage={supernode.diskUsage || 0}
                      color={supernode.diskUsage && supernode.diskUsage > 80 ? 'red' : supernode.diskUsage && supernode.diskUsage > 60 ? 'orange' : 'purple'}
                      size={120}
                    />
                    <div className="mt-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <HardDrive className="w-5 h-5 text-purple-500" />
                        <p className="text-sm text-gray-500 uppercase font-semibold">Disk Usage</p>
                      </div>
                      <p className="text-xl text-white font-bold">{supernode.specs?.disk || 0}TB</p>
                      <p className="text-sm text-gray-400">{Math.round(supernode.diskUsage || 0)}% utilized</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Technical Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Network Information */}
                  <div className="bg-[#111111] rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Server className="w-5 h-5 text-blue-500" />
                      Network Info
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">P2P Port</span>
                        <span className="text-white text-sm font-medium">{supernode.p2pPort || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Rank</span>
                        <span className="text-white text-sm font-medium">#{supernode.rank || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">P2P Records</span>
                        <span className="text-white text-sm font-medium">{supernode.p2pRecords?.toLocaleString() || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">P2P DB Size</span>
                        <span className="text-white text-sm font-medium">{supernode.p2pDbSizeMb ? `${Math.round(supernode.p2pDbSizeMb)}MB` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Version Information */}
                  <div className="bg-[#111111] rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-500" />
                      Version Info
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Protocol</span>
                        <span className="text-white text-sm font-medium">{supernode.protocolVersion || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Actual</span>
                        <span className="text-white text-sm font-medium">{supernode.actualVersion || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">API Status</span>
                        <span className={`text-sm font-medium ${supernode.isStatusApiAvailable ? 'text-green-400' : 'text-red-400'}`}>
                          {supernode.isStatusApiAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Failed Probes</span>
                        <span className="text-white text-sm font-medium">{supernode.failedProbeCounter || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Monitoring */}
                  <div className="bg-[#111111] rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      Monitoring
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Last Check</span>
                        <span className="text-white text-sm font-medium">
                          {supernode.lastStatusCheck ? new Date(supernode.lastStatusCheck).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Last Success</span>
                        <span className="text-white text-sm font-medium">
                          {supernode.lastSuccessfulProbe ? new Date(supernode.lastSuccessfulProbe).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Actions */}
              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800">
                  <h2 className="text-xl font-bold text-white">Recent Actions</h2>
                  <p className="text-gray-400 text-sm mt-1">Latest supernode activities</p>
                </div>

                {loadingActions ? (
                  <div className="p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500/20 border-t-blue-500 mb-4"></div>
                    <p className="text-gray-400">Loading actions...</p>
                  </div>
                ) : actions.length === 0 ? (
                  <div className="p-12 text-center">
                    <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No recent actions found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {actions.slice(0, 10).map((action, index) => (
                      <div key={action.id || index} className="p-4 hover:bg-[#111111] transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {action.state === 'ACTION_STATE_DONE' ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : action.state === 'ACTION_STATE_PENDING' ? (
                              <Clock className="w-5 h-5 text-orange-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                            <div>
                              <p className="text-white font-medium">
                                {action.type ? action.type.replace('ACTION_TYPE_', '') : 'Unknown Action'}
                              </p>
                              <p className="text-gray-500 text-sm">ID: {action.id || 'N/A'}</p>
                              <p className="text-gray-400 text-xs">Block: {action.block_height || 'N/A'}</p>
                              {action.decoded?.file_name && (
                                <p className="text-gray-400 text-xs">File: {action.decoded.file_name}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">
                              {action.register_tx_time ? new Date(action.register_tx_time).toLocaleString() :
                                action.finalize_tx_time ? new Date(action.finalize_tx_time).toLocaleString() : 'N/A'}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {action.register_tx_id && (
                                <a
                                  href={`/${params.chain}/transactions/${action.register_tx_id}`}
                                  className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Register TX <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {action.finalize_tx_id && (
                                <a
                                  href={`/${params.chain}/transactions/${action.finalize_tx_id}`}
                                  className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Finalize TX <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {action.transactions && action.transactions.length > 0 && (
                                <span className="text-purple-400 text-xs">
                                  {action.transactions.length} TX
                                </span>
                              )}
                            </div>
                            {action.price && (
                              <p className="text-gray-500 text-xs mt-1">
                                Price: {action.price.amount} {action.price.denom}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-12 text-center">
              <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Supernode Not Found</h2>
              <p className="text-gray-400">The requested supernode could not be found.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}