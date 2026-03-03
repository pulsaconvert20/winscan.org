/**
 * IBC Transfer utilities for cross-chain token transfers
 * Uses Keplr/Leap wallet for signing
 */

import { SigningStargateClient } from '@cosmjs/stargate';
import { getIBCChannel } from './ibcChannels';

export interface IBCTransferParams {
  sourceChain: string;
  destChain: string;
  token: {
    denom: string;
    amount: string;
  };
  recipientAddress: string;
  senderAddress: string;
  memo?: string;
}

export interface IBCTransferMsg {
  typeUrl: string;
  value: {
    sourcePort: string;
    sourceChannel: string;
    token: {
      denom: string;
      amount: string;
    };
    sender: string;
    receiver: string;
    timeoutHeight?: {
      revisionNumber: string;
      revisionHeight: string;
    };
    timeoutTimestamp: string;
    memo?: string;
    encoding?: string; // For Epix chain
    use_aliasing?: boolean; // For Epix chain
  };
}

/**
 * Build IBC transfer message
 */
export async function buildIBCTransferMsg(params: IBCTransferParams): Promise<IBCTransferMsg | null> {
  // Check if this is Epix chain (requires special fields)
  const isEpixChain = params.sourceChain.toLowerCase().includes('epix');
  
  // Try to get channel from API first
  try {
    const response = await fetch(`/api/ibc/channels?sourceChain=${params.sourceChain}&destChain=${params.destChain}`);
    if (response.ok) {
      const channelData = await response.json();
      if (channelData.channel) {
        // Timeout: 10 minutes from now
        const timeoutTimestamp = (Date.now() + 10 * 60 * 1000) * 1_000_000; // nanoseconds

        const msgValue: any = {
          sourcePort: 'transfer',
          sourceChannel: channelData.channel,
          token: {
            denom: params.token.denom,
            amount: params.token.amount,
          },
          sender: params.senderAddress,
          receiver: params.recipientAddress,
          timeoutHeight: {
            revisionNumber: '0',
            revisionHeight: '0',
          },
          timeoutTimestamp: timeoutTimestamp.toString(),
          memo: params.memo || '',
        };

        // Add Epix-specific fields
        if (isEpixChain) {
          msgValue.encoding = '';
          msgValue.use_aliasing = false;
        }

        return {
          typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
          value: msgValue,
        };
      }
    }
  } catch (error) {
    console.warn('Failed to fetch channel from API, falling back to static mapping:', error);
  }

  // Fallback to static mapping
  const channel = getIBCChannel(params.sourceChain, params.destChain);
  
  if (!channel) {
    console.error(`No IBC channel found from ${params.sourceChain} to ${params.destChain}`);
    return null;
  }

  // Timeout: 10 minutes from now
  const timeoutTimestamp = (Date.now() + 10 * 60 * 1000) * 1_000_000; // nanoseconds

  const msgValue: any = {
    sourcePort: 'transfer',
    sourceChannel: channel.channelId,
    token: {
      denom: params.token.denom,
      amount: params.token.amount,
    },
    sender: params.senderAddress,
    receiver: params.recipientAddress,
    timeoutHeight: {
      revisionNumber: '0',
      revisionHeight: '0',
    },
    timeoutTimestamp: timeoutTimestamp.toString(),
    memo: params.memo || '',
  };

  // Add Epix-specific fields
  if (isEpixChain) {
    msgValue.encoding = '';
    msgValue.use_aliasing = false;
  }

  return {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: msgValue,
  };
}

/**
 * Estimate IBC transfer fee
 */
export function estimateIBCFee(sourceChain: string) {
  // Default gas estimation per chain
  const feeConfigs: Record<string, { denom: string; amount: string; gas: string }> = {
    'paxi-mainnet': {
      denom: 'upaxi',
      amount: '15000',
      gas: '200000',
    },
    'epix-mainnet': {
      denom: 'aepix',
      amount: '4308720000000000', // From your example
      gas: '107718', // From your example
    },
    'cosmoshub-mainnet': {
      denom: 'uatom',
      amount: '5000',
      gas: '200000',
    },
    'osmosis-mainnet': {
      denom: 'uosmo',
      amount: '5000',
      gas: '200000',
    },
    'noble-mainnet': {
      denom: 'uusdc',
      amount: '1000',
      gas: '200000',
    },
    'kiichain-test': {
      denom: 'akii',
      amount: '10000',
      gas: '200000',
    },
    'lumera-mainnet': {
      denom: 'ulume',
      amount: '5000',
      gas: '200000',
    },
  };

  return feeConfigs[sourceChain] || {
    denom: 'stake',
    amount: '5000',
    gas: '200000',
  };
}

/**
 * Execute IBC transfer using Keplr wallet
 */
