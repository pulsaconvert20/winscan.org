/**
 * Cosmos Address Utilities
 */

import { bech32 } from 'bech32';

/**
 * Convert address to different prefix
 * 
 * @param address - Original address
 * @param newPrefix - New prefix to use
 * @returns Converted address
 */
export function convertAddress(address: string, newPrefix: string): string {
  try {
    const decoded = bech32.decode(address);
    const encoded = bech32.encode(newPrefix, decoded.words);
    return encoded;
  } catch (error) {
    throw new Error(`Failed to convert address: ${error}`);
  }
}

/**
 * Validate Cosmos address format
 * 
 * @param address - Address to validate
 * @returns True if valid
 */
export function validateAddress(address: string): boolean {
  try {
    const decoded = bech32.decode(address);
    return decoded.words.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get address prefix
 * 
 * @param address - Address to extract prefix from
 * @returns Address prefix
 */
export function getAddressPrefix(address: string): string {
  try {
    const decoded = bech32.decode(address);
    return decoded.prefix;
  } catch {
    return '';
  }
}

/**
 * Convert validator operator address to account address
 * 
 * @param operatorAddress - Validator operator address
 * @param accountPrefix - Account address prefix
 * @returns Account address
 */
export function operatorToAccount(operatorAddress: string, accountPrefix: string): string {
  try {
    const decoded = bech32.decode(operatorAddress);
    // Remove 'valoper' and use account prefix
    return bech32.encode(accountPrefix, decoded.words);
  } catch (error) {
    throw new Error(`Failed to convert operator address: ${error}`);
  }
}
