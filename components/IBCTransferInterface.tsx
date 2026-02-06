'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, ArrowDown, Wallet, AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { ChainData } from '@/types/chain';
import { executeReverseTransferWithPreSwap } from '@/lib/ibcPreSwap';

interface IBCTransferInterfaceProps {
  sourceChain: ChainData;
}

export default function IBCTransferInterface({ 
  sourceChain
}: IBCTransferInterfaceProps) {
  const [selectedDestChain, setSelectedDestChain] = useState<string>('');
  const [connectedChains, setConnectedChains] = useState<Array<{
    chainId: string;
    chainName: string;
    logo: string | null;
  }>>([]);
  const [loadingChains, setLoadingChains] = useState(true);
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState(0);
  const [receiverAddress, setReceiverAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [isProcessing, setIsProcessing] = useState(false);
  const [txStatus, setTxStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [txMessage, setTxMessage] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  const [enableAutoSwap, setEnableAutoSwap] = useState(false);
  const [swapToToken, setSwapToToken] = useState('OSMO');
  const [swapRoute, setSwapRoute] = useState<any>(null);
  
  // Transaction result for popup modal
  const [txResult, setTxResult] = useState<{
    success: boolean;
    transferTxHash: string;
    swapTxHash?: string;
    message: string;
  } | null>(null);
  
  // Progress tracking for auto-swap
  const [swapProgress, setSwapProgress] = useState<{
    step: 'idle' | 'transferring' | 'waiting' | 'swapping' | 'complete';
    message: string;
  }>({ step: 'idle', message: '' });
  
  // Pre-swap state (for reverse mode)
  const [enablePreSwap, setEnablePreSwap] = useState(false);
  const [preSwapToToken, setPreSwapToToken] = useState('LUME');
  const [preSwapRoute, setPreSwapRoute] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSourceToken, setSelectedSourceToken] = useState('OSMO');
  const [preSwapSlippage, setPreSwapSlippage] = useState(3); // Default 3%
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);
  
  // Source token selection (for normal mode - transfer IBC tokens back)
  const [selectedSourceDenom, setSelectedSourceDenom] = useState<string>('native');
  const [availableSourceTokens, setAvailableSourceTokens] = useState<Array<{
    denom: string;
    symbol: string;
    balance: string;
    isNative: boolean;
    originChain?: string;
  }>>([]);

  // Load connected chains from relayers API
  useEffect(() => {
    const loadConnectedChains = async () => {
      setLoadingChains(true);
      try {
        const response = await fetch(`/api/relayers?chain=${sourceChain.chain_name}`);
        if (response.ok) {
          const data = await response.json();
          const chains = (data.relayers || []).map((r: any) => ({
            chainId: r.chainId,
            chainName: r.chainName || r.chainId,
            logo: r.logo
          }));
          setConnectedChains(chains);
          } else {
          console.error('[IBCTransfer] Failed to load relayers');
          setConnectedChains([]);
        }
      } catch (error) {
        console.error('[IBCTransfer] Error loading relayers:', error);
        setConnectedChains([]);
      } finally {
        setLoadingChains(false);
      }
    };

    loadConnectedChains();
  }, [sourceChain.chain_name]);

  // Check if destination is Osmosis to show auto-swap option
  const isDestinationOsmosis = selectedDestChain && 
    (selectedDestChain.toLowerCase().includes('osmosis') || 
     connectedChains.find(c => c.chainId === selectedDestChain)?.chainName.toLowerCase().includes('osmosis'));
  
  // Check if source is Osmosis (for reverse mode)
  const isSourceOsmosis = isReversed && selectedDestChain &&
    (selectedDestChain.toLowerCase().includes('osmosis') ||
     connectedChains.find(c => c.chainId === selectedDestChain)?.chainName.toLowerCase().includes('osmosis'));
  
  // Smart check: Does destination chain support DEX/pools for auto-swap?
  // Currently only Osmosis has full DEX support with SQS router
  const destinationSupportsDex = isDestinationOsmosis;
  const sourceSupportsDex = isSourceOsmosis;

  // For auto-swap: Support OSMO, ATOM, USDC
  const availableSwapTokens = [
    { denom: 'uosmo', symbol: 'OSMO' },
    { denom: 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2', symbol: 'ATOM' },
    { denom: 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858', symbol: 'USDC' },
  ];

  // Load pre-swap route when user enables pre-swap in reverse mode
  useEffect(() => {
    const loadPreSwapRoute = async () => {
      if (!enablePreSwap || !isReversed || !isSourceOsmosis) {
        setPreSwapRoute(null);
        return;
      }

      try {
        // Determine source token denom on Osmosis
        let sourceTokenDenom: string;
        if (selectedSourceToken === 'OSMO') {
          sourceTokenDenom = 'uosmo';
        } else if (selectedSourceToken === 'ATOM') {
          sourceTokenDenom = 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';
        } else if (selectedSourceToken === 'USDC') {
          sourceTokenDenom = 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858';
        } else {
          sourceTokenDenom = 'uosmo'; // Default
        }
        
        // Get LUME IBC denom on Osmosis
        const ibcDenomResponse = await fetch(
          `/api/osmosis/ibc-denom?sourceChain=lumera-mainnet&baseDenom=ulume`
        );
        
        if (!ibcDenomResponse.ok) {
          setPreSwapRoute(null);
          return;
        }
        
        const ibcDenomData = await ibcDenomResponse.json();
        const lumeIbcDenom = ibcDenomData.ibcDenom;
        
        // Get swap route
        const routeResponse = await fetch(
          `/api/osmosis/pools?action=route&tokenIn=${encodeURIComponent(sourceTokenDenom)}&tokenOut=${encodeURIComponent(lumeIbcDenom)}`
        );
        
        if (routeResponse.ok) {
          const routeData = await routeResponse.json();
          setPreSwapRoute(routeData.route);
        } else {
          const errorData = await routeResponse.json();
          setPreSwapRoute(null);
        }
      } catch (error) {
        console.error('[Pre-Swap] Failed to load route:', error);
        setPreSwapRoute(null);
      }
    };
    
    loadPreSwapRoute();
  }, [enablePreSwap, isReversed, isSourceOsmosis, selectedSourceToken, preSwapToToken]);

  // Check wallet connection and fetch balance
  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && (window as any).keplr) {
        try {
          // Determine which chain to fetch balance from based on mode
          let chainId: string;
          let denom: string;
          let rpc: string;
          
          if (isReversed && selectedDestChain) {
            // REVERSE MODE: Fetch balance from destination chain (which becomes the source)
            const destChain = connectedChains.find(c => c.chainId === selectedDestChain);
            if (!destChain) return;
            
            // Map common chain names to chain IDs
            const chainIdMap: Record<string, string> = {
              'osmosis': 'osmosis-1',
              'osmosis-mainnet': 'osmosis-1',
              'cosmoshub': 'cosmoshub-4',
              'cosmoshub-mainnet': 'cosmoshub-4',
              'noble': 'noble-1',
              'noble-mainnet': 'noble-1',
            };
            
            const normalizedName = destChain.chainName.toLowerCase().replace(/\s+/g, '-');
            chainId = chainIdMap[normalizedName] || destChain.chainId;
            
            // Map common RPCs
            const commonRpcs: Record<string, string> = {
              'osmosis-1': 'https://rpc.osmosis.zone',
              'cosmoshub-4': 'https://rpc.cosmos.network',
              'noble-1': 'https://rpc.noble.strange.love',
            };
            
            rpc = commonRpcs[chainId] || '';
            if (!rpc) {
              return;
            }
            
            // Determine denom based on selected source token
            if (selectedSourceToken === 'OSMO') {
              denom = 'uosmo';
            } else if (selectedSourceToken === 'ATOM') {
              denom = 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';
            } else if (selectedSourceToken === 'USDC') {
              denom = 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858';
            } else {
              denom = 'uosmo'; // Default
            }
          } else {
            // NORMAL MODE: Fetch from source chain (Lumera)
            chainId = sourceChain.chain_id || sourceChain.chain_name;
            denom = sourceChain.assets[0].base;
            const rpcEndpoint = sourceChain.rpc[0]?.address || sourceChain.rpc[0];
            rpc = typeof rpcEndpoint === 'string' ? rpcEndpoint : rpcEndpoint.address;
          }

          await (window as any).keplr.enable(chainId);
          const offlineSigner = await (window as any).keplr.getOfflineSigner(chainId);
          const accounts = await offlineSigner.getAccounts();
          
          if (accounts.length > 0) {
            setWalletConnected(true);
            setWalletAddress(accounts[0].address);
            
            // Fetch balance
            try {
              const { SigningStargateClient } = await import('@cosmjs/stargate');
              
              const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);
              const bal = await client.getBalance(accounts[0].address, denom);
              
              // Use 6 decimals for all Cosmos tokens (standard)
              const exponent = 6;
              const formatted = (parseInt(bal.amount) / Math.pow(10, exponent)).toFixed(6);
              
              setBalance(formatted);
            } catch (error) {
              console.error('[Balance] Fetch error:', error);
              setBalance('0');
            }
          }
        } catch (error) {
          console.error('Wallet check error:', error);
        }
      }
    };
    
    checkWallet();
  }, [sourceChain, isReversed, selectedDestChain, connectedChains, selectedSourceToken]); // Re-fetch when mode or token changes

  // Auto-fill destination address
  useEffect(() => {
    const fetchDestinationAddress = async () => {
      if (!selectedDestChain || !walletConnected) return;

      try {
        const chainIdMap: Record<string, string> = {
          'osmosis': 'osmosis-1',
          'osmosis-mainnet': 'osmosis-1',
          'cosmoshub': 'cosmoshub-4',
          'cosmoshub-mainnet': 'cosmoshub-4',
          'noble': 'noble-1',
          'noble-mainnet': 'noble-1',
        };

        let targetChainId: string;
        
        if (isReversed) {
          targetChainId = sourceChain.chain_id || sourceChain.chain_name;
        } else {
          const destChain = connectedChains.find(c => c.chainId === selectedDestChain);
          if (!destChain) return;
          const normalizedName = destChain.chainName.toLowerCase().replace(/\s+/g, '-');
          targetChainId = chainIdMap[normalizedName] || destChain.chainId;
        }

        if (typeof window !== 'undefined' && (window as any).keplr) {
          try {
            await (window as any).keplr.enable(targetChainId);
            const offlineSigner = await (window as any).keplr.getOfflineSigner(targetChainId);
            const accounts = await offlineSigner.getAccounts();
            if (accounts.length > 0) {
              setReceiverAddress(accounts[0].address);
            }
          } catch (error) {
            setReceiverAddress(walletAddress);
          }
        }
      } catch (error) {
        console.error('Error fetching destination address:', error);
      }
    };

    fetchDestinationAddress();
  }, [selectedDestChain, walletConnected, connectedChains, walletAddress, isReversed, sourceChain]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).keplr) {
      try {
        const chainId = sourceChain.chain_id || sourceChain.chain_name;
        await (window as any).keplr.enable(chainId);
        window.location.reload();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      alert('Please install Keplr wallet extension');
    }
  };

  const handleTransfer = async () => {
    if (!walletConnected || !selectedDestChain || !amount || !receiverAddress) {
      alert('Please fill all fields');
      return;
    }

    setIsProcessing(true);
    setTxStatus('idle');
    setTxMessage('');
    setTxResult(null);
    setSwapProgress({ step: 'idle', message: '' });
    setCurrentStep(0);

    try {
      // Check if this is a reverse transfer with pre-swap
      if (isReversed && enablePreSwap && isSourceOsmosis) {
        // Determine source token denom
        let sourceTokenDenom: string;
        if (selectedSourceToken === 'OSMO') {
          sourceTokenDenom = 'uosmo';
        } else if (selectedSourceToken === 'ATOM') {
          sourceTokenDenom = 'ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2';
        } else if (selectedSourceToken === 'USDC') {
          sourceTokenDenom = 'ibc/D189335C6E4A68B513C10AB227BF1C1D38C746766278BA3EEB4FB14124F1D858';
        } else {
          sourceTokenDenom = 'uosmo';
        }
        
        // Get LUME IBC denom on Osmosis
        const ibcDenomResponse = await fetch(
          `/api/osmosis/ibc-denom?sourceChain=lumera-mainnet&baseDenom=ulume`
        );
        
        if (!ibcDenomResponse.ok) {
          throw new Error('Could not determine LUME IBC denom on Osmosis');
        }
        
        const ibcDenomData = await ibcDenomResponse.json();
        const lumeIbcDenom = ibcDenomData.ibcDenom;
        
        // Calculate amount in micro units
        const tokenExponent = 6; // Assuming 6 decimals for most tokens
        const amountInMicro = Math.floor(parseFloat(amount) * Math.pow(10, tokenExponent)).toString();
        
        // Execute pre-swap + IBC transfer
        const result = await executeReverseTransferWithPreSwap(
          sourceTokenDenom,
          lumeIbcDenom,
          amountInMicro,
          receiverAddress,
          preSwapSlippage, // Use user-configured slippage
          (step, message) => {
            setCurrentStep(step);
            setTxMessage(message);
          }
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Reverse transfer with pre-swap failed');
        }
        
        setTxStatus('success');
        setTxMessage(
          `Swap & Transfer complete! ` +
          `Swap TX: ${result.swapTx?.slice(0, 8)}... | ` +
          `Transfer TX: ${result.transferTx.slice(0, 8)}...`
        );
        setAmount('');
        setIsProcessing(false);
        return;
      }
      
      // Continue with normal transfer logic...
      const destChain = connectedChains.find(c => c.chainId === selectedDestChain);
      if (!destChain) throw new Error('Destination chain not found');

      // Determine actual source and destination based on direction
      let actualSourceChainId: string;
      let actualDestChainName: string;
      let actualSourceDenom: string;
      let actualSourceRpc: any;

      const chainIdMap: Record<string, string> = {
        'osmosis': 'osmosis-1',
        'osmosis-mainnet': 'osmosis-1',
        'cosmoshub': 'cosmoshub-4',
        'cosmoshub-mainnet': 'cosmoshub-4',
        'noble': 'noble-1',
        'noble-mainnet': 'noble-1',
      };

      if (isReversed) {
        // Reversed: transfer FROM selected chain TO source chain
        const normalizedName = destChain.chainName.toLowerCase().replace(/\s+/g, '-');
        actualSourceChainId = chainIdMap[normalizedName] || destChain.chainId;
        actualDestChainName = sourceChain.chain_name;
        
        const ibcDenoms: Record<string, Record<string, string>> = {
          'osmosis-1': {
            'lumera-mainnet': 'ibc/32C4AEE2B3C4F767A351FA821AB0140B10CB690CDED27D9FCC857859B44432B9',
            'epix-mainnet': 'ibc/EPIX_IBC_DENOM',
            'warden-mainnet': 'ibc/WARDEN_IBC_DENOM',
          },
        };
        
        const commonDenoms: Record<string, string> = {
          'osmosis-1': 'uosmo',
          'cosmoshub-4': 'uatom',
          'noble-1': 'uusdc',
        };
        
        actualSourceDenom = ibcDenoms[actualSourceChainId]?.[sourceChain.chain_name] || 
                           commonDenoms[actualSourceChainId] || 
                           'utoken';
        
        actualSourceRpc = null; // Will need to handle this
      } else {
        // Normal: transfer FROM source chain TO selected chain
        actualSourceChainId = sourceChain.chain_id || sourceChain.chain_name;
        actualDestChainName = destChain.chainName;
        actualSourceDenom = sourceChain.assets[0].base;
        actualSourceRpc = sourceChain.rpc[0];
      }

      await (window as any).keplr.enable(actualSourceChainId);
      
      // For EVM chains (coin_type 60), use Amino signer only to avoid EthAccount issues
      const isEvmChain = actualSourceChainId.includes('_');
      const offlineSigner = isEvmChain 
        ? await (window as any).keplr.getOfflineSignerOnlyAmino(actualSourceChainId)
        : await (window as any).keplr.getOfflineSignerAuto(actualSourceChainId);
      
      const accounts = await offlineSigner.getAccounts();
      const senderAddress = accounts[0].address;

      // Fetch IBC channel
      const channelSourceName = isReversed ? destChain.chainName : sourceChain.chain_name;
      const channelDestName = isReversed ? sourceChain.chain_name : destChain.chainName;
      
      const response = await fetch(`/api/ibc/channels?sourceChain=${channelSourceName}&destChain=${channelDestName}`);
      const channelData = await response.json();
      
      if (!channelData.channel) {
        throw new Error('No IBC channel found');
      }

      const { SigningStargateClient } = await import('@cosmjs/stargate');
      
      // For EVM chains, we need custom account parser to handle EthAccount type
      let clientOptions: any = {};
      
      if (isEvmChain) {
        // Import account parser helper
        const { accountFromAny } = await import('@cosmjs/stargate');
        
        // Fetch account info from REST API to get sequence number
        let accountInfo: any = null;
        try {
          const restEndpoint = typeof actualSourceRpc === 'string'
            ? actualSourceRpc.replace(/:\d+$/, ':1317') // Try to convert RPC to REST
            : actualSourceRpc.address.replace(/:\d+$/, ':1317');
          
          // Try to fetch from configured API endpoints
          const apiEndpoints = sourceChain.api || [];
          let restUrl = apiEndpoints.length > 0 
            ? (typeof apiEndpoints[0] === 'string' ? apiEndpoints[0] : apiEndpoints[0].address)
            : restEndpoint;
          
          console.log(`🔍 Fetching account info from: ${restUrl}/cosmos/auth/v1beta1/accounts/${senderAddress}`);
          
          const accountResponse = await fetch(`${restUrl}/cosmos/auth/v1beta1/accounts/${senderAddress}`);
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            
            // Extract base account from EthAccount
            let baseAccount = accountData.account;
            if (baseAccount.base_account) {
              baseAccount = baseAccount.base_account;
            } else if (baseAccount.BaseAccount) {
              baseAccount = baseAccount.BaseAccount;
            }
            
            accountInfo = {
              address: baseAccount.address || senderAddress,
              pubkey: baseAccount.pub_key || null,
              accountNumber: parseInt(baseAccount.account_number || '0'),
              sequence: parseInt(baseAccount.sequence || '0'),
            };
            
            console.log('✅ Account info fetched:', accountInfo);
          }
        } catch (fetchError) {
          console.warn('Failed to fetch account info, will use defaults:', fetchError);
        }
        
        // Custom account parser that handles EthAccount
        clientOptions.accountParser = (input: any) => {
          try {
            if (input.typeUrl === '/ethermint.types.v1.EthAccount') {
              console.log('🔍 Parsing EthAccount for IBC transfer');
              
              // If we fetched account info, use it
              if (accountInfo) {
                return accountInfo;
              }
              
              // Otherwise return minimal structure
              return {
                address: senderAddress,
                pubkey: null,
                accountNumber: 0,
                sequence: 0,
              };
            }
            
            return accountFromAny(input);
          } catch (error) {
            console.error('Account parser error:', error);
            // Fallback: use fetched account info or minimal structure
            return accountInfo || {
              address: senderAddress,
              pubkey: null,
              accountNumber: 0,
              sequence: 0,
            };
          }
        };
      }
      
      let rpcEndpoint: string;
      if (isReversed) {
        const commonRpcs: Record<string, string> = {
          'osmosis-1': 'https://rpc.osmosis.zone',
          'cosmoshub-4': 'https://rpc.cosmos.network',
          'noble-1': 'https://rpc.noble.strange.love',
        };
        rpcEndpoint = commonRpcs[actualSourceChainId] || '';
        if (!rpcEndpoint) {
          throw new Error('RPC endpoint not available for reversed transfer. Please use normal direction.');
        }
      } else {
        rpcEndpoint = typeof actualSourceRpc === 'string' 
          ? actualSourceRpc 
          : actualSourceRpc.address;
      }

      const client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        offlineSigner,
        clientOptions
      );

      const tokenExponent = isReversed 
        ? 6 
        : parseInt(String(sourceChain.assets[0]?.exponent || '6'));

      let feeAmount: string;
      if (tokenExponent >= 18) {
        feeAmount = '100000000000000';
      } else if (tokenExponent >= 12) {
        feeAmount = '500000000000';
      } else {
        feeAmount = '10000';
      }

      const amountFloat = parseFloat(amount);
      let transferAmount: string;
      
      if (tokenExponent >= 18) {
        const [intPart, decPart = ''] = amount.split('.');
        const paddedDec = decPart.padEnd(tokenExponent, '0').slice(0, tokenExponent);
        transferAmount = intPart + paddedDec;
        transferAmount = transferAmount.replace(/^0+/, '') || '0';
      } else {
        transferAmount = Math.floor(amountFloat * Math.pow(10, tokenExponent)).toString();
      }

      const result = await client.sendIbcTokens(
        senderAddress,
        receiverAddress,
        {
          denom: actualSourceDenom,
          amount: transferAmount,
        },
        'transfer',
        channelData.channel,
        undefined,
        Math.floor(Date.now() / 1000) * 1e9 + 600 * 1e9,
        {
          amount: [{ denom: actualSourceDenom, amount: feeAmount }],
          gas: '500000',
        },
        'WinScan IBC Transfer'
      );

      if (result.code !== 0) {
        throw new Error(result.rawLog || 'Transaction failed');
      }

      // Step 2: If auto-swap is enabled and destination is Osmosis, wait and then swap
      if (enableAutoSwap && !isReversed && isDestinationOsmosis) {
        setCurrentStep(1); // Step 1: Transfer complete, waiting for arrival
        setTxMessage(`Transfer successful! Waiting for tokens to arrive on Osmosis...`);
        
        // Smart polling: Check balance every 5 seconds instead of waiting fixed time
        const maxWaitTime = 120000; // Max 2 minutes
        const pollInterval = 5000; // Check every 5 seconds
        let elapsedTime = 0;
        let balanceArrived = false;
        
        try {
          const osmosisChainId = 'osmosis-1';
          await (window as any).keplr.enable(osmosisChainId);
          
          // Import osmojs
          const { getSigningOsmosisClient } = await import('osmojs');
          
          // Use Amino signer only (coin_type 118, no ethermint)
          const osmosisOfflineSigner = await (window as any).keplr.getOfflineSignerOnlyAmino(osmosisChainId);
          const osmosisAccounts = await osmosisOfflineSigner.getAccounts();
          const osmosisAddress = osmosisAccounts[0].address;
          
          // Connect using osmojs client with Amino signer
          const osmosisClient = await getSigningOsmosisClient({
            rpcEndpoint: 'https://rpc.osmosis.zone',
            signer: osmosisOfflineSigner,
          });
          
          // Calculate expected amount for matching
          const sourceExponent = parseInt(String(sourceChain.assets[0]?.exponent || '6'));
          const osmosisExponent = 6;
          const transferAmountInt = BigInt(transferAmount);
          let expectedAmountOnOsmosis: bigint;
          
          if (sourceExponent > osmosisExponent) {
            expectedAmountOnOsmosis = transferAmountInt / BigInt(Math.pow(10, sourceExponent - osmosisExponent));
          } else if (sourceExponent < osmosisExponent) {
            expectedAmountOnOsmosis = transferAmountInt * BigInt(Math.pow(10, osmosisExponent - sourceExponent));
          } else {
            expectedAmountOnOsmosis = transferAmountInt;
          }
          
          let tokenDenomOnOsmosis: string | null = null;
          let tokenInAmount: string = '0';
          
          // Poll for balance arrival
          while (elapsedTime < maxWaitTime && !balanceArrived) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            elapsedTime += pollInterval;
            
            setTxMessage(`Waiting for tokens to arrive on Osmosis... (${Math.floor(elapsedTime / 1000)}s)`);
            
            try {
              // Query all balances on Osmosis
              const allBalances = await osmosisClient.getAllBalances(osmosisAddress);
              const ibcBalances = allBalances.filter(b => b.denom.startsWith('ibc/'));
              
              // Find matching IBC denom by amount (within 1% tolerance)
              const tolerance = 0.01;
              
              for (const balance of ibcBalances) {
                const balanceAmount = BigInt(balance.amount);
                const diff = balanceAmount > expectedAmountOnOsmosis 
                  ? balanceAmount - expectedAmountOnOsmosis 
                  : expectedAmountOnOsmosis - balanceAmount;
                
                const percentDiff = Number(diff * BigInt(10000) / expectedAmountOnOsmosis) / 10000;
                
                if (percentDiff <= tolerance) {
                  tokenDenomOnOsmosis = balance.denom;
                  tokenInAmount = balance.amount;
                  balanceArrived = true;
                  console.log(`✅ Token arrived! Denom: ${tokenDenomOnOsmosis}, Amount: ${tokenInAmount}`);
                  break;
                }
              }
              
              // Fallback: use highest balance IBC denom if we've waited long enough
              if (!balanceArrived && elapsedTime >= 30000 && ibcBalances.length > 0) {
                const sortedBalances = [...ibcBalances].sort((a, b) => 
                  BigInt(b.amount) > BigInt(a.amount) ? 1 : -1
                );
                tokenDenomOnOsmosis = sortedBalances[0].denom;
                tokenInAmount = sortedBalances[0].amount;
                balanceArrived = true;
                console.log(`⚠️ Using fallback denom: ${tokenDenomOnOsmosis}`);
                break;
              }
              
            } catch (pollError) {
              console.error('Polling error:', pollError);
              // Continue polling
            }
          }
          
          if (!tokenDenomOnOsmosis) {
            throw new Error(`Could not detect IBC denom after ${maxWaitTime / 1000}s. Please swap manually on Osmosis.`);
          }
          
          setCurrentStep(2); // Step 2: Tokens arrived, executing swap
          setTxMessage(`Tokens arrived! Executing swap to ${swapToToken}...`);
          
          // Get target token denom
          const targetToken = availableSwapTokens.find(t => t.symbol === swapToToken);
          if (!targetToken) {
            throw new Error(`Target token ${swapToToken} not found`);
          }
          
          // Get optimal route from Osmosis SQS router (auto-detects best pools)
          const routerUrl = `https://sqs.osmosis.zone/router/quote?tokenIn=${tokenInAmount}${tokenDenomOnOsmosis}&tokenOutDenom=${targetToken.denom}`;
          
          console.log(`🔍 Querying Osmosis router: ${routerUrl}`);
          
          const routeResponse = await fetch(routerUrl);
          
          if (!routeResponse.ok) {
            const errorText = await routeResponse.text();
            console.error('❌ Router response error:', errorText);
            throw new Error(`Failed to get swap route from Osmosis router: ${routeResponse.status}`);
          }
          
          const routeData = await routeResponse.json();
          
          if (!routeData.amount_out || !routeData.route || routeData.route.length === 0) {
            throw new Error(`No valid swap route found for ${sourceChain.assets[0].symbol} to ${swapToToken}`);
          }
          
          console.log(`✅ Route found:`, routeData);
          
          // Extract routes from SQS response (pools auto-detected by router)
          const routes = routeData.route[0].pools.map((pool: any) => {
            return {
              poolId: BigInt(pool.id),
              tokenOutDenom: pool.token_out_denom,
            };
          });
          
          // Calculate minimum output with 5% slippage
          const expectedOut = routeData.amount_out;
          const minOut = Math.floor(parseInt(expectedOut) * 0.95).toString();
          
          console.log(`💱 Swapping ${tokenInAmount} ${tokenDenomOnOsmosis} → min ${minOut} ${targetToken.denom}`);
          
          // Import osmosis message composer
          const { osmosis } = await import('osmojs');
          
          // Build swap message using osmojs MessageComposer with dynamic routes
          const swapMsg = osmosis.poolmanager.v1beta1.MessageComposer.withTypeUrl.swapExactAmountIn({
            sender: osmosisAddress,
            routes: routes,
            tokenIn: {
              denom: tokenDenomOnOsmosis,
              amount: tokenInAmount,
            },
            tokenOutMinAmount: minOut,
          });
          
          const fee = {
            amount: [{ denom: 'uosmo', amount: '5000' }],
            gas: '550000',
          };
          
          // Sign and broadcast
          const swapResult = await osmosisClient.signAndBroadcast(
            osmosisAddress,
            [swapMsg],
            fee,
            'WinScan Auto-Swap'
          );
          
          if (swapResult.code !== 0) {
            throw new Error(swapResult.rawLog || 'Swap transaction failed');
          }
          
          const swapTxHash = swapResult.transactionHash;
          
          console.log(`✅ Swap successful! TX: ${swapTxHash}`);
          
          setCurrentStep(3); // Step 3: Complete
          
          // Show success popup
          setTxResult({
            success: true,
            transferTxHash: result.transactionHash,
            swapTxHash: swapTxHash,
            message: `Transfer and swap completed successfully!`
          });
          
          // Refresh balance
          try {
            const { SigningStargateClient } = await import('@cosmjs/stargate');
            const chainId = sourceChain.chain_id || sourceChain.chain_name;
            const offlineSigner = await (window as any).keplr.getOfflineSigner(chainId);
            const rpcEndpoint = sourceChain.rpc[0]?.address || sourceChain.rpc[0];
            const rpc = typeof rpcEndpoint === 'string' ? rpcEndpoint : rpcEndpoint.address;
            const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);
            const accounts = await offlineSigner.getAccounts();
            const bal = await client.getBalance(accounts[0].address, sourceChain.assets[0].base);
            const exponent = parseInt(String(sourceChain.assets[0]?.exponent || '6'));
            const formatted = (parseInt(bal.amount) / Math.pow(10, exponent)).toFixed(6);
            setBalance(formatted);
          } catch (balanceError) {
            console.error('Failed to refresh balance:', balanceError);
          }
          
        } catch (swapError: any) {
          console.error('❌ Auto-swap error:', swapError);
          // Transfer succeeded but swap failed - show partial success
          setCurrentStep(0);
          
          setTxResult({
            success: false,
            transferTxHash: result.transactionHash,
            message: `Transfer successful but auto-swap failed: ${swapError.message}. Please swap manually on Osmosis.`
          });
          
          // Still refresh balance since transfer succeeded
          try {
            const { SigningStargateClient } = await import('@cosmjs/stargate');
            const chainId = sourceChain.chain_id || sourceChain.chain_name;
            const offlineSigner = await (window as any).keplr.getOfflineSigner(chainId);
            const rpcEndpoint = sourceChain.rpc[0]?.address || sourceChain.rpc[0];
            const rpc = typeof rpcEndpoint === 'string' ? rpcEndpoint : rpcEndpoint.address;
            const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);
            const accounts = await offlineSigner.getAccounts();
            const bal = await client.getBalance(accounts[0].address, sourceChain.assets[0].base);
            const exponent = parseInt(String(sourceChain.assets[0]?.exponent || '6'));
            const formatted = (parseInt(bal.amount) / Math.pow(10, exponent)).toFixed(6);
            setBalance(formatted);
          } catch (balanceError) {
            console.error('Failed to refresh balance:', balanceError);
          }
        }
      } else {
        // No auto-swap, just show transfer success
        setTxResult({
          success: true,
          transferTxHash: result.transactionHash,
          message: 'Transfer completed successfully!'
        });
        
        // Refresh balance
        try {
          const { SigningStargateClient } = await import('@cosmjs/stargate');
          const chainId = sourceChain.chain_id || sourceChain.chain_name;
          const offlineSigner = await (window as any).keplr.getOfflineSigner(chainId);
          const rpcEndpoint = sourceChain.rpc[0]?.address || sourceChain.rpc[0];
          const rpc = typeof rpcEndpoint === 'string' ? rpcEndpoint : rpcEndpoint.address;
          const client = await SigningStargateClient.connectWithSigner(rpc, offlineSigner);
          const accounts = await offlineSigner.getAccounts();
          const bal = await client.getBalance(accounts[0].address, sourceChain.assets[0].base);
          const exponent = parseInt(String(sourceChain.assets[0]?.exponent || '6'));
          const formatted = (parseInt(bal.amount) / Math.pow(10, exponent)).toFixed(6);
          setBalance(formatted);
        } catch (balanceError) {
          console.error('Failed to refresh balance:', balanceError);
        }
      }
      
      // Clear amount input
      setAmount('');
      setSliderValue(0);
      
    } catch (error: any) {
      console.error('Transfer error:', error);
      setTxResult({
        success: false,
        transferTxHash: '',
        message: error.message || 'Transfer failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const setMaxAmount = () => {
    const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
    setAmount(maxAmount.toFixed(6));
    setSliderValue(100);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
    const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
    const calculatedAmount = (maxAmount * value) / 100;
    setAmount(calculatedAmount.toFixed(6));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    const maxAmount = Math.max(0, parseFloat(balance) - 0.01);
    const percentage = maxAmount > 0 ? (parseFloat(value) / maxAmount) * 100 : 0;
    setSliderValue(Math.min(100, Math.max(0, percentage)));
  };

  const handleSwapDirection = () => {
    const newReversed = !isReversed;
    setIsReversed(newReversed);
    setAmount('');
    setSliderValue(0);
    setReceiverAddress('');
    setBalance('0');
  };

  const selectedChainInfo = connectedChains.find(c => c.chainId === selectedDestChain);

  return (
    <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-lg p-4 md:p-6">
      <div className="text-center mb-4 md:mb-6">
        <div className="flex justify-center mb-3 md:mb-4">
          <div className="p-2 md:p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
            <ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-white mb-1 md:mb-2">
          IBC Transfer
        </h2>
        <p className="text-gray-400 text-xs md:text-sm">
          Transfer tokens between Cosmos chains
        </p>
      </div>

      {walletConnected ? (
        <>
          {/* Wallet Info */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4 mb-3 md:mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span className="text-gray-400 text-xs md:text-sm">Connected</span>
              </div>
              <span className="text-white text-xs md:text-sm font-mono">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <span className="text-gray-500 text-xs md:text-sm">Balance</span>
              <span className="text-white text-sm md:text-base font-medium">
                {balance} {isReversed && isSourceOsmosis 
                  ? selectedSourceToken
                  : (sourceChain.assets[0]?.symbol || 'TOKEN')}
              </span>
            </div>
          </div>

          {/* From Chain */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-3 md:p-4 mb-2">
            <label className="text-gray-400 text-xs md:text-sm mb-2 block">From</label>
            {!isReversed ? (
              <div className="flex items-center gap-2 md:gap-3">
                <img 
                  src={sourceChain.logo} 
                  alt={sourceChain.chain_name}
                  className="w-6 h-6 md:w-8 md:h-8 rounded-full"
                />
                <div className="text-white font-medium">{sourceChain.chain_name}</div>
              </div>
            ) : selectedChainInfo ? (
              <div className="flex items-center gap-3">
                {selectedChainInfo.logo ? (
                  <img 
                    src={selectedChainInfo.logo} 
                    alt={selectedChainInfo.chainName}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                )}
                <div className="text-white font-medium">{selectedChainInfo.chainName}</div>
              </div>
            ) : (
              <div className="text-gray-500">Select destination first</div>
            )}
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center -my-1 relative z-10 mb-2">
            <button
              onClick={handleSwapDirection}
              disabled={!selectedDestChain}
              className="p-2 bg-[#1a1a1a] border-2 border-gray-800 rounded-full hover:border-blue-500 hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Swap direction"
            >
              <ArrowDown className={`w-4 h-4 text-gray-400 transition-transform ${isReversed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* To Chain */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 mb-4">
            <label className="text-gray-400 text-sm mb-2 block">To</label>
            {!isReversed ? (
              <select
                value={selectedDestChain}
                onChange={(e) => setSelectedDestChain(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select destination</option>
                {connectedChains.map((chain) => (
                  <option key={chain.chainId} value={chain.chainId}>
                    {chain.chainName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-3">
                <img 
                  src={sourceChain.logo} 
                  alt={sourceChain.chain_name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="text-white font-medium">{sourceChain.chain_name}</div>
              </div>
            )}
          </div>

          {/* Auto-Swap Toggle - Only show when destination supports DEX */}
          {!isReversed && destinationSupportsDex && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enableAutoSwap}
                      onChange={(e) => setEnableAutoSwap(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 bg-gray-700"
                    />
                    <span className="ml-2 text-white font-medium">Auto-Swap on Arrival</span>
                  </label>
                  <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded text-purple-300 text-xs font-semibold">
                    BETA
                  </span>
                </div>
              </div>
              
              {enableAutoSwap && (
                <div className="space-y-3 pt-3 border-t border-purple-500/20">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">
                      Swap to token when tokens arrive
                    </label>
                    <select
                      value={swapToToken}
                      onChange={(e) => setSwapToToken(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-purple-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      {availableSwapTokens.map(token => (
                        <option key={token.denom} value={token.symbol}>
                          {token.symbol}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-purple-300 bg-purple-500/10 rounded p-3 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-3 h-3" />
                      <span className="font-medium">Auto-Swap Enabled</span>
                    </div>
                    <div className="text-purple-400">
                      Your {sourceChain.assets[0]?.symbol || 'tokens'} will automatically be swapped to {swapToToken} after arriving on {connectedChains.find(c => c.chainId === selectedDestChain)?.chainName || 'destination'} (~3 minutes after transfer).
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pre-Swap Toggle - Only show when reversed and source supports DEX */}
          {isReversed && sourceSupportsDex && (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePreSwap}
                      onChange={(e) => setEnablePreSwap(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 text-green-500 focus:ring-green-500 focus:ring-offset-0 bg-gray-700"
                    />
                    <span className="ml-2 text-white font-medium">Auto-Swap Before Transfer</span>
                  </label>
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-green-300 text-xs font-semibold">
                    BETA
                  </span>
                </div>
              </div>
              
              {enablePreSwap && (
                <div className="space-y-3 pt-3 border-t border-green-500/20">
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">
                      Select source token on Osmosis
                    </label>
                    <select
                      value={selectedSourceToken}
                      onChange={(e) => setSelectedSourceToken(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 mb-2"
                    >
                      <option value="OSMO">OSMO</option>
                      <option value="ATOM">ATOM</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-xs mb-1.5 block">
                      Swap {selectedSourceToken} to token before transfer
                    </label>
                    <select
                      value={preSwapToToken}
                      onChange={(e) => setPreSwapToToken(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-green-500/30 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                    >
                      <option value="LUME">LUME (native on Lumera)</option>
                    </select>
                  </div>
                  {preSwapRoute && (
                    <div className="text-xs text-green-300 bg-green-500/10 rounded p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="w-3 h-3" />
                        <span className="font-medium">Route Found</span>
                      </div>
                      <div className="text-green-400">
                        Pool ID: {preSwapRoute.poolId}
                        {preSwapRoute.poolId.includes(',') && ' (Multi-hop via OSMO)'}
                      </div>
                    </div>
                  )}
                  
                  {/* Slippage Settings */}
                  <div className="pt-3 border-t border-green-500/20">
                    <button
                      onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                      className="flex items-center justify-between w-full text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      <span>Slippage Tolerance: {preSwapSlippage}%</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${showSlippageSettings ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showSlippageSettings && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          {[0.5, 1, 3, 5].map((value) => (
                            <button
                              key={value}
                              onClick={() => setPreSwapSlippage(value)}
                              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                preSwapSlippage === value
                                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                                  : 'bg-[#0a0a0a] border border-gray-700 text-gray-400 hover:border-green-500/30'
                              }`}
                            >
                              {value}%
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={preSwapSlippage}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              if (!isNaN(value) && value >= 0 && value <= 50) {
                                setPreSwapSlippage(value);
                              }
                            }}
                            step="0.1"
                            min="0"
                            max="50"
                            className="flex-1 bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                            placeholder="Custom %"
                          />
                          <span className="text-gray-400 text-sm">Custom</span>
                        </div>
                        {preSwapSlippage > 5 && (
                          <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                            <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-300">
                              High slippage tolerance! You may receive significantly less tokens than expected.
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          Your transaction will revert if the price changes unfavorably by more than this percentage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-gray-400 text-sm">Amount</label>
              <span className="text-gray-500 text-sm">
                Available: {balance} {isReversed && isSourceOsmosis ? selectedSourceToken : sourceChain.assets[0]?.symbol || 'TOKEN'}
              </span>
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-3 text-white text-lg font-medium focus:outline-none focus:border-blue-500 mb-3"
              step="0.000001"
              min="0"
            />

            {/* Slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider mb-3"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderValue}%, #374151 ${sliderValue}%, #374151 100%)`
              }}
            />
            
            {/* Percentage Buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => handleSliderChange(25)}
                className="flex-1 py-2 px-3 bg-[#0a0a0a] hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                25%
              </button>
              <button
                onClick={() => handleSliderChange(50)}
                className="flex-1 py-2 px-3 bg-[#0a0a0a] hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                50%
              </button>
              <button
                onClick={() => handleSliderChange(75)}
                className="flex-1 py-2 px-3 bg-[#0a0a0a] hover:bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                75%
              </button>
              <button
                onClick={setMaxAmount}
                className="flex-1 py-2 px-3 bg-white hover:bg-gray-200 text-black text-sm font-medium rounded-lg transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Receiver Address */}
          <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Receiver Address</label>
            <input
              type="text"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="Auto-filled from Keplr"
              className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Progress Indicator for Pre-Swap + Transfer */}
          {isProcessing && enablePreSwap && isReversed && currentStep > 0 && (
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                {/* Step 1: Pre-Swap */}
                <div className="flex items-center gap-3">
                  {currentStep >= 2 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : currentStep === 1 ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      Step 1: Swapping on Osmosis
                    </div>
                    <div className="text-gray-400 text-sm">
                      {selectedSourceToken} → {preSwapToToken}
                    </div>
                  </div>
                </div>
                
                {/* Step 2: IBC Transfer */}
                <div className="flex items-center gap-3">
                  {currentStep >= 3 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : currentStep === 2 ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      Step 2: IBC Transfer to Lumera
                    </div>
                    <div className="text-gray-400 text-sm">
                      Estimated time: 1-3 minutes
                    </div>
                  </div>
                </div>
                
                {/* Step 3: Complete */}
                <div className="flex items-center gap-3">
                  {currentStep >= 3 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      Complete
                    </div>
                    <div className="text-gray-400 text-sm">
                      {preSwapToToken} will arrive on Lumera
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Indicator for Auto-Swap (Normal Mode) */}
          {isProcessing && enableAutoSwap && !isReversed && swapProgress.step !== 'idle' && (
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                {/* Step 1: IBC Transfer */}
                <div className="flex items-center gap-3">
                  {swapProgress.step !== 'transferring' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                  )}
                  <div>
                    <div className="text-white font-medium">
                      Step 1: IBC Transfer
                    </div>
                    <div className="text-gray-400 text-sm">
                      Transferring to Osmosis
                    </div>
                  </div>
                </div>
                
                {/* Step 2: Waiting for Arrival */}
                {(swapProgress.step === 'waiting' || swapProgress.step === 'swapping' || swapProgress.step === 'complete') && (
                  <div className="flex items-center gap-3">
                    {swapProgress.step !== 'waiting' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    )}
                    <div>
                      <div className="text-white font-medium">
                        Step 2: Waiting for Arrival
                      </div>
                      <div className="text-gray-400 text-sm">
                        {swapProgress.message}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Auto-Swap */}
                {(swapProgress.step === 'swapping' || swapProgress.step === 'complete') && (
                  <div className="flex items-center gap-3">
                    {swapProgress.step === 'complete' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    )}
                    <div>
                      <div className="text-white font-medium">
                        Step 3: Auto-Swap to {swapToToken}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Swapping on Osmosis
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transfer Button */}
          <button
            onClick={handleTransfer}
            disabled={isProcessing || !selectedDestChain || !amount}
            className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-700 disabled:cursor-not-allowed text-black disabled:text-gray-400 font-bold py-3 md:py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mb-3 md:mb-4 text-sm md:text-base"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : enablePreSwap && isReversed && isSourceOsmosis ? (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Swap & Transfer to Lumera
              </>
            ) : enableAutoSwap && destinationSupportsDex && !isReversed ? (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Transfer & Auto-Swap to {swapToToken}
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-5 h-5" />
                Confirm Transfer
              </>
            )}
          </button>

          {/* Success Message - Removed, using popup modal instead */}
          {/* Error Message - Removed, using popup modal instead */}

          {/* Info */}
          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-300 text-sm">
                IBC transfers take 1-3 minutes. Address auto-filled from Keplr.
                Double-check recipient address before confirming.
              </p>
            </div>
          </div>

          <style jsx>{`
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #3b82f6;
              cursor: pointer;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            .slider::-moz-range-thumb {
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: #3b82f6;
              cursor: pointer;
              border: 3px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
          `}</style>
        </>
      ) : (
        <div className="text-center py-6 md:py-8">
          <Wallet className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
          <p className="text-gray-400 mb-3 md:mb-4 text-sm md:text-base">Connect your Keplr wallet to continue</p>
          <button
            onClick={connectWallet}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
          >
            Connect Wallet
          </button>
        </div>
      )}
      
      {/* Success/Error Popup Modal */}
      {txResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] px-4">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-gray-800 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
              {txResult.success ? (
                <>
                  {/* Success Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/50">
                      <svg className="w-8 h-8 md:w-10 md:h-10 text-white animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Success Message */}
                  <div className="space-y-1 md:space-y-2">
                    <h3 className="text-xl md:text-2xl font-bold text-white">Transaction Successful!</h3>
                    <p className="text-gray-400 text-sm md:text-base">{txResult.message}</p>
                  </div>
                  
                  {/* Transaction Hashes */}
                  <div className="w-full space-y-3">
                    {/* Transfer TX */}
                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Transfer Transaction</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-green-400 font-mono break-all flex-1">
                          {txResult.transferTxHash}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(txResult.transferTxHash);
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Swap TX (if exists) */}
                    {txResult.swapTxHash && (
                      <div className="bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Swap Transaction</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-purple-400 font-mono break-all flex-1">
                            {txResult.swapTxHash}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(txResult.swapTxHash || '');
                            }}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                            title="Copy to clipboard"
                          >
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => setTxResult(null)}
                    className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/30 text-sm md:text-base"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  {/* Error Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/50">
                      <AlertCircle className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  
                  {/* Error Message */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Transaction Failed</h3>
                    <p className="text-gray-400">{txResult.message}</p>
                  </div>
                  
                  {/* Transfer TX (if exists) */}
                  {txResult.transferTxHash && (
                    <div className="w-full bg-[#0a0a0a] border border-gray-800 rounded-xl p-4 space-y-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Transfer Transaction</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-green-400 font-mono break-all flex-1">
                          {txResult.transferTxHash}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(txResult.transferTxHash);
                          }}
                          className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                          title="Copy to clipboard"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <button
                    onClick={() => setTxResult(null)}
                    className="w-full px-4 py-2 md:py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30 text-sm md:text-base"
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