export async function executeIBCTransfer(
  params: IBCTransferParams,
  rpcEndpoint: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Check if Keplr is available
    if (!window.keplr) {
      return {
        success: false,
        error: 'Keplr wallet not found. Please install Keplr extension.',
      };
    }

    // Build transfer message
    const msg = await buildIBCTransferMsg(params);
    if (!msg) {
      return {
        success: false,
        error: 'Invalid IBC route or channel not found',
      };
    }

    // Check if this is an EVM chain (Epix uses coin_type 60)
    const isEvmChain = params.sourceChain.toLowerCase().includes('epix') || 
                       params.sourceChain.includes('_');

    console.log('🔍 IBC Transfer Debug:', {
      sourceChain: params.sourceChain,
      isEvmChain,
      denom: params.token.denom,
      amount: params.token.amount,
    });

    // Suggest chain if not already added (this will auto-add from registry)
    try {
      await window.keplr.enable(params.sourceChain);
    } catch (err: any) {
      // If chain not found, try suggesting it
      if (err.message?.includes('There is no chain info')) {
        return {
          success: false,
          error: `Chain ${params.sourceChain} not found in Keplr. Please add it manually first.`,
        };
      }
      throw err;
    }
    
    // For EVM chains, use Direct signer (better ethsecp256k1 support)
    const offlineSigner = isEvmChain 
      ? await window.keplr.getOfflineSigner(params.sourceChain)
      : await window.keplr.getOfflineSignerAuto(params.sourceChain);
    
    console.log('✅ Signer type:', isEvmChain ? 'Direct (EVM)' : 'Auto');
    
    const accounts = await offlineSigner.getAccounts();
    
    if (accounts.length === 0) {
      return {
        success: false,
        error: 'No accounts found in wallet',
      };
    }

    console.log('✅ Account:', accounts[0].address);

    // Validate RPC endpoint
    if (!rpcEndpoint || typeof rpcEndpoint !== 'string' || rpcEndpoint.trim() === '') {
      return {
        success: false,
        error: 'RPC endpoint not configured for this chain',
      };
    }

    // Create signing client with EVM support if needed
    let client;
    try {
      const clientOptions: any = {
        broadcastTimeoutMs: 30000,
        broadcastPollIntervalMs: 3000,
      };

      // Add EVM support for Epix and other EVM chains
      if (isEvmChain) {
        console.log('🔧 Detected EVM chain, adding EthAccount support');
        
        // Use EVM signing helper from evmSigning.ts
        const { fetchAccountWithEthSupport } = await import('./evmSigning');
        
        // Fetch account info with EVM support
        const restEndpoint = rpcEndpoint.replace(/:\d+$/, '').replace('rpc', 'api');
        console.log('📡 Fetching account from REST:', restEndpoint);
        
        const accountInfo = await fetchAccountWithEthSupport(
          restEndpoint,
          params.senderAddress
        );
        
        console.log('✅ Account info fetched:', accountInfo);
        
        // Import EVM signing utilities
        const { Registry } = await import('@cosmjs/proto-signing');
        const { defaultRegistryTypes } = await import('@cosmjs/stargate');
        
        // Create registry with default types
        const registry = new Registry([...defaultRegistryTypes] as any);
        clientOptions.registry = registry;
        
        // Add custom account parser for EthAccount
        clientOptions.accountParser = (input: any) => {
          if (input.typeUrl === '/ethermint.types.v1.EthAccount') {
            console.log('🔍 Parsing EthAccount - using fetched account info');
            
            // Use fetched account info
            return {
              address: accountInfo.address,
              pubkey: accountInfo.pubkey,
              accountNumber: accountInfo.accountNumber,
              sequence: accountInfo.sequence,
            };
          }
          
          // For other account types, use default parser
          try {
            const { accountFromAny } = require('@cosmjs/stargate');
            return accountFromAny(input);
          } catch (error) {
            console.error('Account parser error:', error);
            // Return fetched account as fallback
            return {
              address: accountInfo.address,
              pubkey: accountInfo.pubkey,
              accountNumber: accountInfo.accountNumber,
              sequence: accountInfo.sequence,
            };
          }
        };
        
        console.log('✅ EVM registry and account parser configured');
      }

      client = await SigningStargateClient.connectWithSigner(
        rpcEndpoint,
        offlineSigner,
        clientOptions
      );
      
      console.log('✅ Signing client connected');
    } catch (err: any) {
      console.error('❌ Failed to connect to RPC:', err);
      return {
        success: false,
        error: `Failed to connect to RPC: ${err.message || 'Connection failed'}`,
      };
    }

    // Estimate fee
    const feeConfig = estimateIBCFee(params.sourceChain);
    const fee = {
      amount: [{ denom: feeConfig.denom, amount: feeConfig.amount }],
      gas: feeConfig.gas,
    };

    console.log('💰 Fee:', fee);

    // Sign and broadcast transaction
    console.log('📝 Signing and broadcasting...');
    const result = await client.signAndBroadcast(
      params.senderAddress,
      [msg],
      fee,
      params.memo || ''
    );

    console.log('📡 Broadcast result:', result);

    if (result.code !== 0) {
      return {
        success: false,
        error: `Transaction failed: ${result.rawLog}`,
      };
    }

    return {
      success: true,
      txHash: result.transactionHash,
    };
  } catch (error: any) {
    console.error('IBC transfer error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Format IBC transfer command for CLI reference
 */
export function formatIBCTransferCommand(params: IBCTransferParams): string {
  const channel = getIBCChannel(params.sourceChain, params.destChain);
  if (!channel) return '';

  const feeConfig = estimateIBCFee(params.sourceChain);
  
  return `# IBC Transfer Command
paxid tx ibc-transfer transfer transfer ${channel.channelId} \\
  ${params.recipientAddress} \\
  ${params.token.amount}${params.token.denom} \\
  --from <wallet> \\
  --chain-id ${params.sourceChain} \\
  --gas auto \\
  --gas-adjustment 1.5 \\
  --fees ${feeConfig.amount}${feeConfig.denom}`;
}
