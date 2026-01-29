'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { executeIBCTransfer } from '@/lib/ibcTransfer';

interface BridgeDirection {
  from: {
    chain: string;
    chainId: string;
    denom: string;
    symbol: string;
    rpc: string;
    logo: string;
  };
  to: {
    chain: string;
    chainId: string;
    denom: string;
    symbol: string;
    rpc: string;
    logo: string;
  };
}

const BRIDGE_ROUTES: Record<string, BridgeDirection> = {
  'lume-to-osmo': {
    from: {
      chain: 'lumera-mainnet',
      chainId: 'lumera_1916-1',
      denom: 'ulume',
      symbol: 'LUME',
      rpc: 'https://rpc.lumera.zone',
      logo: '/logos/lume.png'
    },
    to: {
      chain: 'osmosis-mainnet',
      chainId: 'osmosis-1',
      denom: 'ibc/LUME_IBC_HASH', // This needs to be the actual IBC hash
      symbol: 'LUME',
      rpc: 'https://rpc.osmosis.zone',
      logo: '/logos/osmo.png'
    }
  },
  'osmo-to-lume': {
    from: {
      chain: 'osmosis-mainnet',
      chainId: 'osmosis-1',
      denom: 'uosmo',
      symbol: 'OSMO',
      rpc: 'https://rpc.osmosis.zone',
      logo: '/logos/osmo.png'
    },
    to: {
      chain: 'lumera-mainnet',
      chainId: 'lumera_1916-1',
      denom: 'ibc/OSMO_IBC_HASH', // This needs to be the actual IBC hash
      symbol: 'OSMO',
      rpc: 'https://rpc.lumera.zone',
      logo: '/logos/lume.png'
    }
  }
};

export default function LumeOsmoBridge() {
  const { account, isConnected } = useWallet();
  const [selectedRoute, setSelectedRoute] = useState<string>('lume-to-osmo');
  const [amount, setAmount] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  const currentRoute = BRIDGE_ROUTES[selectedRoute];

  // Auto-fill recipient address with connected wallet address
  useEffect(() => {
    if (account?.address && !recipientAddress) {
      setRecipientAddress(account.address);
    }
  }, [account?.address, recipientAddress]);

  // Fetch balance for source chain
  const fetchBalance = async () => {
    if (!account?.address || !isConnected) return;
    
    try {
      const response = await fetch(`/api/balance?chain=${currentRoute.from.chain}&address=${account.address}&denom=${currentRoute.from.denom}`);
      if (response.ok) {
        const data = await response.json();
        setBalance(data.balance || '0');
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [selectedRoute, account?.address, isConnected]);

  const connectWallet = () => {
    // Trigger the wallet connection modal
    window.dispatchEvent(new CustomEvent('trigger_keplr_connect'));
  };

  const handleTransfer = async () => {
    if (!isConnected) {
      connectWallet();
      return;
    }

    if (!amount || !recipientAddress) {
      setError('Please fill in all fields');
      return;
    }

    setIsTransferring(true);
    setError('');
    setTxHash('');

    try {
      const amountInMicroUnits = (parseFloat(amount) * 1_000_000).toString();
      
      // First, discover the IBC channel dynamically
      const channelResponse = await fetch(`/api/ibc/channels?sourceChain=${currentRoute.from.chain}&destChain=${currentRoute.to.chain}`);
      
      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        setError(errorData.error || 'Failed to discover IBC channel');
        return;
      }
      
      const channelData = await channelResponse.json();
      
      const result = await executeIBCTransfer({
        sourceChain: currentRoute.from.chainId,
        destChain: currentRoute.to.chainId,
        token: {
          denom: currentRoute.from.denom,
          amount: amountInMicroUnits,
        },
        recipientAddress,
        senderAddress: account!.address,
        memo: `Bridge ${currentRoute.from.symbol} to ${currentRoute.to.symbol} via WinScan`,
      }, currentRoute.from.rpc);

      if (result.success && result.txHash) {
        setTxHash(result.txHash);
        setAmount('');
        fetchBalance(); // Refresh balance
      } else {
        setError(result.error || 'Transfer failed');
      }
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setIsTransferring(false);
    }
  };

  const switchDirection = () => {
    const newRoute = selectedRoute === 'lume-to-osmo' ? 'osmo-to-lume' : 'lume-to-osmo';
    setSelectedRoute(newRoute);
    setAmount('');
    setError('');
    setTxHash('');
  };

  const formatBalance = (balance: string) => {
    const balanceNum = parseFloat(balance) / 1_000_000;
    return balanceNum.toLocaleString(undefined, { maximumFractionDigits: 6 });
  };

  return (
    <div className="max-w-md mx-auto bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          LUME ↔ OSMO Bridge
        </h2>
        <p className="text-gray-400">
          Bridge tokens between Lumera and Osmosis
        </p>
      </div>

      {/* Route Selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between bg-[#0f0f0f] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <img 
              src={currentRoute.from.logo} 
              alt={currentRoute.from.symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/logos/default.png';
              }}
            />
            <div>
              <div className="font-semibold text-white">
                {currentRoute.from.symbol}
              </div>
              <div className="text-sm text-gray-400">
                Balance: {formatBalance(balance)}
              </div>
            </div>
          </div>

          <button
            onClick={switchDirection}
            className="p-2 rounded-full bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
          >
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          <div className="flex items-center space-x-3">
            <img 
              src={currentRoute.to.logo} 
              alt={currentRoute.to.symbol}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.src = '/logos/default.png';
              }}
            />
            <div>
              <div className="font-semibold text-white">
                {currentRoute.to.symbol}
              </div>
              <div className="text-sm text-gray-400">
                {currentRoute.to.chain === 'osmosis-mainnet' ? 'Osmosis' : 'Lumera'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount ({currentRoute.from.symbol})
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000"
            className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
            step="0.000001"
            min="0"
          />
          <button
            onClick={() => {
              const maxAmount = (parseFloat(balance) / 1_000_000 * 0.99).toFixed(6); // Leave some for fees
              setAmount(maxAmount);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400 text-sm font-medium hover:underline"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Recipient Address
        </label>
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          placeholder={`${currentRoute.to.chain === 'osmosis-mainnet' ? 'osmo' : 'lume'}1...`}
          className="w-full px-4 py-3 bg-[#0f0f0f] border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
        />
      </div>

      {/* Transfer Info */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Transfer Time:</span>
          <span className="text-white">~3-5 minutes</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Network Fee:</span>
          <span className="text-white">~0.01 {currentRoute.from.symbol}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Route:</span>
          <span className="text-white">IBC Transfer</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {txHash && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm mb-2">
            Transfer initiated successfully!
          </p>
          <a
            href={`https://www.mintscan.io/cosmos/txs/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-sm hover:underline break-all"
          >
            View Transaction: {txHash}
          </a>
        </div>
      )}

      {/* Transfer Button */}
      <button
        onClick={isConnected ? handleTransfer : connectWallet}
        disabled={isTransferring || (!isConnected && !amount)}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
      >
        {isTransferring ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Transferring...</span>
          </div>
        ) : !isConnected ? (
          'Connect Wallet'
        ) : (
          `Bridge ${currentRoute.from.symbol} to ${currentRoute.to.symbol}`
        )}
      </button>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <p className="text-yellow-400 text-xs">
          ⚠️ Make sure the recipient address is correct. IBC transfers cannot be reversed.
          Always test with small amounts first.
        </p>
      </div>
    </div>
  );
}