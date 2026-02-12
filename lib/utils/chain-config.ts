/**
 * Chain Configuration Utilities
 * 
 * Helper functions for loading and accessing chain configuration files.
 */

import fs from 'fs';
import path from 'path';

export interface ChainConfig {
  chain_name: string;
  chain_id?: string;
  api?: Array<{ address: string; provider?: string }>;
  apis?: {
    rest?: Array<{ address: string; provider?: string }>;
    lcd?: Array<{ address: string; provider?: string }>;
    rpc?: Array<{ address: string; provider?: string; tx_index?: string }>;
  };
  rpc?: Array<{ address: string; provider?: string; tx_index?: string }>;
  assets?: Array<{ 
    base?: string; 
    denom_units?: Array<{ denom: string; exponent: number }> 
  }>;
}

/**
 * Load all chain configuration files from the Chains directory
 */
export function loadAllChainConfigs(): ChainConfig[] {
  const chainsDir = path.join(process.cwd(), 'Chains');
  const files = fs.readdirSync(chainsDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  
  return files.map(file => {
    const content = fs.readFileSync(path.join(chainsDir, file), 'utf-8');
    return JSON.parse(content);
  });
}

/**
 * Find a specific chain configuration by name or ID
 * 
 * @param chainIdentifier - Chain name or chain ID
 * @returns Chain configuration or null if not found
 */
export function findChainConfig(chainIdentifier: string): ChainConfig | null {
  const chains = loadAllChainConfigs();
  
  return chains.find((c: ChainConfig) => 
    c.chain_name === chainIdentifier || 
    c.chain_id === chainIdentifier ||
    c.chain_name.toLowerCase() === chainIdentifier.toLowerCase() ||
    c.chain_id?.toLowerCase() === chainIdentifier.toLowerCase() ||
    c.chain_name.toLowerCase().replace(/\s+/g, '-') === chainIdentifier.toLowerCase()
  ) || null;
}

/**
 * Get the primary REST/LCD endpoint for a chain
 * 
 * @param chainConfig - Chain configuration
 * @returns REST endpoint URL or null if not available
 */
export function getRestEndpoint(chainConfig: ChainConfig): string | null {
  return chainConfig.api?.[0]?.address || 
         chainConfig.apis?.rest?.[0]?.address || 
         chainConfig.apis?.lcd?.[0]?.address || 
         null;
}

/**
 * Get all REST/LCD endpoints for a chain
 * 
 * @param chainConfig - Chain configuration
 * @returns Array of REST endpoint URLs
 */
export function getAllRestEndpoints(chainConfig: ChainConfig): Array<{ address: string; provider?: string }> {
  return chainConfig.api || 
         chainConfig.apis?.rest || 
         chainConfig.apis?.lcd || 
         [];
}

/**
 * Get the primary RPC endpoint for a chain
 * 
 * @param chainConfig - Chain configuration
 * @returns RPC endpoint URL or null if not available
 */
export function getRpcEndpoint(chainConfig: ChainConfig): string | null {
  return chainConfig.rpc?.[0]?.address || 
         chainConfig.apis?.rpc?.[0]?.address || 
         null;
}

/**
 * Get the main denomination for a chain
 * 
 * @param chainConfig - Chain configuration
 * @returns Main denomination or null if not available
 */
export function getMainDenom(chainConfig: ChainConfig): string | null {
  return chainConfig.assets?.[0]?.base || null;
}
