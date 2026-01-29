/**
 * EVM Client
 * 
 * Client untuk berinteraksi dengan EVM RPC endpoints
 * Mendukung multiple providers dengan automatic failover
 */

import { findChainConfig } from '@/lib/utils/chain-config';

export interface EVMBlock {
  number: string;
  hash: string;
  parentHash: string;
  timestamp: string;
  miner: string;
  gasLimit: string;
  gasUsed: string;
  transactions: string[];
  transactionsCount: number;
}

export interface EVMTransaction {
  hash: string;
  blockNumber: string;
  blockHash: string;
  from: string;
  to: string | null;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  nonce: string;
  transactionIndex: string;
}

export interface EVMTransactionReceipt {
  transactionHash: string;
  blockNumber: string;
  blockHash: string;
  from: string;
  to: string | null;
  gasUsed: string;
  cumulativeGasUsed: string;
  contractAddress: string | null;
  logs: any[];
  status: string;
}

/**
 * Get EVM RPC endpoints for a chain
 */
export function getEVMRpcEndpoints(chainName: string): string[] {
  const chainConfig = findChainConfig(chainName);
  if (!chainConfig) {
    throw new Error(`Chain not found: ${chainName}`);
  }

  // @ts-ignore - evm_rpc might not be in type definition yet
  const evmRpc = chainConfig.evm_rpc || [];
  
  if (evmRpc.length === 0) {
    throw new Error(`No EVM RPC endpoints configured for chain: ${chainName}`);
  }

  return evmRpc.map((endpoint: any) => endpoint.address);
}

/**
 * Make JSON-RPC call to EVM endpoint with automatic failover
 */
async function evmRpcCall(
  chainName: string,
  method: string,
  params: any[] = []
): Promise<any> {
  const endpoints = getEVMRpcEndpoints(chainName);
  
  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params,
        }),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      return data.result;
    } catch (error: any) {
      console.warn(`[EVM RPC] ${endpoint} failed:`, error.message);
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error('All EVM RPC endpoints failed');
}

/**
 * Get latest block number
 */
export async function getLatestBlockNumber(chainName: string): Promise<number> {
  const result = await evmRpcCall(chainName, 'eth_blockNumber');
  return parseInt(result, 16);
}

/**
 * Get block by number
 */
export async function getBlockByNumber(
  chainName: string,
  blockNumber: number | 'latest',
  includeTransactions: boolean = false
): Promise<EVMBlock> {
  const blockParam = blockNumber === 'latest' ? 'latest' : `0x${blockNumber.toString(16)}`;
  const result = await evmRpcCall(chainName, 'eth_getBlockByNumber', [blockParam, includeTransactions]);
  
  return {
    number: result.number,
    hash: result.hash,
    parentHash: result.parentHash,
    timestamp: result.timestamp,
    miner: result.miner,
    gasLimit: result.gasLimit,
    gasUsed: result.gasUsed,
    transactions: result.transactions,
    transactionsCount: result.transactions.length,
  };
}

/**
 * Get multiple recent blocks
 */
export async function getRecentBlocks(
  chainName: string,
  count: number = 20
): Promise<EVMBlock[]> {
  const latestBlockNumber = await getLatestBlockNumber(chainName);
  
  const blockPromises: Promise<EVMBlock>[] = [];
  for (let i = 0; i < count; i++) {
    const blockNumber = latestBlockNumber - i;
    if (blockNumber >= 0) {
      blockPromises.push(getBlockByNumber(chainName, blockNumber, false));
    }
  }

  return await Promise.all(blockPromises);
}

/**
 * Get transaction by hash
 */
