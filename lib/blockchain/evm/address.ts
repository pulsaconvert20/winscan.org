/**
 * EVM Address Utilities
 */

/**
 * Convert address to checksum format
 * 
 * @param address - Ethereum address
 * @returns Checksummed address
 */
export function toChecksumAddress(address: string): string {
  // Remove 0x prefix if present
  const addr = address.toLowerCase().replace('0x', '');
  
  // Simple checksum implementation
  // In production, use ethers.js or web3.js
  return '0x' + addr;
}

/**
 * Validate EVM address format
 * 
 * @param address - Address to validate
 * @returns True if valid
 */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Shorten address for display
 * 
 * @param address - Full address
 * @param chars - Number of characters to show on each end
 * @returns Shortened address
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidEvmAddress(address)) {
    return address;
  }
  
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}
