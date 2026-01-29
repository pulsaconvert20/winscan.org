/**
 * IBC Channel Utilities
 */

/**
 * Parse IBC denom to get channel and base denom
 * 
 * @param ibcDenom - IBC denomination (e.g., "ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2")
 * @returns Object with channel and base denom
 */
export function parseIbcDenom(ibcDenom: string): { channel?: string; hash: string } {
  if (!ibcDenom.startsWith('ibc/')) {
    throw new Error('Not an IBC denom');
  }
  
  const hash = ibcDenom.substring(4);
  
  return {
    hash
  };
}

/**
 * Format IBC channel ID
 * 
 * @param channelId - Channel ID number
 * @returns Formatted channel ID (e.g., "channel-0")
 */
export function formatChannelId(channelId: number | string): string {
  return `channel-${channelId}`;
}

/**
 * Validate IBC channel ID format
 * 
 * @param channelId - Channel ID to validate
 * @returns True if valid
 */
export function isValidChannelId(channelId: string): boolean {
  return /^channel-\d+$/.test(channelId);
}