export async function getTransactionByHash(
  chainName: string,
  txHash: string
): Promise<EVMTransaction> {
  return await evmRpcCall(chainName, 'eth_getTransactionByHash', [txHash]);
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(
  chainName: string,
  txHash: string
): Promise<EVMTransactionReceipt> {
  return await evmRpcCall(chainName, 'eth_getTransactionReceipt', [txHash]);
}

/**
 * Get recent transactions from recent blocks
 */
export async function getRecentTransactions(
  chainName: string,
  blockCount: number = 10,
  maxTransactions: number = 50
): Promise<EVMTransaction[]> {
  const latestBlockNumber = await getLatestBlockNumber(chainName);
  
  const transactions: EVMTransaction[] = [];
  
  for (let i = 0; i < blockCount && transactions.length < maxTransactions; i++) {
    const blockNumber = latestBlockNumber - i;
    if (blockNumber < 0) break;
    
    try {
      const block = await getBlockByNumber(chainName, blockNumber, true);
      
      // If transactions are full objects (when includeTransactions = true)
      if (block.transactions.length > 0 && typeof block.transactions[0] === 'object') {
        const blockTxs = block.transactions as any as EVMTransaction[];
        transactions.push(...blockTxs.slice(0, maxTransactions - transactions.length));
      }
    } catch (error) {
      console.error(`Failed to fetch block ${blockNumber}:`, error);
      continue;
    }
  }

  return transactions;
}

/**
 * Get balance of an address
 */
export async function getBalance(
  chainName: string,
  address: string
): Promise<string> {
  return await evmRpcCall(chainName, 'eth_getBalance', [address, 'latest']);
}

/**
 * Get transaction count (nonce) of an address
 */
export async function getTransactionCount(
  chainName: string,
  address: string
): Promise<number> {
  const result = await evmRpcCall(chainName, 'eth_getTransactionCount', [address, 'latest']);
  return parseInt(result, 16);
}

/**
 * Get code at address (for contract verification)
 */
export async function getCode(
  chainName: string,
  address: string
): Promise<string> {
  return await evmRpcCall(chainName, 'eth_getCode', [address, 'latest']);
}

/**
 * Check if address is a contract
 */
export async function isContract(
  chainName: string,
  address: string
): Promise<boolean> {
  const code = await getCode(chainName, address);
  return code !== '0x' && code !== '0x0';
}

/**
 * ERC20 Token Interfaces
 */
export interface ERC20Token {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
}

export interface ERC20Transfer {
  from: string;
  to: string;
  value: string;
  transactionHash: string;
  blockNumber: number;
  logIndex: number;
}

/**
 * Call a contract method (read-only)
 */
export async function callContract(
  chainName: string,
  contractAddress: string,
  data: string
): Promise<string> {
  return await evmRpcCall(chainName, 'eth_call', [
    {
      to: contractAddress,
      data: data
    },
    'latest'
  ]);
}

/**
 * Get ERC20 token name
 */
export async function getERC20Name(
  chainName: string,
  tokenAddress: string
): Promise<string> {
  try {
    const result = await callContract(chainName, tokenAddress, '0x06fdde03'); // name()
    if (result === '0x' || !result) return 'Unknown';
    
    // Decode string from ABI encoding
    return decodeString(result);
  } catch (error: any) {
    // Silently handle execution reverted errors (not a valid ERC20)
    if (error.message?.includes('execution reverted')) {
      return 'Unknown';
    }
    console.error(`Failed to get token name for ${tokenAddress}:`, error);
    return 'Unknown';
  }
}

/**
 * Get ERC20 token symbol
 */
export async function getERC20Symbol(
  chainName: string,
  tokenAddress: string
): Promise<string> {
  try {
    const result = await callContract(chainName, tokenAddress, '0x95d89b41'); // symbol()
    if (result === '0x' || !result) return 'UNKNOWN';
    
    return decodeString(result);
  } catch (error: any) {
    // Silently handle execution reverted errors (not a valid ERC20)
    if (error.message?.includes('execution reverted')) {
      return 'UNKNOWN';
    }
    console.error(`Failed to get token symbol for ${tokenAddress}:`, error);
    return 'UNKNOWN';
  }
}

/**
 * Get ERC20 token decimals
 */
export async function getERC20Decimals(
  chainName: string,
  tokenAddress: string
): Promise<number> {
  try {
    const result = await callContract(chainName, tokenAddress, '0x313ce567'); // decimals()
    if (result === '0x' || !result) return 18;
    
    return parseInt(result, 16);
  } catch (error: any) {
    // Silently handle execution reverted errors (not a valid ERC20)
    if (error.message?.includes('execution reverted')) {
      return 18;
    }
    console.error(`Failed to get token decimals for ${tokenAddress}:`, error);
    return 18;
  }
}

/**
 * Get ERC20 token total supply
 */
export async function getERC20TotalSupply(
  chainName: string,
  tokenAddress: string
): Promise<string> {
  try {
    const result = await callContract(chainName, tokenAddress, '0x18160ddd'); // totalSupply()
    return result || '0x0';
  } catch (error: any) {
    // Silently handle execution reverted errors (not a valid ERC20)
    if (error.message?.includes('execution reverted')) {
      return '0x0';
    }
    console.error(`Failed to get token total supply for ${tokenAddress}:`, error);
    return '0x0';
  }
}

/**
 * Get ERC20 token balance of an address
 */
export async function getERC20Balance(
  chainName: string,
  tokenAddress: string,
  holderAddress: string
): Promise<string> {
  try {
    // balanceOf(address) - 0x70a08231 + padded address
    const paddedAddress = holderAddress.replace('0x', '').padStart(64, '0');
    const data = '0x70a08231' + paddedAddress;
    
    const result = await callContract(chainName, tokenAddress, data);
    return result || '0x0';
  } catch (error) {
    console.error(`Failed to get token balance for ${holderAddress}:`, error);
    return '0x0';
  }
}

/**
 * Get complete ERC20 token info
 */
export async function getERC20TokenInfo(
  chainName: string,
  tokenAddress: string
): Promise<ERC20Token | null> {
  try {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      getERC20Name(chainName, tokenAddress),
      getERC20Symbol(chainName, tokenAddress),
      getERC20Decimals(chainName, tokenAddress),
      getERC20TotalSupply(chainName, tokenAddress)
    ]);

    // Filter out invalid tokens (all defaults)
    if (name === 'Unknown' && symbol === 'UNKNOWN') {
      return null; // Not a valid ERC20 token
    }

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      totalSupply
    };
  } catch (error) {
    console.error(`Failed to get token info for ${tokenAddress}:`, error);
    return null;
  }
}

