/**
 * PRC20 Token Actions
 * Utilities for burning, marketing info, and token management
 */

import { ChainData } from '@/types/chain';
import { isPaxiHubInstalled, signAndBroadcastPaxiHub, getCurrentWalletType } from './paxihub';

interface MarketingInfo {
  project?: string;
  description?: string;
  logo?: {
    url: string;
  };
  marketing?: string;
}

interface MinterInfo {
  minter: string;
  cap?: string;
}

/**
 * Query PRC20 marketing info from contract
 */
export async function queryMarketingInfo(
  lcdUrl: string,
  contractAddress: string
): Promise<MarketingInfo | null> {
  try {
    const query = { marketing_info: {} };
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString('base64');
    const url = `${lcdUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error querying marketing info:', error);
    return null;
  }
}

/**
 * Query PRC20 minter info from contract
 */
export async function queryMinterInfo(
  lcdUrl: string,
  contractAddress: string
): Promise<MinterInfo | null> {
  try {
    const query = { minter: {} };
    const queryBase64 = Buffer.from(JSON.stringify(query)).toString('base64');
    const url = `${lcdUrl}/cosmwasm/wasm/v1/contract/${contractAddress}/smart/${queryBase64}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.error('Error querying minter info:', error);
    return null;
  }
}

/**
 * Burn PRC20 tokens
 */
export async function burnPRC20Tokens(
  chain: ChainData,
  contractAddress: string,
  amount: string,
  memo: string = 'Burn tokens'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!window.keplr) {
      throw new Error('Keplr wallet not installed');
    }

    const chainId = chain.chain_id || chain.chain_name;
    await window.keplr.enable(chainId);

    const offlineSigner = await window.keplr.getOfflineSignerAuto(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signerAddress = accounts[0].address;

    // Import required modules
    const { GasPrice } = await import('@cosmjs/stargate');
    const { connectCosmWasmClient } = await import('./cosmosClient');

    // Get RPC endpoint
    const rpcList = chain.rpc || [];
    let rpcEndpoint = '';
    for (const rpc of rpcList) {
      if (rpc.tx_index === 'on') {
        rpcEndpoint = rpc.address;
        break;
      }
    }
    if (!rpcEndpoint && rpcList.length > 0) {
      rpcEndpoint = rpcList[0].address;
    }

    // Create CosmWasm client with automatic failover
    const client = await connectCosmWasmClient(rpcEndpoint, offlineSigner) as any;
    // Check balance before burning
    const balanceQuery = {
      balance: { address: signerAddress }
    };
    
    try {
      const balanceResult = await client.queryContractSmart(contractAddress, balanceQuery);
      const currentBalance = BigInt(balanceResult.balance);
      const burnAmount = BigInt(amount);

      console.log('💰 Current balance:', currentBalance.toString());
      console.log('🔥 Burn amount:', burnAmount.toString());

      if (currentBalance < burnAmount) {
        throw new Error(`Insufficient balance. You have ${currentBalance.toString()} but trying to burn ${burnAmount.toString()}`);
      }
    } catch (error: any) {
      if (error.message.includes('Insufficient balance')) {
        throw error;
      }
      console.warn('⚠️ Could not verify balance, proceeding with burn...');
    }
    // Burn message
    const burnMsg = {
      burn: {
        amount: amount
      }
    };

    console.log('🔥 Burning tokens:', {
      contract: contractAddress,
      amount: amount,
      signer: signerAddress
    });

    // Execute burn with sufficient gas
    const fee = {
      amount: [{ denom: 'upaxi', amount: '30000' }],
      gas: '600000' // Increased to 2x (from 300k)
    };

    const result = await client.execute(
      signerAddress,
      contractAddress,
      burnMsg,
      fee,
      memo
    );

    console.log('✅ Burn successful:', result.transactionHash);

    return {
      success: true,
      txHash: result.transactionHash
    };
  } catch (error: any) {
    console.error('❌ Burn failed:', error);
    return {
      success: false,
      error: error.message || 'Burn failed'
    };
  }
}

/**
 * Mint PRC20 tokens (only if you're the minter)
 */
