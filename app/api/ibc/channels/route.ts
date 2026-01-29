import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Chain ID mapping for common chains
const CHAIN_ID_MAP: Record<string, string> = {
  'osmosis': 'osmosis-1',
  'osmosis-mainnet': 'osmosis-1',
  'cosmoshub': 'cosmoshub-4',
  'cosmoshub-mainnet': 'cosmoshub-4',
  'noble': 'noble-1',
  'noble-mainnet': 'noble-1',
};

function normalizeChainName(name: string): string {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^the-/, '')
    .trim();
}

// Load chain config from Chains directory
function loadChainConfig(chainName: string): any {
  try {
    const chainsDir = path.join(process.cwd(), 'Chains');
    const files = fs.readdirSync(chainsDir);
    
    // Try to find matching chain file
    const chainFile = files.find(f => 
      f.toLowerCase().includes(chainName.toLowerCase()) && f.endsWith('.json')
    );
    
    if (!chainFile) return null;
    
    const filePath = path.join(chainsDir, chainFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load chain config for ${chainName}:`, error);
    return null;
  }
}

// Query IBC channels from chain RPC
async function queryIBCChannels(rpcUrl: string, destChainId: string): Promise<string | null> {
  try {
    // Query all channels
    const response = await fetch(`${rpcUrl}/ibc/core/channel/v1/channels?pagination.limit=1000`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`Failed to query channels: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.channels || data.channels.length === 0) {
      return null;
    }
    
    // Find OPEN channel for destination chain
    for (const channel of data.channels) {
      if (channel.state !== 'STATE_OPEN') continue;
      if (channel.port_id !== 'transfer') continue;
      
      // Query channel client state to get destination chain ID
      try {
        const clientResponse = await fetch(
          `${rpcUrl}/ibc/core/channel/v1/channels/${channel.channel_id}/ports/transfer/client_state`
        );
        
        if (!clientResponse.ok) continue;
        
        const clientData = await clientResponse.json();
        const clientChainId = clientData.identified_client_state?.client_state?.chain_id;
        
        if (clientChainId === destChainId) {
          return channel.channel_id;
        }
      } catch (clientError) {
        console.error(`Failed to query client state for ${channel.channel_id}:`, clientError);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying IBC channels:', error);
    return null;
  }
}

// Query from destination chain and find counterparty channel
async function queryFromDestination(destRpcUrl: string, sourceChainId: string): Promise<string | null> {
  try {
    const response = await fetch(`${destRpcUrl}/ibc/core/channel/v1/channels?pagination.limit=1000`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`Failed to query destination channels: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.channels || data.channels.length === 0) {
      return null;
    }
    
    // Find OPEN channel that connects to source chain
    for (const channel of data.channels) {
      if (channel.state !== 'STATE_OPEN') continue;
      if (channel.port_id !== 'transfer') continue;
      
      try {
        const clientResponse = await fetch(
          `${destRpcUrl}/ibc/core/channel/v1/channels/${channel.channel_id}/ports/transfer/client_state`
        );
        
        if (!clientResponse.ok) continue;
        
        const clientData = await clientResponse.json();
        const clientChainId = clientData.identified_client_state?.client_state?.chain_id;
        
        if (clientChainId === sourceChainId) {
          // Found the channel on destination, now get counterparty
          const counterpartyChannel = channel.counterparty?.channel_id;
          if (counterpartyChannel) {
            return counterpartyChannel;
          }
        }
      } catch (clientError) {
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error querying from destination:', error);
    return null;
  }
}

// Fallback: Query chain registry for IBC data
async function queryChainRegistry(sourceChainName: string, destChainName: string): Promise<string | null> {
  try {
    // Try to fetch from chain registry IBC data
    const registryUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/_IBC/${sourceChainName}-${destChainName}.json`;
    
    const response = await fetch(registryUrl);
    if (!response.ok) {
      // Try reverse direction
      const reverseUrl = `https://raw.githubusercontent.com/cosmos/chain-registry/master/_IBC/${destChainName}-${sourceChainName}.json`;
      const reverseResponse = await fetch(reverseUrl);
      
      if (!reverseResponse.ok) {
        return null;
      }
      
      const reverseData = await reverseResponse.json();
      // Get counterparty channel (reverse direction)
      const channel = reverseData.channels?.[0]?.chain_2?.channel_id;
      if (channel) {
        return channel;
      }
      return null;
    }
    
    const data = await response.json();
    const channel = data.channels?.[0]?.chain_1?.channel_id;
    
    if (channel) {
      return channel;
    }
    
    return null;
  } catch (error) {
    console.error('Error querying chain registry:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceChain = searchParams.get('sourceChain');
    const destChain = searchParams.get('destChain');

    if (!sourceChain || !destChain) {
      return NextResponse.json(
        { error: 'sourceChain and destChain parameters required' },
        { status: 400 }
      );
    }

    // Normalize chain names
    const normalizedSource = normalizeChainName(sourceChain);
    const normalizedDest = normalizeChainName(destChain);

    // Load source chain config
    const sourceConfig = loadChainConfig(normalizedSource);
    if (!sourceConfig) {
      return NextResponse.json(
        { error: `Source chain config not found: ${normalizedSource}` },
        { status: 404 }
      );
    }

    // Get source chain ID and RPC
    const sourceChainId = sourceConfig.chain_id || sourceConfig.chain_name;
    const sourceRpc = sourceConfig.rpc?.[0]?.address || sourceConfig.rpc?.[0];
    const sourceRpcUrl = typeof sourceRpc === 'string' ? sourceRpc : sourceRpc?.address;

    if (!sourceRpcUrl) {
      return NextResponse.json(
        { error: `No RPC endpoint found for ${normalizedSource}` },
        { status: 404 }
      );
    }

    // Get destination chain ID
    let destChainId: string;
    
    // Try to load dest chain config
    const destConfig = loadChainConfig(normalizedDest);
    if (destConfig) {
      destChainId = destConfig.chain_id || destConfig.chain_name;
    } else {
      // Fallback to common chain ID map
      destChainId = CHAIN_ID_MAP[normalizedDest] || normalizedDest;
    }

    // Strategy 1: Query IBC channels from source chain
    let channel = await queryIBCChannels(sourceRpcUrl, destChainId);

    // Strategy 2: If source RPC doesn't support IBC queries, try from destination
    if (!channel) {
      // Get destination RPC
      let destRpcUrl: string | null = null;
      if (destConfig) {
        const destRpc = destConfig.rpc?.[0]?.address || destConfig.rpc?.[0];
        destRpcUrl = typeof destRpc === 'string' ? destRpc : destRpc?.address;
      }
      
      if (destRpcUrl) {
        channel = await queryFromDestination(destRpcUrl, sourceChainId);
      }
    }

    // Strategy 3: Try chain registry as last resort
    if (!channel) {
      // Normalize chain names for registry (remove -mainnet/-testnet suffix)
      const sourceRegistryName = normalizedSource.replace(/-(mainnet|testnet|test)$/, '');
      const destRegistryName = normalizedDest.replace(/-(mainnet|testnet|test)$/, '');
      
      channel = await queryChainRegistry(sourceRegistryName, destRegistryName);
    }

    if (!channel) {
      return NextResponse.json(
        { 
          error: 'No active IBC channel found between these chains',
          sourceChain: normalizedSource,
          sourceChainId,
          destChain: normalizedDest,
          destChainId,
          hint: 'IBC connection may not exist or all strategies failed (RPC query, reverse query, chain registry)',
          strategies: [
            'Tried querying source chain RPC',
            'Tried querying destination chain RPC for counterparty',
            'Tried fetching from Cosmos chain registry'
          ]
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sourceChain: normalizedSource,
      sourceChainId,
      destChain: normalizedDest,
      destChainId,
      channel,
      status: 'STATE_OPEN',
      method: 'auto-detected',
    });
  } catch (error) {
    console.error('[IBC Channels API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