/**
 * Get ERC20 Transfer events
 * Transfer event signature: 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
 */
export async function getERC20Transfers(
  chainName: string,
  tokenAddress: string,
  fromBlock: number,
  toBlock: number | 'latest'
): Promise<ERC20Transfer[]> {
  try {
    const toBlockParam = toBlock === 'latest' ? 'latest' : `0x${toBlock.toString(16)}`;
    
    const logs = await evmRpcCall(chainName, 'eth_getLogs', [
      {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: toBlockParam,
        address: tokenAddress,
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer(address,address,uint256)
        ]
      }
    ]);

    return logs.map((log: any) => ({
      from: '0x' + log.topics[1].slice(26), // Remove padding
      to: '0x' + log.topics[2].slice(26),
      value: log.data,
      transactionHash: log.transactionHash,
      blockNumber: parseInt(log.blockNumber, 16),
      logIndex: parseInt(log.logIndex, 16)
    }));
  } catch (error) {
    console.error(`Failed to get transfers for ${tokenAddress}:`, error);
    return [];
  }
}

/**
 * Discover ERC20 tokens from recent Transfer events
 */
export async function discoverERC20Tokens(
  chainName: string,
  blockRange: number = 10000
): Promise<string[]> {
  try {
    const latestBlock = await getLatestBlockNumber(chainName);
    // Respect RPC limit of 10000 blocks
    const maxRange = 10000;
    const actualRange = Math.min(blockRange, maxRange);
    const fromBlock = Math.max(0, latestBlock - actualRange);
    
    const logs = await evmRpcCall(chainName, 'eth_getLogs', [
      {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event
        ]
      }
    ]);

    // Extract unique contract addresses
    const addresses = new Set<string>();
    logs.forEach((log: any) => {
      if (log.address) {
        addresses.add(log.address.toLowerCase());
      }
    });

    return Array.from(addresses);
  } catch (error) {
    console.error('Failed to discover tokens:', error);
    return [];
  }
}

/**
 * Helper: Decode ABI-encoded string
 */
