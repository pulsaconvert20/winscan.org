// PaxiHub wallet integration for mobile
import { ChainData } from '@/types/chain';

declare global {
  interface Window {
    paxihub?: any;
  }
}

export const isPaxiHubInstalled = (): boolean => {
  return typeof window !== 'undefined' && typeof window.paxihub !== 'undefined';
};

export const isMobileDevice = (): boolean => {
  return typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
};

export const openPaxiHubDeepLink = (currentUrl?: string) => {
  const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const deepLink = `paxi://hub/explorer?url=${encodeURIComponent(url)}`;
  
  // Try to open deep link
  window.location.href = deepLink;
  
  // If PaxiHub is not installed, redirect to download page after 1 second
  setTimeout(() => {
    window.location.href = 'https://paxinet.io/paxi_docs/paxihub#paxihub-application';
  }, 1000);
};

// Check and handle PaxiHub availability (official pattern from docs)
export const checkAndHandlePaxiHub = () => {
  if (typeof window === 'undefined') return;
  
  // Check if PaxiHub is injected
  if (typeof window.paxihub !== 'undefined') {
    console.log('✅ PaxiHub is available');
    const hub = window.paxihub;
    // Initialize your dApp connection...
    return true;
  } else if (/Mobi/.test(navigator.userAgent)) {
    // Mobile device without PaxiHub - deep link into PaxiHub Explorer
    console.log('📱 Mobile device detected, opening PaxiHub...');
    window.location.href = `paxi://hub/explorer?url=${encodeURIComponent(window.location.href)}`;
    
    // If not installed, go to store after 1s
    setTimeout(() => {
      window.location.href = 'https://paxinet.io/paxi_docs/paxihub#paxihub-application';
    }, 1000);
    
    return false;
  }
  
  return false;
};

// Check if current chain is Paxi chain
export const isPaxiChain = (chainId: string): boolean => {
  const paxiChainIds = [
    'paxi-mainnet',
    'paxi-testnet',
    'paxi',
    'paxinet',
  ];
  
  return paxiChainIds.some(id => chainId.toLowerCase().includes(id));
};

// For Paxi chain: On mobile with PaxiHub, use PaxiHub. Otherwise allow Keplr.
export const ensurePaxiHubForPaxiChain = (chainId: string): boolean => {
  if (!isPaxiChain(chainId)) {
    return false; // Not a Paxi chain, allow Keplr
  }
  
  console.log('🔍 [Paxi Chain] Detected Paxi chain:', chainId);
  
  // Check if PaxiHub is injected (mobile app)
  if (typeof window !== 'undefined' && typeof window.paxihub !== 'undefined') {
    console.log('✅ [Paxi Chain] PaxiHub is available (mobile app)');
    return true;
  }
  
  // PaxiHub not available - this is normal for desktop/browser
  // Allow Keplr for Paxi chain on desktop
  console.log('� [Paxi Chain] PaxiHub not available, will use Keplr (desktop/browser)');
  return false;
};

export const connectPaxiHub = async (chain: ChainData): Promise<{ address: string; algo: string; pubKey: Uint8Array; isNanoLedger: boolean }> => {
  if (!isPaxiHubInstalled()) {
    // If on mobile and PaxiHub not injected, try deep link
    if (isMobileDevice()) {
      openPaxiHubDeepLink();
      throw new Error('Opening PaxiHub app...');
    }
    throw new Error('PaxiHub is not installed');
  }

  try {
    const hub = window.paxihub;
    const chainId = chain.chain_id || chain.chain_name;
    
    // PaxiHub structure: window.paxihub.paxi
    const paxi = hub.paxi || hub;
    
    console.log('Paxi object:', paxi);
    console.log('Paxi methods:', Object.keys(paxi));
    
    // PaxiHub API: getAddress, signAndSendTransaction, signMessage, on, trigger
    let address: string;
    
    if (typeof paxi.getAddress === 'function') {
      console.log('Using paxi.getAddress()');
      // getAddress might return string directly or object with address
      const result = await paxi.getAddress(chainId);
      address = typeof result === 'string' ? result : result.address || result.bech32Address;
    } else {
      throw new Error('PaxiHub getAddress method not found. Available methods: ' + Object.keys(paxi).join(', '));
    }
    
    console.log('Connected address:', address);
    
    // PaxiHub doesn't provide pubKey directly, create a placeholder
    const pubKey = new Uint8Array(33);
    
    return {
      address: address,
      algo: 'secp256k1',
      pubKey: pubKey,
      isNanoLedger: false,
    };
  } catch (error: any) {
    console.error('PaxiHub connection error:', error);
    throw new Error(error.message || 'Failed to connect to PaxiHub');
  }
};