export async function mintPRC20Tokens(
  chain: ChainData,
  contractAddress: string,
  recipient: string,
  amount: string,
  memo: string = 'Mint tokens'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!window.keplr) {
      throw new Error('Keplr wallet not installed');
    }

    const chainId = chain.chain_id || chain.chain_name;
    await window.keplr.enable(chainId);

    const offlineSigner = await window.keplr.getOfflineSignerAuto(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signerAddress = accounts[0].address;

    // Import required modules
    const { GasPrice } = await import('@cosmjs/stargate');
    const { connectCosmWasmClient } = await import('./cosmosClient');

    // Get RPC endpoint with fallback
    const rpcList = chain.rpc || [];
    let rpcEndpoint = '';
    for (const rpc of rpcList) {
      if (rpc.tx_index === 'on') {
        rpcEndpoint = rpc.address;
        break;
      }
    }
    if (!rpcEndpoint && rpcList.length > 0) {
      rpcEndpoint = rpcList[0].address;
    }
    // Fallback to default Paxi RPC if no RPC found
    if (!rpcEndpoint) {
      rpcEndpoint = 'https://mainnet-rpc.paxinet.io';
    }

    console.log('🔗 Using RPC endpoint:', rpcEndpoint);

    // Create CosmWasm client with automatic failover
    const client = await connectCosmWasmClient(rpcEndpoint, offlineSigner) as any;

    // Mint message
    const mintMsg = {
      mint: {
        recipient: recipient,
        amount: amount
      }
    };

    console.log('⚡ Minting tokens:', {
      contract: contractAddress,
      recipient: recipient,
      amount: amount,
      signer: signerAddress
    });

    // Execute mint with sufficient gas
    const fee = {
      amount: [{ denom: 'upaxi', amount: '30000' }],
      gas: '300000' // Increased for safety
    };

    const result = await client.execute(
      signerAddress,
      contractAddress,
      mintMsg,
      fee,
      memo
    );

    console.log('✅ Mint successful:', result.transactionHash);

    return {
      success: true,
      txHash: result.transactionHash
    };
  } catch (error: any) {
    console.error('❌ Mint failed:', error);
    return {
      success: false,
      error: error.message || 'Mint failed'
    };
  }
}

/**
 * Update marketing info (only if you're the marketing address)
 */
export async function updateMarketingInfo(
  chain: ChainData,
  contractAddress: string,
  marketingInfo: {
    project?: string;
    description?: string;
    marketing?: string;
  },
  memo: string = 'Update marketing info'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!window.keplr) {
      throw new Error('Keplr wallet not installed');
    }

    const chainId = chain.chain_id || chain.chain_name;
    await window.keplr.enable(chainId);

    const offlineSigner = await window.keplr.getOfflineSignerAuto(chainId);
    const accounts = await offlineSigner.getAccounts();
    const signerAddress = accounts[0].address;

    const { SigningCosmWasmClient } = await import('@cosmjs/cosmwasm-stargate');
    const { GasPrice } = await import('@cosmjs/stargate');

    const rpcList = chain.rpc || [];
    let rpcEndpoint = '';
    for (const rpc of rpcList) {
      if (rpc.tx_index === 'on') {
        rpcEndpoint = rpc.address;
        break;
      }
    }
    if (!rpcEndpoint && rpcList.length > 0) {
      rpcEndpoint = rpcList[0].address;
    }

    const client = await SigningCosmWasmClient.connectWithSigner(
      rpcEndpoint,
      offlineSigner,
      { gasPrice: GasPrice.fromString('0.025upaxi') }
    );

    const updateMsg = {
      update_marketing: marketingInfo
    };

    console.log('📝 Updating marketing info:', {
      contract: contractAddress,
      info: marketingInfo,
      signer: signerAddress
    });

    const fee = {
      amount: [{ denom: 'upaxi', amount: '30000' }],
      gas: '300000' // Increased for safety
    };

    const result = await client.execute(
      signerAddress,
      contractAddress,
      updateMsg,
      fee,
      memo
    );

    console.log('✅ Marketing info updated:', result.transactionHash);

    return {
      success: true,
      txHash: result.transactionHash
    };
  } catch (error: any) {
    console.error('❌ Update marketing info failed:', error);
    return {
      success: false,
      error: error.message || 'Update failed'
    };
  }
}

/**
 * Transfer PRC20 tokens to another address
 */