function decodeString(hex: string): string {
  try {
    if (!hex || hex === '0x') return '';
    
    // Remove 0x prefix
    const data = hex.slice(2);
    
    // Skip offset (first 32 bytes) and length (next 32 bytes)
    const lengthHex = data.slice(64, 128);
    const length = parseInt(lengthHex, 16);
    
    // Get string data
    const stringHex = data.slice(128, 128 + length * 2);
    
    // Convert hex to string
    let result = '';
    for (let i = 0; i < stringHex.length; i += 2) {
      const byte = parseInt(stringHex.substr(i, 2), 16);
      if (byte !== 0) {
        result += String.fromCharCode(byte);
      }
    }
    
    return result || 'Unknown';
  } catch (error) {
    console.error('Failed to decode string:', error);
    return 'Unknown';
  }
}

/**
 * Address Detail Interfaces
 */
export interface AddressTransactions {
  sent: EVMTransaction[];
  received: EVMTransaction[];
  total: number;
}

export interface TokenBalance {
  tokenAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
}

export interface NFTBalance {
  contractAddress: string;
  tokenId: string;
  name?: string;
  symbol?: string;
  tokenURI?: string;
  metadata?: any;
}

/**
 * Get all transactions for an address from recent blocks
 */
export async function getAddressTransactions(
  chainName: string,
  address: string,
  blockRange: number = 10000
): Promise<AddressTransactions> {
  try {
    const latestBlock = await getLatestBlockNumber(chainName);
    const fromBlock = Math.max(0, latestBlock - blockRange);
    
    const sent: EVMTransaction[] = [];
    const received: EVMTransaction[] = [];
    
    // Scan blocks for transactions involving this address
    // Note: This is inefficient for large ranges, better to use indexed backend
    const batchSize = 100; // Process 100 blocks at a time
    const numBatches = Math.ceil(blockRange / batchSize);
    
    for (let i = 0; i < numBatches && i < 10; i++) { // Limit to 10 batches (1000 blocks)
      const batchStart = latestBlock - (i * batchSize);
      const batchEnd = Math.max(fromBlock, batchStart - batchSize);
      
      try {
        // Get blocks with transactions
        const blockPromises: Promise<EVMBlock>[] = [];
        for (let blockNum = batchStart; blockNum > batchEnd && blockNum >= 0; blockNum--) {
          blockPromises.push(getBlockByNumber(chainName, blockNum, true));
        }
        
        const blocks = await Promise.all(blockPromises);
        
        // Filter transactions for this address
        blocks.forEach(block => {
          if (Array.isArray(block.transactions) && block.transactions.length > 0) {
            block.transactions.forEach((tx: any) => {
              if (typeof tx === 'object') {
                const txFrom = tx.from?.toLowerCase();
                const txTo = tx.to?.toLowerCase();
                const targetAddr = address.toLowerCase();
                
                if (txFrom === targetAddr) {
                  sent.push(tx as EVMTransaction);
                } else if (txTo === targetAddr) {
                  received.push(tx as EVMTransaction);
                }
              }
            });
          }
        });
      } catch (error) {
        console.error(`Failed to fetch batch ${i}:`, error);
        break; // Stop on error
      }
    }
    
    return {
      sent,
      received,
      total: sent.length + received.length
    };
  } catch (error) {
    console.error('Failed to get address transactions:', error);
    return { sent: [], received: [], total: 0 };
  }
}

/**
 * Get ERC20 token balances for an address
 */