export const disconnectPaxiHub = () => {
  // PaxiHub doesn't require explicit disconnect
  // Just clear local state
  if (typeof window !== 'undefined') {
    localStorage.removeItem('paxihub_account');
    localStorage.removeItem('active_wallet');
  }
};

export const savePaxiHubAccount = (account: { address: string; algo: string; pubKey: Uint8Array; isNanoLedger: boolean }, chainId: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('paxihub_account', JSON.stringify({
      address: account.address,
      chainId,
      timestamp: Date.now(),
      walletType: 'paxihub', // Add wallet type
    }));
    
    // Also set a flag to indicate PaxiHub is active
    localStorage.setItem('active_wallet', 'paxihub');
  }
};

export const loadPaxiHubAccount = (chainId: string): { address: string } | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('paxihub_account');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    if (data.chainId === chainId) {
      return { address: data.address };
    }
  } catch (error) {
    console.error('Error loading PaxiHub account:', error);
  }
  
  return null;
};

// Sign and broadcast transaction using PaxiHub
export const signAndBroadcastPaxiHub = async (
  chain: ChainData,
  messages: any[],
  fee: any,
  memo: string = ''
): Promise<{ code: number; transactionHash: string; rawLog?: string }> => {
  if (!isPaxiHubInstalled()) {
    throw new Error('PaxiHub is not installed');
  }

  try {
    const hub = window.paxihub;
    const paxi = hub.paxi || hub;
    const chainId = chain.chain_id || chain.chain_name;

    console.log('PaxiHub signing transaction:', { messages, fee, memo });

    // PaxiHub API: signAndSendTransaction
    if (typeof paxi.signAndSendTransaction === 'function') {
      const result = await paxi.signAndSendTransaction(chainId, {
        messages,
        fee,
        memo,
      });

      console.log('PaxiHub transaction result:', result);

      return {
        code: result.code || 0,
        transactionHash: result.transactionHash || result.txHash || result.hash,
        rawLog: result.rawLog || result.log,
      };
    } else {
      throw new Error('PaxiHub signAndSendTransaction method not available');
    }
  } catch (error: any) {
    console.error('PaxiHub transaction error:', error);
    throw error;
  }
};

// Get current wallet type from localStorage
export const getCurrentWalletType = (): 'keplr' | 'paxihub' | null => {
  if (typeof window === 'undefined') return null;
  
  // Check active_wallet flag first (most reliable)
  const activeWallet = localStorage.getItem('active_wallet');
  if (activeWallet === 'paxihub') return 'paxihub';
  
  // Check PaxiHub account
  const paxiAccount = localStorage.getItem('paxihub_account');
  if (paxiAccount) {
    try {
      const data = JSON.parse(paxiAccount);
      if (data.walletType === 'paxihub') return 'paxihub';
    } catch (e) {
      // If parse fails, still return paxihub if the key exists
      return 'paxihub';
    }
  }
  
  // Check if PaxiHub is currently injected (user is in PaxiHub app)
  if (isPaxiHubInstalled()) return 'paxihub';
  
  // Check Keplr
  const keplrAccount = localStorage.getItem('keplr_account');
  if (keplrAccount) {
    try {
      const data = JSON.parse(keplrAccount);
      return data.walletType || 'keplr';
    } catch (e) {
      return 'keplr';
    }
  }
  
  return null;
};
