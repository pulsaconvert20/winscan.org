'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { ChainData } from '@/types/chain';
import { ArrowLeft, Coins, ExternalLink, Copy, Check, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/lib/i18n';
import PRC20PriceChart from '@/components/PRC20PriceChart';

interface DenomUnit {
  denom: string;
  exponent: number;
  aliases: string[];
}

interface AssetDetail {
  denom: string;
  metadata: {
    description: string;
    denom_units: DenomUnit[];
    base: string;
    display: string;
    name: string;
    symbol: string;
    uri: string;
    uri_hash: string;
  } | null;
  supply: string | null;
  supply_formatted: string;
  holders: number | null;
  holders_type: string;
  price: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
  } | null;
  verified?: boolean;
  marketing?: {
    project?: string;
    description?: string;
    marketing?: string;
  };
  liquidity?: string | null;
  volume_7d_paxi?: number;
  volume_7d_usd?: number;
  volume_24h_paxi?: number;
  volume_24h_usd?: number;
  buys?: number;
  sells?: number;
  txs_count?: number;
}

export default function AssetDetailPage() {
  const params = useParams();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(language, key);
  const chainName = params.chain as string;
  const denom = decodeURIComponent(params.denom as string);
  
  const [chains, setChains] = useState<ChainData[]>([]);
  const [selectedChain, setSelectedChain] = useState<ChainData | null>(null);
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [tokenLogo, setTokenLogo] = useState<string>('');
  const [topHolders, setTopHolders] = useState<any[]>([]);
  const [loadingHolders, setLoadingHolders] = useState(false);

  useEffect(() => {
    async function loadChainData() {
      const response = await fetch('/chains.json');
      const data = await response.json();
      setChains(data);

      const chain = data.find((c: ChainData) => 
        c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainName.toLowerCase()
      ) || data[0];
      setSelectedChain(chain);
    }
    loadChainData();
  }, [chainName]);

  useEffect(() => {
    async function fetchAssetDetail() {
      if (!chainName || !denom) return;
      
      // Check cache first for faster loading (SKIP CACHE FOR PRC20 - always fetch fresh)
      const isPRC20 = denom.startsWith('paxi1') && denom.length > 40;
      if (isPRC20 && typeof window !== 'undefined') {
        // Clear old cache to force fresh data
        const cacheKey = `prc20_detail_${denom}`;
        sessionStorage.removeItem(cacheKey);
      }
      
      setLoading(true);
      try {
        if (isPRC20) {
          // 🚀 OPTIMIZED: Single bundled API call with all data including verified status
          const bundleRes = await fetch(`/api/prc20-detail-bundle?contract=${encodeURIComponent(denom)}`);
          
          if (!bundleRes.ok) {
            throw new Error('Failed to fetch PRC20 details');
          }
          
          const bundle = await bundleRes.json();
          
          console.log('🔍 Raw Bundle Response:', bundle);
          
          // Extract ALL data from bundle (backend SSL sudah lengkap!)
          const tokenInfo = bundle.token?.name ? bundle.token : bundle.token_info;
          const marketingInfo = bundle.token?.logo ? { 
            logo: { url: bundle.token.logo },
            description: bundle.token.description,
            project: bundle.token.project
          } : bundle.marketing_info;
          const numHolders = bundle.market?.num_holders || bundle.holders || 0;
          const liquidity = bundle.market?.reserve_paxi || bundle.liquidity || 0;
          const isVerified = bundle.token?.verified || bundle.verified || false;
          const priceChange24h = bundle.market?.price_change_24h || bundle.price_change_24h || 0;
          const reservePaxi = bundle.market?.reserve_paxi || bundle.reserve_paxi || 0;
          const reservePrc20 = bundle.market?.reserve_prc20 || bundle.reserve_prc20 || 0;
          const pricePaxi = bundle.market?.price_paxi || bundle.price_paxi || 0;
          const buys = bundle.buys || 0;
          const sells = bundle.sells || 0;
          const txsCount = bundle.txs_count || 0;
          
          console.log('🔍 Extracted Data:', { buys, sells, txsCount });
          
          // Volume data
          let volume_7d_paxi = 0;
          let volume_7d_usd = 0;
          let volume_24h_paxi = 0;
          let volume_24h_usd = 0;
          if (bundle.volume) {
            volume_7d_paxi = bundle.volume.volume_7d_paxi || 0;
            volume_7d_usd = bundle.volume.volume_7d_usd || 0;
            volume_24h_paxi = bundle.volume.volume_24h_paxi || 0;
            volume_24h_usd = bundle.volume.volume_24h_usd || 0;
          }
          
          console.log('📦 PRC20 Detail Bundle:', {
            symbol: tokenInfo?.symbol,
            holders: numHolders,
            volume_24h: volume_24h_paxi,
            volume_7d: volume_7d_paxi,
            price_change: priceChange24h,
            price_paxi: pricePaxi,
            verified: isVerified,
            buys,
            sells,
            txs_count: txsCount
          });
          
          // Set logo URL
          let logoUrl = '';
          if (marketingInfo?.logo?.url) {
            logoUrl = marketingInfo.logo.url.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${marketingInfo.logo.url.replace('ipfs://', '')}`
              : marketingInfo.logo.url;
            setTokenLogo(logoUrl);
          }
          
          if (tokenInfo) {
            // Transform PRC20 data to AssetDetail format
            setAsset({
              denom: denom,
              metadata: {
                description: marketingInfo?.description || 'PRC20 Token',
                denom_units: [
                  { denom: denom, exponent: 0, aliases: [] },
                  { denom: tokenInfo.symbol || 'TOKEN', exponent: tokenInfo.decimals || 6, aliases: [] }
                ],
                base: denom,
                display: tokenInfo.symbol || 'TOKEN',
                name: tokenInfo.name || marketingInfo?.project || 'Unknown',
                symbol: tokenInfo.symbol || 'TOKEN',
                uri: marketingInfo?.logo?.url || '',
                uri_hash: ''
              },
              supply: tokenInfo.total_supply || '0',
              supply_formatted: tokenInfo.total_supply 
                ? (Number(tokenInfo.total_supply) / Math.pow(10, tokenInfo.decimals || 6)).toLocaleString('en-US')
                : '0',
              holders: numHolders,
              holders_type: 'prc20',
              price: null,
              verified: isVerified,
              marketing: {
                project: marketingInfo?.project || '',
                description: marketingInfo?.description || '',
                marketing: marketingInfo?.marketing || ''
              },
              liquidity: liquidity,
              volume_7d_paxi,
              volume_7d_usd,
              volume_24h_paxi,
              volume_24h_usd,
              buys,
              sells,
              txs_count: txsCount
            });
            
            // Cache the result
            if (typeof window !== 'undefined') {
              const cacheKey = `prc20_detail_${denom}`;
              const cacheData = {
                timestamp: Date.now(),
                asset: {
                  denom,
                  metadata: {
                    description: marketingInfo?.description || 'PRC20 Token',
                    denom_units: [
                      { denom: denom, exponent: 0, aliases: [] },
                      { denom: tokenInfo.symbol || 'TOKEN', exponent: tokenInfo.decimals || 6, aliases: [] }
                    ],
                    base: denom,
                    display: tokenInfo.symbol || 'TOKEN',
                    name: tokenInfo.name || marketingInfo?.project || 'Unknown',
                    symbol: tokenInfo.symbol || 'TOKEN',
                    uri: marketingInfo?.logo?.url || '',
                    uri_hash: ''
                  },
                  supply: tokenInfo.total_supply || '0',
                  supply_formatted: tokenInfo.total_supply 
                    ? (Number(tokenInfo.total_supply) / Math.pow(10, tokenInfo.decimals || 6)).toLocaleString('en-US')
                    : '0',
                  holders: numHolders,
                  holders_type: 'prc20',
                  price: null,
                  verified: isVerified,
                  marketing: {
                    project: marketingInfo?.project || '',
                    description: marketingInfo?.description || '',
                    marketing: marketingInfo?.marketing || ''
                  },
                  liquidity,
                  volume_7d_paxi,
                  volume_7d_usd,
                  volume_24h_paxi,
                  volume_24h_usd,
                  buys,
                  sells,
                  txs_count: txsCount
                },
                logo: logoUrl
              };
              try {
                sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
              } catch (e) {
                console.warn('Failed to cache data:', e);
              }
            }
          }
        } else {
          // Regular asset (including native PAXI)
          const response = await fetch(`/api/asset-detail?chain=${chainName}&denom=${encodeURIComponent(denom)}`);
          const data: AssetDetail = await response.json();
          
          if (data) {
            // For native PAXI, fetch holders count from Paxi API (quick estimate)
            if (denom === 'upaxi') {
              try {
                // Quick estimate: fetch first 3 pages to check if there are more than 300 holders
                const page0 = await fetch(`https://mainnet-api.paxinet.io/account/holders?page=0`);
                if (page0.ok) {
                  const data0 = await page0.json();
                  const holders0 = data0.holders || [];
                  
                  if (holders0.length === 100) {
                    // There are more than 100 holders, estimate based on sampling
                    // Fetch a few more pages to get better estimate
                    const [page1Res, page2Res] = await Promise.all([
                      fetch(`https://mainnet-api.paxinet.io/account/holders?page=1`),
                      fetch(`https://mainnet-api.paxinet.io/account/holders?page=2`)
                    ]);
                    
                    let totalCount = holders0.length;
                    
                    if (page1Res.ok) {
                      const data1 = await page1Res.json();
                      totalCount += (data1.holders || []).length;
                    }
                    
                    if (page2Res.ok) {
                      const data2 = await page2Res.json();
                      totalCount += (data2.holders || []).length;
                    }
                    
                    // If all 3 pages have 100 holders, estimate there are many more
                    if (totalCount === 300) {
                      // Conservative estimate: at least 1000+ holders
                      data.holders = 1000;
                      data.holders_type = 'estimated';
                    } else {
                      data.holders = totalCount;
                      data.holders_type = 'partial';
                    }
                  } else {
                    // Less than 100 holders total
                    data.holders = holders0.length;
                    data.holders_type = 'exact';
                  }
                  
                  console.log(`📊 Native PAXI holders: ${data.holders} (${data.holders_type})`);
                }
              } catch (error) {
                console.warn('Failed to fetch native PAXI holders:', error);
                // Fallback: use a reasonable estimate
                data.holders = 1000;
                data.holders_type = 'estimated';
              }
            }
            
            setAsset(data);
            
            // Set logo for native PAXI
            if (denom === 'upaxi') {
              setTokenLogo('https://file.winsnip.xyz/file/uploads/paxi.jpg');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching asset detail:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAssetDetail();
  }, [chainName, denom]);

  // Fetch top 50 holders
  useEffect(() => {
    async function fetchTopHolders() {
      if (!asset || !chainName || !denom) return;
      
      setLoadingHolders(true);
      try {
        const isPRC20 = denom.startsWith('paxi1') && denom.length > 40;
        const isNativePaxi = denom === 'upaxi';
        
        if (isNativePaxi) {
          // Fetch from Paxi API for native PAXI token
          const response = await fetch(`https://mainnet-api.paxinet.io/account/holders?page=0`);
          if (response.ok) {
            const data = await response.json();
            const holders = data.holders || [];
            
            console.log('🔍 Native PAXI Top Holders - First 3:', holders.slice(0, 3).map((h: any) => ({ 
              address: h.address.slice(0, 12), 
              type: h.type 
            })));
            
            // Transform to match our format and take top 50
            const formattedHolders = holders.slice(0, 50).map((holder: any, index: number) => ({
              address: holder.address,
              balance: (holder.balance * 1e6).toString(), // Convert to base unit
              percentage: 0, // Will calculate below
              rank: index + 1,
              type: holder.type || 'user'
            }));
            
            // Calculate total supply for percentage
            const totalBalance = holders.reduce((sum: number, h: any) => sum + h.balance, 0);
            formattedHolders.forEach((holder: any) => {
              holder.percentage = (parseFloat(holder.balance) / (totalBalance * 1e6)) * 100;
            });
            
            console.log('✅ Formatted Top Holders - First 3:', formattedHolders.slice(0, 3).map((h: any) => ({ 
              address: h.address.slice(0, 12), 
              type: h.type 
            })));
            
            setTopHolders(formattedHolders);
          }
        } else if (isPRC20) {
          // Fetch from backend API for PRC20
          const response = await fetch(`https://ssl.winsnip.xyz/api/prc20-holders?contract=${encodeURIComponent(denom)}&limit=50`);
          if (response.ok) {
            const data = await response.json();
            setTopHolders(data.holders || []);
          }
        } else {
          // Fetch from holders API for regular assets
          const response = await fetch(`/api/holders?chain=${chainName}&denom=${encodeURIComponent(denom)}&limit=50`);
          if (response.ok) {
            const data = await response.json();
            setTopHolders(data.holders || []);
          }
        }
      } catch (error) {
        console.error('Error fetching top holders:', error);
      } finally {
        setLoadingHolders(false);
      }
    }

    fetchTopHolders();
  }, [asset, chainName, denom]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatSupply = (supply: string, exponent: number) => {
    if (!supply || supply === '0') return '0';
    
    try {
      const amount = BigInt(supply);
      const divisor = BigInt(10 ** exponent);

      const wholePart = amount / divisor;
      const remainder = amount % divisor;

      let displayAmount: string;
      
      if (exponent > 0) {
        const fractionalPart = remainder.toString().padStart(exponent, '0');
        const decimalValue = parseFloat(`${wholePart}.${fractionalPart}`);
        displayAmount = decimalValue.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        });
      } else {
        displayAmount = wholePart.toLocaleString('en-US');
      }
      
      return displayAmount;
    } catch (error) {
      return '-';
    }
  };

  const isNativeAsset = (base: string) => {
    return !base.startsWith('ibc/') && !base.startsWith('factory/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar selectedChain={selectedChain} />
        <div className="flex-1">
          <Header 
            chains={chains}
            selectedChain={selectedChain} 
            onSelectChain={setSelectedChain}
          />
          <main className="p-6 pt-20">
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="flex min-h-screen bg-[#0a0a0a]">
        <Sidebar selectedChain={selectedChain} />
        <div className="flex-1">
          <Header 
            chains={chains}
            selectedChain={selectedChain} 
            onSelectChain={setSelectedChain}
          />
          <main className="p-6 pt-20">
            <div className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">{t('assetDetail.notFound')}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const displayUnit = asset.metadata?.denom_units.find((u: DenomUnit) => u.denom === asset.metadata?.display);
  const exponent = displayUnit ? displayUnit.exponent : 6;
  const isNative = isNativeAsset(asset.denom);
  const isPRC20 = asset?.holders_type === 'prc20';

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar selectedChain={selectedChain} />
      
      <div className="flex-1">
        <Header 
          chains={chains}
          selectedChain={selectedChain} 
          onSelectChain={setSelectedChain}
        />
        
        <main className="p-4 md:p-6 pt-20 md:pt-20 lg:pt-24">{/* Adjusted padding-top for Header */}
          {/* Back Button */}
          <Link 
            href={`/${chainName}/assets`}
            className="inline-flex items-center space-x-2 text-sm md:text-base text-gray-400 hover:text-white transition-colors mb-4 md:mb-6"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span>{t('assetDetail.backToAssets')}</span>
          </Link>

          {/* Premium Asset Header Banner - Similar to Overview Page */}
          <div className="mb-6">
            <div className="relative overflow-hidden bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg">
              <div className="relative p-6">
                {/* Top Section: Logo, Name & Badges - Centered */}
                <div className="flex flex-col items-center gap-4 mb-4">
                  {/* Logo and Name - Centered */}
                  <div className="flex flex-col items-center text-center gap-3">
                    {tokenLogo ? (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                        <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-800 shadow-lg overflow-hidden bg-[#0f0f0f]">
                          <Image
                            src={tokenLogo}
                            alt={asset.metadata?.symbol || 'token'}
                            width={112}
                            height={112}
                            className="object-cover w-full h-full"
                            unoptimized={tokenLogo.includes('ipfs') || tokenLogo.includes('pinata')}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-500"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>';
                              }
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border-2 border-orange-500/30 flex items-center justify-center">
                        <Coins className="w-12 h-12 md:w-14 md:h-14 text-orange-500" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                        {asset.metadata?.name || asset.metadata?.symbol || t('assetDetail.title')}
                      </h1>
                      <p className="text-gray-400 text-sm">{asset.metadata?.symbol || 'Token'}</p>
                    </div>
                  </div>
                  
                  {/* Badges - Centered */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                        isPRC20
                          ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-400 border border-orange-500/20'
                          : isNative
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                          : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}
                    >
                      {isPRC20 ? 'PRC20' : isNative ? t('assetDetail.native') : t('assetDetail.token')}
                    </span>
                    {asset.verified && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold">Verified</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Description - Centered */}
                {asset.metadata?.description && (
                  <div className="p-3 bg-[#0f0f0f] rounded-lg border border-gray-800 text-center">
                    <p className="text-gray-300 text-sm leading-relaxed">{asset.metadata.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Price Card (if available) */}
          {asset.price && asset.price.usd > 0 && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg md:rounded-xl p-4 md:p-6 mb-4 md:mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs md:text-sm text-gray-400 mb-1 md:mb-2">{t('assetDetail.currentPrice')}</div>
                  <div className="text-2xl md:text-4xl font-bold text-white mb-1 md:mb-2">
                    ${asset.price.usd < 0.01 
                      ? asset.price.usd.toFixed(8) 
                      : asset.price.usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
                    }
                  </div>
                  {asset.price.usd_24h_change !== 0 && (
                    <div className={`flex items-center gap-1 md:gap-2 text-sm md:text-lg font-bold ${
                      asset.price.usd_24h_change > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {asset.price.usd_24h_change > 0 ? '↑' : '↓'}
                      {Math.abs(asset.price.usd_24h_change).toFixed(2)}% (24h)
                    </div>
                  )}
                </div>
                {asset.price.usd_market_cap > 0 && (
                  <div className="text-left md:text-right">
                    <div className="text-xs md:text-sm text-gray-400 mb-1 md:mb-2">{t('assetDetail.marketCap')}</div>
                    <div className="text-xl md:text-2xl font-bold text-white">
                      ${asset.price.usd_market_cap.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions for PRC20 */}
          {isPRC20 && (
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 md:p-6 mb-4 md:mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-3">
                <Link
                  href={`/${chainName}/prc20/swap?from=${denom}&tab=transfer`}
                  className="group relative overflow-hidden bg-[#222] hover:bg-[#2a2a2a] border border-gray-700 hover:border-green-500/50 text-white px-4 py-4 rounded-lg transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Transfer</span>
                </Link>
                <Link
                  href={`/${chainName}/prc20/swap?from=${denom}`}
                  className="group relative overflow-hidden bg-[#222] hover:bg-[#2a2a2a] border border-gray-700 hover:border-blue-500/50 text-white px-4 py-4 rounded-lg transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Swap</span>
                </Link>
                <Link
                  href={`/${chainName}/prc20/swap?from=${denom}&tab=burn`}
                  className="group relative overflow-hidden bg-[#222] hover:bg-[#2a2a2a] border border-gray-700 hover:border-red-500/50 text-white px-4 py-4 rounded-lg transition-all duration-200 flex flex-col items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 flex items-center justify-center transition-colors">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Burn</span>
                </Link>
              </div>
            </div>
          )}

          {/* Trading Statistics (PRC20 only) */}
          {isPRC20 && (asset.volume_24h_paxi || asset.volume_7d_paxi || asset.buys || asset.sells) && (
            <div className="bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-purple-950/20 border border-gray-800 rounded-xl p-5 md:p-6 mb-4 md:mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Trading Statistics</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Volume 24H */}
                <div className="bg-[#0f0f0f]/50 border border-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Volume 24H</span>
                    <div className="flex items-center gap-1 text-blue-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {asset.volume_24h_paxi && asset.volume_24h_paxi > 0
                      ? `${asset.volume_24h_paxi.toLocaleString('en-US', { maximumFractionDigits: 2 })} PAXI`
                      : '-'
                    }
                  </div>
                  {asset.volume_24h_usd && asset.volume_24h_usd > 0 && (
                    <div className="text-sm text-gray-500">
                      ≈ ${asset.volume_24h_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* Volume 7D */}
                <div className="bg-[#0f0f0f]/50 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Volume 7D</span>
                    <div className="flex items-center gap-1 text-purple-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-1">
                    {asset.volume_7d_paxi && asset.volume_7d_paxi > 0
                      ? `${asset.volume_7d_paxi.toLocaleString('en-US', { maximumFractionDigits: 2 })} PAXI`
                      : '-'
                    }
                  </div>
                  {asset.volume_7d_usd && asset.volume_7d_usd > 0 && (
                    <div className="text-sm text-gray-500">
                      ≈ ${asset.volume_7d_usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </div>
                  )}
                </div>

                {/* Buys */}
                <div className="bg-[#0f0f0f]/50 border border-green-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Total Buys</span>
                    <div className="flex items-center gap-1 text-green-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {asset.buys && asset.buys > 0
                      ? asset.buys.toLocaleString('en-US')
                      : '0'
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    Buy Transactions
                  </div>
                </div>

                {/* Sells */}
                <div className="bg-[#0f0f0f]/50 border border-red-500/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Total Sells</span>
                    <div className="flex items-center gap-1 text-red-400">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-400 mb-1">
                    {asset.sells && asset.sells > 0
                      ? asset.sells.toLocaleString('en-US')
                      : '0'
                    }
                  </div>
                  <div className="text-sm text-gray-500">
                    Sell Transactions
                  </div>
                </div>
              </div>

              {/* Total Transactions */}
              {asset.txs_count && asset.txs_count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Transactions</span>
                    <span className="text-lg font-bold text-white">
                      {asset.txs_count.toLocaleString('en-US')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Price Chart for PRC20 */}
          {asset && asset.holders_type === 'prc20' && (
            <div className="mb-4 md:mb-6">
              <PRC20PriceChart
                contractAddress={asset.denom}
                symbol={asset.metadata?.symbol || 'Token'}
              />
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
            {/* Total Supply */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 md:p-6">
              <div className="text-xs md:text-sm text-gray-400 mb-2">{t('assetDetail.totalSupply')}</div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {asset.supply_formatted || formatSupply(asset.supply || '0', exponent)}
              </div>
              {asset.metadata?.symbol && (
                <div className="text-sm text-gray-500 mt-1">{asset.metadata.symbol}</div>
              )}
            </div>

            {/* Symbol */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 md:p-6">
              <div className="text-xs md:text-sm text-gray-400 mb-2">{t('assetDetail.symbol')}</div>
              <div className="text-xl md:text-2xl font-bold text-white truncate">
                {asset.metadata?.symbol || '-'}
              </div>
            </div>

            {/* Decimals */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 md:p-6">
              <div className="text-xs md:text-sm text-gray-400 mb-2">
                {t('assetDetail.decimals')}
              </div>
              <div className="text-xl md:text-2xl font-bold text-white">
                {exponent}
              </div>
            </div>
          </div>

          {/* Asset Information */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden mb-4 md:mb-6">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-800">
              <h2 className="text-lg md:text-xl font-bold text-white">{t('assetDetail.assetInfo')}</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {/* Base Denom */}
              <div className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs md:text-sm text-gray-400 mb-1">
                      {isPRC20 ? 'Contract Address' : t('assetDetail.baseDenom')}
                    </div>
                    <div className="text-xs md:text-sm text-white font-mono break-all overflow-hidden">
                      {asset.denom}
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(asset.denom)}
                    className="p-1.5 md:p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0 self-start"
                    title={t('assetDetail.copyToClipboard')}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 md:w-5 md:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Name */}
              <div className="px-4 md:px-6 py-3 md:py-4">
                <div className="text-xs md:text-sm text-gray-400 mb-1">{t('assetDetail.name')}</div>
                <div className="text-xs md:text-sm text-white">
                  {asset.metadata?.name || '-'}
                </div>
              </div>

              {/* Description */}
              {asset.metadata?.description && (
                <div className="px-4 md:px-6 py-3 md:py-4">
                  <div className="text-xs md:text-sm text-gray-400 mb-1">Description</div>
                  <div className="text-xs md:text-sm text-white">
                    {asset.metadata.description}
                  </div>
                </div>
              )}
              
              {/* Marketing Info for PRC20 */}
              {isPRC20 && asset.marketing && (
                <>
                  {asset.marketing.project && (
                    <div className="px-4 md:px-6 py-3 md:py-4">
                      <div className="text-xs md:text-sm text-gray-400 mb-1">Project</div>
                      <div className="text-xs md:text-sm text-white break-all">
                        {asset.marketing.project}
                      </div>
                    </div>
                  )}
                  {asset.marketing.marketing && (
                    <div className="px-4 md:px-6 py-3 md:py-4">
                      <div className="text-xs md:text-sm text-gray-400 mb-1">Marketing Contact</div>
                      <div className="text-xs md:text-sm text-white break-all">
                        {asset.marketing.marketing}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>



          {/* Top Holders Section */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden mt-4 md:mt-6">
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Token Logo */}
                {(tokenLogo || denom === 'upaxi') && (
                  <div className="relative w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {tokenLogo ? (
                      <Image
                        src={tokenLogo}
                        alt={asset.metadata?.symbol || 'token'}
                        width={40}
                        height={40}
                        className="object-cover"
                        unoptimized={tokenLogo.includes('ipfs') || tokenLogo.includes('pinata')}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : denom === 'upaxi' ? (
                      <Coins className="w-5 h-5 text-orange-500" />
                    ) : null}
                  </div>
                )}
                <h2 className="text-lg md:text-xl font-bold text-white">Top 50 Holders</h2>
              </div>
              <Link
                href={`/${chainName}/assets/${encodeURIComponent(denom)}/holders`}
                className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs md:text-sm"
              >
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                <span>View All Holders</span>
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loadingHolders ? (
                <div className="p-6 md:p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-3 text-sm">Loading holders...</p>
                </div>
              ) : topHolders.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-[#0f0f0f] border-b border-gray-800">
                    <tr>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Balance
                      </th>
                      <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {topHolders.map((holder, index) => (
                      <tr key={holder.address} className="hover:bg-[#0f0f0f] transition-colors">
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap text-sm text-gray-400">
                          #{index + 1}
                        </td>
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/${chainName}/accounts/${holder.address}`}
                              className="text-sm text-blue-400 hover:text-blue-300 font-mono"
                            >
                              {holder.address.substring(0, 12)}...{holder.address.substring(holder.address.length - 8)}
                            </Link>
                            <button
                              onClick={() => copyToClipboard(holder.address)}
                              className="p-1 text-gray-400 hover:text-white transition-colors"
                              title="Copy address"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            holder.type === 'staking pool' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            holder.type === 'DAO' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            holder.type === 'mexc' || holder.type === 'bitmart' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            holder.type === 'prc20 pool' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            holder.type === 'developer' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                          }`}>
                            {holder.type || 'user'}
                          </span>
                        </td>
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap text-right text-sm text-white font-medium">
                          {holder.balance 
                            ? (Number(holder.balance) / Math.pow(10, exponent)).toLocaleString('en-US', { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 6 
                              })
                            : '0'
                          }
                        </td>
                        <td className="px-4 md:px-6 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 md:w-24 bg-gray-800 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                                style={{ width: `${Math.min(holder.percentage || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-400 w-12 text-right">
                              {holder.percentage ? holder.percentage.toFixed(2) : '0.00'}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 md:p-8 text-center text-gray-400">
                  <p className="mb-3 md:mb-4 text-sm md:text-base">No holder data available</p>
                  <Link
                    href={`/${chainName}/assets/${encodeURIComponent(denom)}/holders`}
                    className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm md:text-base"
                  >
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
                    <span>View Holders Page</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