export async function getAddressTokenBalances(
  chainName: string,
  address: string,
  tokenAddresses: string[]
): Promise<TokenBalance[]> {
  try {
    const balances: TokenBalance[] = [];
    
    // Fetch token info and balance in parallel
    const promises = tokenAddresses.map(async (tokenAddr) => {
      try {
        const [info, balance] = await Promise.all([
          getERC20TokenInfo(chainName, tokenAddr),
          getERC20Balance(chainName, tokenAddr, address)
        ]);
        
        // Skip if token info is null (invalid token)
        if (!info) {
          return null;
        }
        
        const balanceNum = parseInt(balance, 16);
        if (balanceNum > 0) {
          const balanceFormatted = (balanceNum / Math.pow(10, info.decimals)).toFixed(4);
          
          return {
            tokenAddress: tokenAddr,
            name: info.name,
            symbol: info.symbol,
            decimals: info.decimals,
            balance: balance,
            balanceFormatted
          };
        }
        return null;
      } catch (error) {
        console.error(`Failed to get balance for token ${tokenAddr}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    return results.filter((b): b is TokenBalance => b !== null);
  } catch (error) {
    console.error('Failed to get token balances:', error);
    return [];
  }
}

/**
 * Discover tokens held by an address from Transfer events
 */
export async function discoverAddressTokens(
  chainName: string,
  address: string,
  blockRange: number = 10000
): Promise<string[]> {
  try {
    const latestBlock = await getLatestBlockNumber(chainName);
    const fromBlock = Math.max(0, latestBlock - blockRange);
    
    // Query Transfer events where address is recipient (topic2)
    const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
    
    const logs = await evmRpcCall(chainName, 'eth_getLogs', [
      {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
          null, // from (any)
          `0x${paddedAddress}` // to (our address)
        ]
      }
    ]);
    
    // Extract unique token addresses
    const tokenAddresses = new Set<string>();
    logs.forEach((log: any) => {
      if (log.address) {
        tokenAddresses.add(log.address.toLowerCase());
      }
    });
    
    return Array.from(tokenAddresses);
  } catch (error) {
    console.error('Failed to discover address tokens:', error);
    return [];
  }
}

/**
 * Get NFT (ERC721) balance for an address
 */
export async function getERC721Balance(
  chainName: string,
  nftAddress: string,
  ownerAddress: string
): Promise<number> {
  try {
    // balanceOf(address) - 0x70a08231 + padded address
    const paddedAddress = ownerAddress.replace('0x', '').padStart(64, '0');
    const data = '0x70a08231' + paddedAddress;
    
    const result = await callContract(chainName, nftAddress, data);
    return parseInt(result || '0x0', 16);
  } catch (error) {
    console.error(`Failed to get NFT balance for ${ownerAddress}:`, error);
    return 0;
  }
}

/**
 * Get NFT token URI
 */
export async function getERC721TokenURI(
  chainName: string,
  nftAddress: string,
  tokenId: string
): Promise<string> {
  try {
    // tokenURI(uint256) - 0xc87b56dd + padded tokenId
    const paddedTokenId = tokenId.replace('0x', '').padStart(64, '0');
    const data = '0xc87b56dd' + paddedTokenId;
    
    const result = await callContract(chainName, nftAddress, data);
    return decodeString(result);
  } catch (error) {
    console.error(`Failed to get token URI for ${nftAddress}:`, error);
    return '';
  }
}

/**
 * Discover NFTs owned by an address from Transfer events
 */
export async function discoverAddressNFTs(
  chainName: string,
  address: string,
  blockRange: number = 10000
): Promise<NFTBalance[]> {
  try {
    const latestBlock = await getLatestBlockNumber(chainName);
    const fromBlock = Math.max(0, latestBlock - blockRange);
    
    // Query Transfer events where address is recipient
    const paddedAddress = address.toLowerCase().replace('0x', '').padStart(64, '0');
    
    const logs = await evmRpcCall(chainName, 'eth_getLogs', [
      {
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: 'latest',
        topics: [
          '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef', // Transfer event
          null, // from
          `0x${paddedAddress}`, // to (our address)
          null // tokenId (for ERC721)
        ]
      }
    ]);
    
    // Group by contract and extract token IDs
    const nftMap = new Map<string, Set<string>>();
    
    logs.forEach((log: any) => {
      if (log.topics.length >= 4) { // ERC721 has 4 topics
        const contractAddr = log.address.toLowerCase();
        const tokenId = log.topics[3]; // tokenId is in topic3
        
        if (!nftMap.has(contractAddr)) {
          nftMap.set(contractAddr, new Set());
        }
        nftMap.get(contractAddr)!.add(tokenId);
      }
    });
    
    // Build NFT balance array
    const nfts: NFTBalance[] = [];
    for (const [contractAddr, tokenIds] of nftMap.entries()) {
      for (const tokenId of tokenIds) {
        nfts.push({
          contractAddress: contractAddr,
          tokenId: tokenId
        });
      }
    }
    
    return nfts;
  } catch (error) {
    console.error('Failed to discover address NFTs:', error);
    return [];
  }
}