export async function transferPRC20Tokens(
  chain: string,
  contractAddress: string,
  recipient: string,
  amount: string,
  memo: string = 'Transfer tokens'
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    console.log('🔍 [transferPRC20] ==================== START ====================');
    console.log('🔍 [transferPRC20] Chain:', chain);
    console.log('🔍 [transferPRC20] typeof window:', typeof window);
    console.log('🔍 [transferPRC20] typeof window.paxihub:', typeof window !== 'undefined' ? typeof window.paxihub : 'undefined');
    console.log('🔍 [transferPRC20] window.paxihub exists:', typeof window !== 'undefined' && typeof window.paxihub !== 'undefined');
    
    // Import PaxiHub utilities
    const { isPaxiChain, ensurePaxiHubForPaxiChain } = await import('./paxihub');
    
    // CRITICAL: For Paxi chain, ONLY use PaxiHub (no Keplr fallback)
    if (isPaxiChain(chain)) {
      console.log('🔍 [transferPRC20] Paxi chain detected - enforcing PaxiHub usage');
      ensurePaxiHubForPaxiChain(chain); // This will throw if PaxiHub not available
    }
    
    // FIRST: Direct check for window.paxihub (most reliable for PaxiHub browser)
    if (typeof window !== 'undefined' && window.paxihub) {
      console.log('✅ [transferPRC20] window.paxihub exists - using PaxiHub for PRC20 transfer');
      
      const chainData: ChainData = {
        chain_name: chain,
        chain_id: chain,
        api: [],
        rpc: [],
        sdk_version: '',
        coin_type: '118',
        min_tx_fee: '0',
        assets: [{ base: 'upaxi', symbol: 'PAXI', exponent: 6, logo: '' }],
        addr_prefix: 'paxi',
        theme_color: '',
        logo: '',
      };
      
      const hub = window.paxihub;
      const paxi = hub.paxi || hub;
      const signerAddress = await paxi.getAddress(chain);
      
      const executeMsg = {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: {
          sender: signerAddress,
          contract: contractAddress,
          msg: Buffer.from(JSON.stringify({
            transfer: {
              recipient: recipient,
              amount: amount
            }
          })).toString('base64'),
          funds: [],
        },
      };
      
      const fee = {
        amount: [{ denom: 'upaxi', amount: '30000' }],
        gas: '300000'
      };
      
      try {
        const result = await signAndBroadcastPaxiHub(chainData, [executeMsg], fee, memo);
        return result.code === 0 ? { success: true, txHash: result.transactionHash } : { success: false, error: result.rawLog || 'Transfer failed' };
      } catch (err: any) {
        console.error('❌ PaxiHub PRC20 transfer error:', err);
        return { success: false, error: err.message || 'PaxiHub transfer failed' };
      }
    }
    
    // Check if PaxiHub is being used
    const walletType = getCurrentWalletType();
    if (walletType === 'paxihub' && isPaxiHubInstalled()) {
      console.log('Using PaxiHub for PRC20 transfer');
      
      // Get chain data (we need to fetch it or pass it as parameter)
      // For now, create minimal chain data
      const chainData: ChainData = {
        chain_name: chain,
        chain_id: chain,
        api: [],
        rpc: [],
        sdk_version: '',
        coin_type: '118',
        min_tx_fee: '0',
        assets: [{ base: 'upaxi', symbol: 'PAXI', exponent: 6, logo: '' }],
        addr_prefix: 'paxi',
        theme_color: '',
        logo: '',
      };
      
      const hub = window.paxihub;
      const paxi = hub.paxi || hub;
      const signerAddress = await paxi.getAddress(chain);
      
      // CosmWasm execute message
      const executeMsg = {
        typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
        value: {
          sender: signerAddress,
          contract: contractAddress,
          msg: Buffer.from(JSON.stringify({
            transfer: {
              recipient: recipient,
              amount: amount
            }
          })).toString('base64'),
          funds: [],
        },
      };
      
      const fee = {
        amount: [{ denom: 'upaxi', amount: '30000' }],
        gas: '300000'
      };
      
      const result = await signAndBroadcastPaxiHub(chainData, [executeMsg], fee, memo);
      
      if (result.code === 0) {
        return { success: true, txHash: result.transactionHash };
      } else {
        return { success: false, error: result.rawLog || 'Transfer failed' };
      }
    }
    
    // Original Keplr logic (allow for all chains including Paxi on desktop)
    if (!window.keplr) {
      throw new Error('Keplr wallet not installed');
    }

    await window.keplr.enable(chain);

    const offlineSigner = await window.keplr.getOfflineSignerAuto(chain);
    const accounts = await offlineSigner.getAccounts();
    const signerAddress = accounts[0].address;

    // Import required modules
    const { GasPrice } = await import('@cosmjs/stargate');
    const { connectCosmWasmClient } = await import('./cosmosClient');

    // Use RPC endpoint - for paxi-mainnet
    const rpcEndpoint = 'https://mainnet-rpc.paxinet.io';

    console.log('🔗 Using RPC endpoint:', rpcEndpoint);

    // Create CosmWasm client with automatic failover
    const client = await connectCosmWasmClient(rpcEndpoint, offlineSigner) as any;

    // Transfer message
    const transferMsg = {
      transfer: {
        recipient: recipient,
        amount: amount
      }
    };

    console.log('📤 Transferring tokens:', {
      contract: contractAddress,
      from: signerAddress,
      to: recipient,
      amount: amount
    });

    // Execute transfer with sufficient gas
    const fee = {
      amount: [{ denom: 'upaxi', amount: '30000' }],
      gas: '300000'
    };

    const result = await client.execute(
      signerAddress,
      contractAddress,
      transferMsg,
      fee,
      memo
    );

    console.log('✅ Transfer successful:', result.transactionHash);

    return {
      success: true,
      txHash: result.transactionHash
    };
  } catch (error: any) {
    console.error('❌ Transfer failed:', error);
    return {
      success: false,
      error: error.message || 'Transfer failed'
    };
  }
}
